const db = require("../../models");
const Favorite = db.favorite;
const User = db.user;

async function assertCustomer(userId) {
  const user = await User.findByPk(userId, {
    include: [{ model: db.role, as: "roles", through: { attributes: [] } }],
  });
  const userRoles = user.roles.map((r) => r.name);
  if (!userRoles.includes("customer")) {
    const err = new Error("Только заказчики могут добавлять избранных исполнителей");
    err.statusCode = 403;
    throw err;
  }
}

async function addFavorite(currentUserId, executerId) {
  await assertCustomer(currentUserId);

  if (currentUserId === executerId) {
    const err = new Error("Вы не можете добавить себя в избранное");
    err.statusCode = 403;
    throw err;
  }

  const executer = await User.findByPk(executerId);
  if (!executer) {
    const err = new Error("Исполнитель не найден");
    err.statusCode = 404;
    throw err;
  }

  const [favorite, created] = await Favorite.findOrCreate({
    where: {
      customerId: currentUserId,
      executerId,
    },
  });

  if (!created) {
    const err = new Error("Исполнитель уже в избранном");
    err.statusCode = 400;
    throw err;
  }

  return Favorite.findByPk(favorite.id, {
    include: [
      { model: User, as: "customer", attributes: ["id", "username", "email"] },
      { model: User, as: "executer", attributes: ["id", "username", "email"] },
    ],
  });
}

async function removeFavorite(currentUserId, executerId) {
  const favorite = await Favorite.findOne({
    where: {
      customerId: currentUserId,
      executerId,
    },
  });

  if (!favorite) {
    const err = new Error("Исполнитель не найден в избранном");
    err.statusCode = 404;
    throw err;
  }

  await favorite.destroy();
}

async function listFavorites(currentUserId) {
  return Favorite.findAll({
    where: { customerId: currentUserId },
    include: [
      {
        model: User,
        as: "executer",
        attributes: ["id", "username", "email"],
        include: [{ model: db.profile, as: "profile" }],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
}

module.exports = {
  addFavorite,
  removeFavorite,
  listFavorites,
};
