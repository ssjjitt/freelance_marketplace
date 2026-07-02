const { Op } = require("sequelize");
const db = require("../../models");
const Order = db.order;
const User = db.user;
const Category = db.category;
const Application = db.application;
const { createNotification } = require("../notification/notification.service");

async function assertCustomer(userId) {
  const user = await User.findByPk(userId, {
    include: [{ model: db.role, as: "roles", through: { attributes: [] } }],
  });
  const userRoles = user.roles.map((r) => r.name);
  if (!userRoles.includes("customer")) {
    const err = new Error("Только заказчики могут создавать заказы");
    err.statusCode = 403;
    throw err;
  }
}

async function createOrder(currentUserId, body) {
  await assertCustomer(currentUserId);
  const { title, description, budget, deadline, categoryId } = body;

  const order = await Order.create({
    customerId: currentUserId,
    title,
    description,
    budget: budget || null,
    deadline: deadline || null,
    categoryId,
    moderatorTrustBadge: false,
  });

  return Order.findByPk(order.id, {
    include: [
      { model: Category, as: "category" },
      { model: User, as: "customer", attributes: ["id", "username", "email"] },
      { model: db.attachment, as: "attachments", required: false },
    ],
  });
}

async function resolveCategoryIds(categoryId) {
  const categories = await Category.findAll({
    where: {
      [Op.or]: [{ id: categoryId }, { parentId: categoryId }],
    },
  });
  return categories.map((c) => c.id);
}

function buildOrderListWhere(query) {
  const { categoryId, search, status, minPrice, maxPrice } = query;
  const where = {};

  return { where, categoryId, search, status, minPrice, maxPrice };
}

async function applyCategoryFilter(where, categoryId) {
  if (!categoryId) return;
  const categoryIds = await resolveCategoryIds(categoryId);
  if (categoryIds.length > 0) {
    where.categoryId = { [Op.in]: categoryIds };
  } else {
    where.categoryId = categoryId;
  }
}

function applyStatusFilter(where, status, catalogOnly) {
  if (status) {
    where.status = status;
  } else {
    const excluded = ["completed", "cancelled"];
    if (catalogOnly) excluded.push("hidden");
    where.status = { [Op.notIn]: excluded };
  }
}

function applyBudgetFilters(where, minPrice, maxPrice) {
  if (minPrice) {
    where.budget = { ...where.budget, [Op.gte]: Number(minPrice) };
  }
  if (maxPrice) {
    where.budget = { ...where.budget, [Op.lte]: Number(maxPrice) };
  }
}

