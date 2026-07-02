const db = require("../../models");
const Resume = db.resume;
const User = db.user;
const { createNotification } = require("../notification/notification.service");

async function assertExecuter(userId) {
  const user = await User.findByPk(userId, {
    include: [{ model: db.role, as: "roles", through: { attributes: [] } }],
  });
  if (!user) {
    const err = new Error("Пользователь не найден");
    err.statusCode = 404;
    throw err;
  }
  const userRoles = user.roles.map((r) => r.name);
  if (!userRoles.includes("executer")) {
    const err = new Error("Только исполнители могут создавать резюме");
    err.statusCode = 403;
    throw err;
  }
}

async function assertAdministrator(userId) {
  const user = await User.findByPk(userId, {
    include: [{ model: db.role, as: "roles", through: { attributes: [] } }],
  });
  const userRoles = user.roles.map((r) => r.name);
  if (!userRoles.includes("administrator")) {
    const err = new Error("Доступ запрещен");
    err.statusCode = 403;
    throw err;
  }
}

async function assertManagerOrAdmin(userId) {
  const user = await User.findByPk(userId, {
    include: [{ model: db.role, as: "roles", through: { attributes: [] } }],
  });
  if (!user) {
    const err = new Error("Пользователь не найден");
    err.statusCode = 404;
    throw err;
  }
  const userRoles = user.roles.map((r) => r.name);
  if (!userRoles.includes("manager") && !userRoles.includes("administrator")) {
    const err = new Error("Доступ запрещен");
    err.statusCode = 403;
    throw err;
  }
}

function mapSequelizeError(error) {
  if (error.name === "SequelizeValidationError") {
    const messages = error.errors.map((e) => e.message).join(", ");
    const err = new Error(`Ошибка валидации: ${messages}`);
    err.statusCode = 400;
    throw err;
  }
  if (error.name === "SequelizeUniqueConstraintError") {
    const err = new Error("Резюме с такими данными уже существует");
    err.statusCode = 400;
    throw err;
  }
  if (error.name === "SequelizeDatabaseError") {
    const err = new Error("Ошибка базы данных: " + error.message);
    err.statusCode = 500;
    throw err;
  }
  throw error;
}

async function createResume(currentUserId, body) {
  const { title, description, experience, education, skills, portfolio } = body;

  if (!title || !description) {
    const err = new Error("Название и описание обязательны для заполнения");
    err.statusCode = 400;
    throw err;
  }

  try {
    await assertExecuter(currentUserId);

    const resume = await Resume.create({
      executerId: currentUserId,
      title: title.trim(),
      description: description.trim(),
      experience: experience ? experience.trim() : null,
      education: education ? education.trim() : null,
      skills: skills ? skills.trim() : null,
      portfolio: portfolio ? portfolio.trim() : null,
    });

    return Resume.findByPk(resume.id, {
      include: [{ model: User, as: "executer", attributes: ["id", "username", "email"] }],
    });
  } catch (error) {
    mapSequelizeError(error);
  }
}

async function listResumes(query) {
  const { executerId } = query;
  const where = {};

  if (executerId) {
    where.executerId = executerId;
  } else {
    where.isApproved = true;
    where.isActive = true;
  }

  return Resume.findAll({
    where,
    include: [{ model: User, as: "executer", attributes: ["id", "username", "email"] }],
    order: [["createdAt", "DESC"]],
  });
}

async function getResumeById(id) {
  const resume = await Resume.findByPk(id, {
    include: [{ model: User, as: "executer", attributes: ["id", "username", "email"] }],
  });
  if (!resume) {
    const err = new Error("Резюме не найдено");
    err.statusCode = 404;
    throw err;
  }
  return resume;
}

async function updateResume(currentUserId, id, body) {
  const { title, description, experience, education, skills, portfolio, isActive } = body;
  const resume = await Resume.findByPk(id);
  if (!resume) {
    const err = new Error("Резюме не найдено");
    err.statusCode = 404;
    throw err;
  }
  if (resume.executerId !== currentUserId) {
    const err = new Error("Вы можете редактировать только свои резюме");
    err.statusCode = 403;
    throw err;
  }

  await resume.update({
    title: title || resume.title,
    description: description || resume.description,
    experience: experience !== undefined ? experience : resume.experience,
    education: education !== undefined ? education : resume.education,
    skills: skills !== undefined ? skills : resume.skills,
    portfolio: portfolio !== undefined ? portfolio : resume.portfolio,
    isActive: isActive !== undefined ? isActive : resume.isActive,
    isApproved: false,
  });

  return Resume.findByPk(id, {
    include: [{ model: User, as: "executer", attributes: ["id", "username", "email"] }],
  });
}

async function deleteResume(currentUserId, id) {
  const resume = await Resume.findByPk(id);
  if (!resume) {
    const err = new Error("Резюме не найдено");
    err.statusCode = 404;
    throw err;
  }
  if (resume.executerId !== currentUserId) {
    const err = new Error("Вы можете удалять только свои резюме");
    err.statusCode = 403;
    throw err;
  }
  await resume.destroy();
}

async function approveResume(adminUserId, id) {
  await assertManagerOrAdmin(adminUserId);

  const resume = await Resume.findByPk(id);
  if (!resume) {
    const err = new Error("Резюме не найдено");
    err.statusCode = 404;
    throw err;
  }

  await resume.update({ isApproved: true });

  await createNotification(
    resume.executerId,
    "resume_approved",
    "Резюме одобрено",
    `Ваше резюме "${resume.title}" было одобрено модератором и теперь видно в каталоге`,
    resume.id,
    "resume"
  );

  return Resume.findByPk(id, {
    include: [{ model: User, as: "executer", attributes: ["id", "username", "email"] }],
  });
}

async function listPendingResumes(adminUserId) {
  await assertManagerOrAdmin(adminUserId);

  return Resume.findAll({
    where: { isApproved: false },
    include: [{ model: User, as: "executer", attributes: ["id", "username", "email"] }],
    order: [["createdAt", "ASC"]],
  });
}

module.exports = {
  createResume,
  listResumes,
  getResumeById,
  updateResume,
  deleteResume,
  approveResume,
  listPendingResumes,
};
