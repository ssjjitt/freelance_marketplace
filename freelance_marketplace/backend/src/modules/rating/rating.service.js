const db = require("../../models");
const Rating = db.rating;
const User = db.user;
const Order = db.order;
const Service = db.service;

async function createRating(currentUserId, body) {
  const { toUserId, orderId, serviceId, rating, comment } = body;

  if (currentUserId === toUserId) {
    const err = new Error("Вы не можете оценить самого себя");
    err.statusCode = 403;
    throw err;
  }

  if (!rating || rating < 1 || rating > 5) {
    const err = new Error("Рейтинг должен быть от 1 до 5");
    err.statusCode = 400;
    throw err;
  }

  const toUser = await User.findByPk(toUserId);
  if (!toUser) {
    const err = new Error("Пользователь не найден");
    err.statusCode = 404;
    throw err;
  }

  if (orderId) {
    const order = await Order.findByPk(orderId);
    if (!order) {
      const err = new Error("Заказ не найден");
      err.statusCode = 404;
      throw err;
    }
  }

  if (serviceId) {
    const service = await Service.findByPk(serviceId);
    if (!service) {
      const err = new Error("Услуга не найдена");
      err.statusCode = 404;
      throw err;
    }
  }

  const newRating = await Rating.create({
    fromUserId: currentUserId,
    toUserId,
    orderId: orderId || null,
    serviceId: serviceId || null,
    rating,
    comment: comment || null,
  });

  const ratings = await Rating.findAll({
    where: { toUserId },
    attributes: ["rating"],
  });
  const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

  const profile = await db.profile.findOne({ where: { userId: toUserId } });
  if (profile) {
    await profile.update({ rating: avgRating });
  }

  return Rating.findByPk(newRating.id, {
    include: [
      { model: User, as: "fromUser", attributes: ["id", "username", "email"] },
      { model: User, as: "toUser", attributes: ["id", "username", "email"] },
    ],
  });
}

async function listRatings(query) {
  const { userId } = query;
  const where = {};
  if (userId) {
    where.toUserId = userId;
  }

  return Rating.findAll({
    where,
    include: [
      { model: User, as: "fromUser", attributes: ["id", "username", "email"] },
      { model: User, as: "toUser", attributes: ["id", "username", "email"] },
      { model: Order, as: "order" },
      { model: Service, as: "service" },
    ],
    order: [["createdAt", "DESC"]],
  });
}

module.exports = {
  createRating,
  listRatings,
};