function applySearchFilter(where, search) {
  if (search && typeof search === "string" && search.trim().length > 0) {
    const searchTerm = `%${search.trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: searchTerm } },
      { description: { [Op.like]: searchTerm } },
    ];
  }
}

function buildOrderClause(sortBy, sortOrder) {
  let orderClause = [["createdAt", "DESC"]];
  if (!sortBy) return orderClause;
  const direction = sortOrder === "ASC" ? "ASC" : "DESC";
  if (sortBy === "price") orderClause = [["budget", direction]];
  else if (sortBy === "date") orderClause = [["createdAt", direction]];
  else if (sortBy === "title") orderClause = [["title", direction]];
  return orderClause;
}

async function listOrders(query) {
  const onlyCatalog =
    query.catalogOnly === true ||
    query.catalogOnly === "true" ||
    query.catalogOnly === "1";

  const { where } = buildOrderListWhere(query);
  await applyCategoryFilter(where, query.categoryId);
  applyStatusFilter(where, query.status, onlyCatalog);
  applyBudgetFilters(where, query.minPrice, query.maxPrice);
  applySearchFilter(where, query.search);
  /** catalogOnly только исключает скрытые заказы из дефолтного фильтра статусов;
   * одобрение менеджера (moderatorTrustBadge) не фильтруем — бейдж на фронте только при === true */
  const orderClause = buildOrderClause(query.sortBy, query.sortOrder);

  return Order.findAll({
    where,
    include: [
      { model: Category, as: "category" },
      { model: User, as: "customer", attributes: ["id", "username", "email"] },
      { model: Application, as: "applications" },
      { model: db.attachment, as: "attachments", required: false },
    ],
    order: orderClause,
  });
}

async function getOrderById(id) {
  const order = await Order.findByPk(id, {
    include: [
      { model: Category, as: "category" },
      { model: User, as: "customer", attributes: ["id", "username", "email"] },
      {
        model: Application,
        as: "applications",
        include: [{ model: User, as: "user", attributes: ["id", "username", "email"] }],
      },
      { model: db.attachment, as: "attachments", required: false },
    ],
  });
  if (!order) {
    const err = new Error("Заказ не найден");
    err.statusCode = 404;
    throw err;
  }
  return order;
}

async function notifyApprovedApplicantsOnStatusChange(orderId, orderTitle, newStatus) {
  const applications = await Application.findAll({
    where: { orderId, status: "approved" },
    include: [{ model: User, as: "user", attributes: ["id"] }],
  });

  for (const app of applications) {
    await createNotification(
      app.userId,
      "order_status_changed",
      "Изменен статус заказа",
      `Статус заказа "${orderTitle}" изменен на "${newStatus}"`,
      orderId,
      "order"
    );
  }
}

async function updateOrder(currentUserId, id, body) {
  const { title, description, budget, deadline, categoryId, status } = body;
  const order = await Order.findByPk(id);
  if (!order) {
    const err = new Error("Заказ не найден");
    err.statusCode = 404;
    throw err;
  }
  if (order.customerId !== currentUserId) {
    const err = new Error("Вы можете редактировать только свои заказы");
    err.statusCode = 403;
    throw err;
  }

  const oldStatus = order.status;
  await order.update({
    title: title || order.title,
    description: description || order.description,
    budget: budget !== undefined ? budget : order.budget,
    deadline: deadline || order.deadline,
    categoryId: categoryId || order.categoryId,
    status: status || order.status,
  });

  if (status && status !== oldStatus) {
    await notifyApprovedApplicantsOnStatusChange(id, order.title, status);
  }

  return Order.findByPk(id, {
    include: [
      { model: Category, as: "category" },
      { model: User, as: "customer", attributes: ["id", "username", "email"] },
      { model: db.attachment, as: "attachments", required: false },
    ],
  });
}

async function deleteOrder(currentUserId, id) {
  const order = await Order.findByPk(id);
  if (!order) {
    const err = new Error("Заказ не найден");
    err.statusCode = 404;
    throw err;
  }
  if (order.customerId !== currentUserId) {
    const err = new Error("Вы можете удалять только свои заказы");
    err.statusCode = 403;
    throw err;
  }
  await order.destroy();
}

async function listMyOrders(customerId) {
  return Order.findAll({
    where: { customerId },
    include: [
      { model: Category, as: "category" },
      { model: User, as: "customer", attributes: ["id", "username", "email"] },
      { model: Application, as: "applications" },
      { model: db.attachment, as: "attachments", required: false },
    ],
    order: [["createdAt", "DESC"]],
  });
}

async function getOrderStats(currentUserId, id) {
  const order = await Order.findByPk(id);
  if (!order) {
    const err = new Error("Заказ не найден");
    err.statusCode = 404;
    throw err;
  }
  if (order.customerId !== currentUserId) {
    const err = new Error("Доступ запрещен");
    err.statusCode = 403;
    throw err;
  }

  const applications = await Application.findAll({
    where: { orderId: id },
    include: [{ model: User, as: "user", attributes: ["id", "username", "email"] }],
  });

  return {
    totalApplications: applications.length,
    pending: applications.filter((a) => a.status === "pending").length,
    approved: applications.filter((a) => a.status === "approved").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
    applications,
  };
}

module.exports = {
  createOrder,
  listOrders,
  listMyOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getOrderStats,
};
