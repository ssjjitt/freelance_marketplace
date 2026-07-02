const db = require("../../models");
const { Op } = require("sequelize");

const Ticket = db.ticket;
const Dispute = db.dispute;
const User = db.user;
const Order = db.order;
const Service = db.service;
const Category = db.category;
const Application = db.application;
const { getOrCreateDirectChat, postSystemMessage } = require("../chat/chat.service");

// ===== HELPER FUNCTIONS =====

async function assertManager(userId) {
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

// ===== TICKETS MANAGEMENT =====

async function createTicket(userId, body) {
  const { subject, description, category } = body;

  if (!subject || !description) {
    const err = new Error("Тема и описание обязательны");
    err.statusCode = 400;
    throw err;
  }

  const ticket = await Ticket.create({
    userId,
    subject,
    description,
    category: category || "other",
  });

  return Ticket.findByPk(ticket.id, {
    include: [
      { model: User, as: "user", attributes: ["id", "username", "email"] },
    ],
  });
}

async function getTickets(managerId, query) {
  await assertManager(managerId);

  const { status, priority, category } = query;
  const where = {};

  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (category) where.category = category;

  return Ticket.findAll({
    where,
    include: [
      { model: User, as: "user", attributes: ["id", "username", "email"] },
      { model: User, as: "manager", attributes: ["id", "username", "email"] },
    ],
    order: [["createdAt", "DESC"]],
  });
}

async function getTicketById(managerId, ticketId) {
  await assertManager(managerId);

  const ticket = await Ticket.findByPk(ticketId, {
    include: [
      { model: User, as: "user", attributes: ["id", "username", "email"] },
      { model: User, as: "manager", attributes: ["id", "username", "email"] },
    ],
  });

  if (!ticket) {
    const err = new Error("Тикет не найден");
    err.statusCode = 404;
    throw err;
  }

  return ticket;
}

async function updateTicketStatus(managerId, ticketId, status, assignToSelf = false) {
  await assertManager(managerId);

  const ticket = await Ticket.findByPk(ticketId);
  if (!ticket) {
    const err = new Error("Тикет не найден");
    err.statusCode = 404;
    throw err;
  }

  const updateData = { status };
  if (assignToSelf) {
    updateData.assignedManagerId = managerId;
  }

  await ticket.update(updateData);

  return Ticket.findByPk(ticketId, {
    include: [
      { model: User, as: "user", attributes: ["id", "username", "email"] },
      { model: User, as: "manager", attributes: ["id", "username", "email"] },
    ],
  });
}

async function assignTicket(managerId, ticketId, newManagerId = null) {
  await assertManager(managerId);

  const ticket = await Ticket.findByPk(ticketId);
  if (!ticket) {
    const err = new Error("Тикет не найден");
    err.statusCode = 404;
    throw err;
  }

  const assignId = newManagerId || managerId;
  await ticket.update({ assignedManagerId: assignId });

  return Ticket.findByPk(ticketId, {
    include: [
      { model: User, as: "user", attributes: ["id", "username", "email"] },
      { model: User, as: "manager", attributes: ["id", "username", "email"] },
    ],
  });
}

// ===== DISPUTES MANAGEMENT =====

async function createDispute(userId, body) {
  const { applicationId, reason, description } = body;

  if (!applicationId || !reason) {
    const err = new Error("Отклик и причина обязательны");
    err.statusCode = 400;
    throw err;
  }

  const application = await Application.findByPk(applicationId, {
    include: [
      { model: Order, as: "order" },
      { model: Service, as: "service" },
    ],
  });

  if (!application) {
    const err = new Error("Отклик не найден");
    err.statusCode = 404;
    throw err;
  }

  const dispute = await Dispute.create({
    orderId: application.orderId,
    applicationId,
    customerId: application.orderId ? application.order?.customerId : null,
    executerId: application.userId,
    reason,
    description: description || null,
  });

  if (application.order?.customerId && application.userId) {
    const chat = await getOrCreateDirectChat(application.order.customerId, application.userId);
    if (chat) {
      await postSystemMessage(
        chat.id,
        `Открыт спор по заявке #${applicationId}. Причина: ${reason}`
      );
    }
  }

  return Dispute.findByPk(dispute.id, {
    include: [
      { model: Order, as: "order" },
      { model: Application, as: "application" },
      { model: User, as: "customer", attributes: ["id", "username", "email"] },
      { model: User, as: "executer", attributes: ["id", "username", "email"] },
    ],
  });
}

async function getDisputes(managerId, query) {
  await assertManager(managerId);

  const { status, resolution } = query;
  const where = {};

  if (status) where.status = status;
  if (resolution) where.resolution = resolution;

  return Dispute.findAll({
    where,
    include: [
      { model: Order, as: "order" },
      { model: Application, as: "application" },
      { model: User, as: "customer", attributes: ["id", "username", "email"] },
      { model: User, as: "executer", attributes: ["id", "username", "email"] },
      { model: User, as: "resolvedByManager", attributes: ["id", "username", "email"] },
    ],
    order: [["createdAt", "DESC"]],
  });
}

async function resolveDispute(managerId, disputeId, resolution, comment) {
  await assertManager(managerId);

  const validResolutions = ["customer_wins", "executer_wins", "split", "refund"];
  if (!validResolutions.includes(resolution)) {
    const err = new Error("Недопустимое решение спора");
    err.statusCode = 400;
    throw err;
  }

  const dispute = await Dispute.findByPk(disputeId);
  if (!dispute) {
    const err = new Error("Спор не найден");
    err.statusCode = 404;
    throw err;
  }

  await dispute.update({
    status: "resolved",
    resolution,
    resolutionComment: comment || null,
    resolvedByManagerId: managerId,
  });

  if (dispute.customerId && dispute.executerId) {
    const chat = await getOrCreateDirectChat(dispute.customerId, dispute.executerId);
    if (chat) {
      await postSystemMessage(chat.id, `Спор #${dispute.id} разрешен менеджером. Решение: ${resolution}.`);
    }
  }

  return Dispute.findByPk(disputeId, {
    include: [
      { model: Order, as: "order" },
      { model: Application, as: "application" },
      { model: User, as: "customer", attributes: ["id", "username", "email"] },
      { model: User, as: "executer", attributes: ["id", "username", "email"] },
      { model: User, as: "resolvedByManager", attributes: ["id", "username", "email"] },
    ],
  });
}

// ===== ORDERS MANAGEMENT =====

async function getOrder(managerId, orderId) {
  await assertManager(managerId);

  const order = await Order.findByPk(orderId, {
    include: [
      { model: User, as: "customer", attributes: ["id", "username", "email"] },
      { model: Category, as: "category", attributes: ["id", "name"] },
    ],
  });

  if (!order) {
    const err = new Error("Заказ не найден");
    err.statusCode = 404;
    throw err;
  }

  return order;
}

async function getOrders(managerId) {
  await assertManager(managerId);

  return Order.findAll({
    include: [
      { model: User, as: "customer", attributes: ["id", "username", "email"] },
      { model: Category, as: "category", attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
  });
}

async function hideOrder(managerId, orderId, reason) {
  await assertManager(managerId);

  const order = await Order.findByPk(orderId);
  if (!order) {
    const err = new Error("Заказ не найден");
    err.statusCode = 404;
    throw err;
  }

  // Обновляем статус и сохраняем причину модерации
  await order.update({ 
    status: "hidden",
    isModerated: true,
    moderationReason: reason || "Нарушение правил платформы",
    moderatorTrustBadge: false,
  });

  return order;
}

async function closeOrder(managerId, orderId) {
  await assertManager(managerId);

  const order = await Order.findByPk(orderId);
  if (!order) {
    const err = new Error("Заказ не найден");
    err.statusCode = 404;
    throw err;
  }

  await order.update({ status: "closed" });
  return order;
}

async function unhideOrder(managerId, orderId) {
  await assertManager(managerId);

  const order = await Order.findByPk(orderId);
  if (!order) {
    const err = new Error("Заказ не найден");
    err.statusCode = 404;
    throw err;
  }
  if (order.status !== "hidden") {
    const err = new Error("Можно вернуть в каталог только скрытый заказ");
    err.statusCode = 400;
    throw err;
  }

  await order.update({
    status: "open",
    isModerated: false,
    moderationReason: null,
    moderatorTrustBadge: true,
  });

  return Order.findByPk(orderId, {
    include: [
      { model: User, as: "customer", attributes: ["id", "username", "email"] },
      { model: Category, as: "category", attributes: ["id", "name"] },
    ],
  });
}

async function reopenOrder(managerId, orderId) {
  await assertManager(managerId);

  const order = await Order.findByPk(orderId);
  if (!order) {
    const err = new Error("Заказ не найден");
    err.statusCode = 404;
    throw err;
  }
  if (order.status !== "closed") {
    const err = new Error("Можно открыть только закрытый заказ");
    err.statusCode = 400;
    throw err;
  }

  await order.update({
    status: "open",
    moderatorTrustBadge: true,
  });

  return Order.findByPk(orderId, {
    include: [
      { model: User, as: "customer", attributes: ["id", "username", "email"] },
      { model: Category, as: "category", attributes: ["id", "name"] },
    ],
  });
}

async function grantOrderTrustBadge(managerId, orderId) {
  await assertManager(managerId);

  const order = await Order.findByPk(orderId);
  if (!order) {
    const err = new Error("Заказ не найден");
    err.statusCode = 404;
    throw err;
  }
  if (order.status === "hidden") {
    const err = new Error("Сначала верните заказ в каталог");
    err.statusCode = 400;
    throw err;
  }

  await order.update({ moderatorTrustBadge: true });

  return Order.findByPk(orderId, {
    include: [
      { model: User, as: "customer", attributes: ["id", "username", "email"] },
      { model: Category, as: "category", attributes: ["id", "name"] },
    ],
  });
}

// ===== SERVICES (moderation) =====

async function getServices(managerId) {
  await assertManager(managerId);

  return Service.findAll({
    include: [
      { model: User, as: "executer", attributes: ["id", "username", "email"] },
      { model: Category, as: "category", attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
  });
}

async function getServiceById(managerId, serviceId) {
  await assertManager(managerId);

  const service = await Service.findByPk(serviceId, {
    include: [
      { model: User, as: "executer", attributes: ["id", "username", "email"] },
      { model: Category, as: "category", attributes: ["id", "name"] },
    ],
  });
  if (!service) {
    const err = new Error("Услуга не найдена");
    err.statusCode = 404;
    throw err;
  }
  return service;
}

async function hideService(managerId, serviceId) {
  await assertManager(managerId);

  const service = await Service.findByPk(serviceId);
  if (!service) {
    const err = new Error("Услуга не найдена");
    err.statusCode = 404;
    throw err;
  }

  await service.update({ isActive: false });
  return Service.findByPk(serviceId, {
    include: [
      { model: User, as: "executer", attributes: ["id", "username", "email"] },
      { model: Category, as: "category", attributes: ["id", "name"] },
    ],
  });
}

async function unhideService(managerId, serviceId) {
  await assertManager(managerId);

  const service = await Service.findByPk(serviceId);
  if (!service) {
    const err = new Error("Услуга не найдена");
    err.statusCode = 404;
    throw err;
  }

  const patch = { isActive: true };
  if (service.status === "cancelled") {
    patch.status = "active";
  }

  await service.update(patch);
  return Service.findByPk(serviceId, {
    include: [
      { model: User, as: "executer", attributes: ["id", "username", "email"] },
      { model: Category, as: "category", attributes: ["id", "name"] },
    ],
  });
}

async function closeService(managerId, serviceId) {
  await assertManager(managerId);

  const service = await Service.findByPk(serviceId);
  if (!service) {
    const err = new Error("Услуга не найдена");
    err.statusCode = 404;
    throw err;
  }

  await service.update({ status: "cancelled", isActive: false });
  return Service.findByPk(serviceId, {
    include: [
      { model: User, as: "executer", attributes: ["id", "username", "email"] },
      { model: Category, as: "category", attributes: ["id", "name"] },
    ],
  });
}

// ===== USERS MANAGEMENT =====

async function getUserForModeration(managerId, userId) {
  await assertManager(managerId);

  const user = await User.findByPk(userId, {
    include: [
      { model: db.profile, as: "profile" },
      { model: db.role, as: "roles" },
    ],
  });

  if (!user) {
    const err = new Error("Пользователь не найден");
    err.statusCode = 404;
    throw err;
  }

  return user;
}

async function getUsersForModeration(managerId, query = {}) {
  await assertManager(managerId);

  const where = {};
  if (query.blockedOnly === "true") {
    where.isBlocked = true;
  }

  return User.findAll({
    where,
    include: [{ model: db.role, as: "roles", through: { attributes: [] } }],
    order: [["createdAt", "DESC"]],
  });
}

async function findUserForModerationByUsername(managerId, username) {
  await assertManager(managerId);

  const normalizedUsername = String(username || "").trim();
  if (!normalizedUsername) {
    const err = new Error("Имя пользователя обязательно");
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findOne({
    where: {
      [Op.and]: [db.sequelize.where(db.sequelize.fn("LOWER", db.sequelize.col("username")), normalizedUsername.toLowerCase())],
    },
    include: [
      { model: db.profile, as: "profile" },
      { model: db.role, as: "roles" },
    ],
  });

  if (!user) {
    const err = new Error("Пользователь не найден");
    err.statusCode = 404;
    throw err;
  }

  return user;
}

async function blockUser(managerId, userId) {
  await assertManager(managerId);

  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error("Пользователь не найден");
    err.statusCode = 404;
    throw err;
  }

  await user.update({ isBlocked: true });
  return user;
}

async function unblockUser(managerId, userId) {
  await assertManager(managerId);

  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error("Пользователь не найден");
    err.statusCode = 404;
    throw err;
  }

  await user.update({ isBlocked: false });
  return user;
}

// ===== STATISTICS =====

async function getManagerStats(managerId) {
  await assertManager(managerId);

  const stats = {
    tickets: {
      total: await Ticket.count(),
      open: await Ticket.count({ where: { status: "open" } }),
      inProgress: await Ticket.count({ where: { status: "in_progress" } }),
      resolved: await Ticket.count({ where: { status: "resolved" } }),
    },
    disputes: {
      total: await Dispute.count(),
      open: await Dispute.count({ where: { status: "open" } }),
      inReview: await Dispute.count({ where: { status: "in_review" } }),
      resolved: await Dispute.count({ where: { status: "resolved" } }),
    },
    users: {
      total: await User.count(),
      blocked: await User.count({ where: { isBlocked: true } }),
      active: await User.count({ where: { isBlocked: false } }),
    },
    moderation: {
      resumesPending: await db.resume.count({ where: { isApproved: false, isActive: true } }),
      servicesPending: await Service.count({ where: { isApproved: false, isActive: true } }),
      ordersActive: await Order.count({ where: { status: "open" } }),
    },
  };

  return stats;
}

module.exports = {
  assertManager,
  // Tickets
  createTicket,
  getTickets,
  getTicketById,
  updateTicketStatus,
  assignTicket,
  // Disputes
  createDispute,
  getDisputes,
  resolveDispute,
  // Orders
  getOrders,
  getOrder,
  hideOrder,
  closeOrder,
  unhideOrder,
  reopenOrder,
  grantOrderTrustBadge,
  // Services (moderation actions)
  getServices,
  getServiceById,
  hideService,
  unhideService,
  closeService,
  // Users
  getUsersForModeration,
  getUserForModeration,
  findUserForModerationByUsername,
  blockUser,
  unblockUser,
  // Statistics
  getManagerStats,
};
