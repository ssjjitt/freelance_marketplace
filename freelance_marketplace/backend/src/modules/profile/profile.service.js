const { Op } = require("sequelize");
const db = require("../../models");
const User = db.user;
const Role = db.role;
const Profile = db.profile;
const Skill = db.skill;
const Contact = db.contact;
const Application = db.application;
const Rating = db.rating;

async function fetchUserWithProfile(userId, transaction) {
  return User.findByPk(userId, {
    include: [
      {
        model: Role,
        as: "roles",
        through: { attributes: [] },
      },
      {
        model: Profile,
        as: "profile",
        include: [
          {
            model: Skill,
            as: "skills",
            through: { attributes: [] },
          },
          {
            model: Contact,
            as: "contacts",
          },
        ],
      },
    ],
    transaction,
  });
}

function buildContactGroups(contacts = []) {
  const grouped = {
    messengers: [],
    socialNetworks: [],
    other: [],
  };

  contacts.forEach((contact) => {
    const normalized = {
      id: contact.id,
      platform: contact.platform,
      username: contact.username,
      url: contact.url,
      phone: contact.phone,
      email: contact.email,
      isPublic: contact.isPublic,
    };

    if (contact.type === "messenger") {
      grouped.messengers.push(normalized);
    } else if (contact.type === "social") {
      grouped.socialNetworks.push(normalized);
    } else {
      grouped.other.push(normalized);
    }
  });

  return grouped;
}

async function calculateUserStats(userId) {
  try {
    const applicationsCount = await Application.count({
      where: { userId },
    });

    const ratings = await Rating.findAll({
      where: { toUserId: userId },
      attributes: ["rating"],
    });

    const avgRating =
      ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0;

    return {
      applicationsCount,
      rating: parseFloat(avgRating.toFixed(1)),
    };
  } catch (error) {
    return {
      applicationsCount: 0,
      rating: 0,
    };
  }
}

function formatWorkPayload(user, profile, stats, profileViews) {
  const fullName = [profile.name, profile.lastname].filter(Boolean).join(" ").trim();
  const location = [profile.country, profile.city].filter(Boolean).join(", ").trim();

  return {
    user: {
      id: user.id,
      username: user.username,
      fullName: fullName || user.username,
      email: profile.email || user.email,
      roles: user.roles.map((role) => role.name),
      isBlocked: user.isBlocked,
    },
    summary: {
      location: location || "Локация не указана",
      phone: profile.phone || "",
      website: profile.website || "",
      availability: profile.availability || "Открыт для сотрудничества",
    },
    stats,
    skills: (profile.skills || []).map((skill) => skill.name),
    education: profile.education || "",
    contacts: buildContactGroups(profile.contacts || []),
    about: profile.about || "",
    avatar: profile.avatar || null,
    lastSeen: user.lastSeen || null,
    profileViews: profileViews ?? profile.profileViews ?? 0,
  };
}

async function getProfile(currentUserId) {
  const user = await fetchUserWithProfile(currentUserId);
  if (!user) {
    const err = new Error("Пользователь не найден");
    err.statusCode = 404;
    throw err;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    roles: user.roles.map((role) => role.name),
    profile: user.profile || null,
  };
}

async function updateProfile(currentUserId, body) {
  const transaction = await db.sequelize.transaction();
  try {
    const { profileData, contactsData, skillsData } = body;

    let profile = await Profile.findOne({
      where: { userId: currentUserId },
      transaction,
    });

    if (profile) {
      await profile.update(profileData, { transaction });
    } else {
      profile = await Profile.create(
        {
          userId: currentUserId,
          ...profileData,
        },
        { transaction }
      );
    }

    if (Array.isArray(skillsData)) {
      const skills = skillsData.length
        ? await Skill.findAll({
            where: { name: skillsData },
            transaction,
          })
        : [];
      await profile.setSkills(skills, { transaction });
    }

    if (Array.isArray(contactsData)) {
      await Contact.destroy({
        where: { profileId: profile.id },
        transaction,
      });

      if (contactsData.length > 0) {
        await Contact.bulkCreate(
          contactsData.map((contact) => ({
            profileId: profile.id,
            ...contact,
          })),
          { transaction }
        );
      }
    }

    await transaction.commit();

    const updatedUser = await fetchUserWithProfile(currentUserId);
    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      roles: updatedUser.roles.map((role) => role.name),
      profile: updatedUser.profile,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function getWorkProfile(currentUserId) {
  const user = await fetchUserWithProfile(currentUserId);
  if (!user) {
    const err = new Error("Пользователь не найден");
    err.statusCode = 404;
    throw err;
  }

  const profile = user.profile || {};
  const calculatedStats = await calculateUserStats(currentUserId);
  return formatWorkPayload(user, profile, calculatedStats, profile.profileViews);
}

function isAdminUser(user) {
  return user.roles.some(
    (role) => role.name === "administrator" || role.name === "ADMINISTRATOR"
  );
}

async function getUserWorkProfile(currentUserId, targetUserId) {
  const user = await fetchUserWithProfile(Number(targetUserId));
  if (!user) {
    const err = new Error("Пользователь не найден");
    err.statusCode = 404;
    throw err;
  }

  const currentUser = await fetchUserWithProfile(currentUserId);
  const admin = isAdminUser(currentUser);

  if (user.isBlocked && !admin) {
    const err = new Error("Пользователь заблокирован");
    err.statusCode = 403;
    throw err;
  }

  const profile = user.profile || {};
  const calculatedStats = await calculateUserStats(Number(targetUserId));

  let finalProfileViews = profile.profileViews || 0;

  if (currentUserId !== Number(targetUserId)) {
    await User.update({ lastSeen: new Date() }, { where: { id: Number(targetUserId) } });

    if (profile.id) {
      await Profile.increment("profileViews", {
        where: { id: profile.id },
      });
      finalProfileViews = (profile.profileViews || 0) + 1;
    }
  }

  return formatWorkPayload(user, profile, calculatedStats, finalProfileViews);
}

async function uploadAvatar(currentUserId, avatar) {
  if (!avatar) {
    const err = new Error("Аватар не предоставлен");
    err.statusCode = 400;
    throw err;
  }

  if (typeof avatar !== "string" || !avatar.startsWith("data:image/")) {
    const err = new Error("Неверный формат аватара");
    err.statusCode = 400;
    throw err;
  }

  if (avatar.length > 10000000) {
    const err = new Error(
      "Размер аватара слишком большой. Пожалуйста, используйте изображение меньшего размера."
    );
    err.statusCode = 400;
    throw err;
  }

  const transaction = await db.sequelize.transaction();
  try {
    let profile = await Profile.findOne({
      where: { userId: currentUserId },
      transaction,
    });

    if (profile) {
      await profile.update({ avatar }, { transaction });
    } else {
      profile = await Profile.create(
        {
          userId: currentUserId,
          avatar,
        },
        { transaction }
      );
    }

    await transaction.commit();

    const updatedUser = await fetchUserWithProfile(currentUserId);
    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      roles: updatedUser.roles.map((role) => role.name),
      profile: updatedUser.profile,
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function searchUsers(currentUserId, searchQuery) {
  const currentUser = await fetchUserWithProfile(currentUserId);
  const admin = isAdminUser(currentUser);

  const where = {
    id: { [Op.ne]: currentUserId },
  };

  if (!admin) {
    where.isBlocked = false;
  }

  if (searchQuery && searchQuery.trim().length > 0) {
    const searchLower = searchQuery.trim().toLowerCase();
    const searchTerm = `%${searchLower}%`;
    const Sequelize = db.sequelize.Sequelize;

    where[Op.or] = [
      Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("users.username")), {
        [Op.like]: searchTerm,
      }),
      Sequelize.where(Sequelize.fn("LOWER", Sequelize.col("users.email")), {
        [Op.like]: searchTerm,
      }),
      Sequelize.literal(`EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE profiles.userId = users.id 
                    AND (
                        LOWER(profiles.name) LIKE '${searchTerm.replace(/'/g, "''")}' 
                        OR LOWER(profiles.lastname) LIKE '${searchTerm.replace(/'/g, "''")}'
                    )
                )`),
    ];
  }

  const users = await User.findAll({
    where,
    include: [
      {
        model: Role,
        as: "roles",
        through: { attributes: [] },
      },
      {
        model: Profile,
        as: "profile",
        include: [
          {
            model: Skill,
            as: "skills",
            through: { attributes: [] },
          },
        ],
        required: false,
      },
    ],
    attributes: ["id", "username", "email"],
    limit: 50,
    order: [["username", "ASC"]],
  });

  return users.map((user) => {
    const profile = user.profile || {};
    const fullName = [profile.name, profile.lastname].filter(Boolean).join(" ").trim();

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: fullName || user.username,
      avatar: profile.avatar || null,
      roles: user.roles.map((role) => role.name),
      skills: (profile.skills || []).map((skill) => skill.name),
      location: [profile.country, profile.city].filter(Boolean).join(", ").trim() || null,
    };
  });
}

module.exports = {
  getProfile,
  updateProfile,
  getWorkProfile,
  getUserWorkProfile,
  uploadAvatar,
  searchUsers,
};
