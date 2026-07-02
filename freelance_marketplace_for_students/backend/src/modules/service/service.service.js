const { Op } = require("sequelize");
const db = require("../../models");
const Service = db.service;
const User = db.user;
const Category = db.category;
const Application = db.application;
const { createNotification } = require("../notification/notification.service");

async function assertExecuter(userId) {
  const user = await User.findByPk(userId, {
    include: [{ model: db.role, as: "roles", through: { attributes: [] } }],
  });
  const userRoles = user.roles.map((r) => r.name);
  if (!userRoles.includes("executer")) {
    const err = new Error("Только исполнители могут создавать услуги");
    err.statusCode = 403;
    throw err;
  }
}

async function createService(currentUserId, body) {
  await assertExecuter(currentUserId);
  const { title, description, price, categoryId } = body;

  const service = await Service.create({
    executerId: currentUserId,
    title,
    description,
    price: price || null,
    categoryId,
    isApproved: false,
  });

  return Service.findByPk(service.id, {
    include: [
      { model: Category, as: "category" },
      { model: User, as: "executer", attributes: ["id", "username", "email"] },
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

function applyListingStatus(where, status) {
  if (status) {
    where.status = status;
  } else {
    where.status = { [Op.notIn]: ["completed", "cancelled", "inactive"] };
  }
}

function applyPriceFilters(where, minPrice, maxPrice) {
  if (minPrice) {
    where.price = { ...where.price, [Op.gte]: Number(minPrice) };
  }
  if (maxPrice) {
    where.price = { ...where.price, [Op.lte]: Number(maxPrice) };
  }
}

function applySearch(where, search) {
  if (search && typeof search === "string" && search.trim().length > 0) {
    const searchTerm = `%${search.trim()}%`;
    where[Op.or] = [
      { title: { [Op.like]: searchTerm } },
      { description: { [Op.like]: searchTerm } },
    ];
  }
}

function buildSort(sortBy, sortOrder) {
  let orderClause = [["createdAt", "DESC"]];
  if (!sortBy) return orderClause;
  const direction = sortOrder === "ASC" ? "ASC" : "DESC";
  if (sortBy === "price") orderClause = [["price", direction]];
  else if (sortBy === "date") orderClause = [["createdAt", direction]];
  else if (sortBy === "title") orderClause = [["title", direction]];
  return orderClause;
}

async function listServices(query) {
  const { categoryId, search, status, minPrice, maxPrice, sortBy, sortOrder, catalogOnly } = query;
  const where = {};

  const onlyCatalog =
    catalogOnly === true ||
    catalogOnly === "true" ||
    catalogOnly === "1";
  if (onlyCatalog) {
    where.isApproved = true;
    where.isActive = true;
  }

  if (categoryId) {
    const categoryIds = await resolveCategoryIds(categoryId);
    if (categoryIds.length > 0) {
      where.categoryId = { [Op.in]: categoryIds };
    } else {
      where.categoryId = categoryId;
    }
  }
  applyListingStatus(where, status);
  applyPriceFilters(where, minPrice, maxPrice);
  applySearch(where, search);

  return Service.findAll({
    where,
    include: [
      { model: Category, as: "category" },
      { model: User, as: "executer", attributes: ["id", "username", "email"] },
      { model: Application, as: "applications" },
      { model: db.attachment, as: "attachments", required: false },
    ],
    order: buildSort(sortBy, sortOrder),
  });
}

async function getServiceById(id) {
  const service = await Service.findByPk(id, {
    include: [
      { model: Category, as: "category" },
      { model: User, as: "executer", attributes: ["id", "username", "email"] },
      {
        model: Application,
        as: "applications",
        include: [{ model: User, as: "user", attributes: ["id", "username", "email"] }],
      },
      { model: db.attachment, as: "attachments", required: false },
    ],
  });
  if (!service) {
    const err = new Error("Услуга не найдена");
    err.statusCode = 404;
    throw err;
  }
  return service;
}

async function notifyOnServiceStatus(serviceId, serviceTitle, newStatus) {
  const applications = await Application.findAll({
    where: { serviceId, status: "approved" },
    include: [{ model: User, as: "user", attributes: ["id"] }],
  });
  for (const app of applications) {
    await createNotification(
      app.userId,
      "service_status_changed",
      "Изменен статус услуги",
      `Статус услуги "${serviceTitle}" изменен на "${newStatus}"`,
      serviceId,
      "service"
    );
  }
}

async function updateService(currentUserId, id, body) {
  const { title, description, price, categoryId, status } = body;
  const service = await Service.findByPk(id);
  if (!service) {
    const err = new Error("Услуга не найдена");
    err.statusCode = 404;
    throw err;
  }
  if (service.executerId !== currentUserId) {
    const err = new Error("Вы можете редактировать только свои услуги");
    err.statusCode = 403;
    throw err;
  }

  const oldStatus = service.status;
  await service.update({
    title: title || service.title,
    description: description || service.description,
    price: price !== undefined ? price : service.price,
    categoryId: categoryId || service.categoryId,
    status: status || service.status,
  });

  if (status && status !== oldStatus) {
    await notifyOnServiceStatus(id, service.title, status);
  }

  return Service.findByPk(id, {
    include: [
      { model: Category, as: "category" },
      { model: User, as: "executer", attributes: ["id", "username", "email"] },
      { model: db.attachment, as: "attachments", required: false },
    ],
  });
}

async function deleteService(currentUserId, id) {
  const service = await Service.findByPk(id);
  if (!service) {
    const err = new Error("Услуга не найдена");
    err.statusCode = 404;
    throw err;
  }
  if (service.executerId !== currentUserId) {
    const err = new Error("Вы можете удалять только свои услуги");
    err.statusCode = 403;
    throw err;
  }
  await service.destroy();
}

async function getServiceStats(currentUserId, id) {
  const service = await Service.findByPk(id);
  if (!service) {
    const err = new Error("Услуга не найдена");
    err.statusCode = 404;
    throw err;
  }
  if (service.executerId !== currentUserId) {
    const err = new Error("Доступ запрещен");
    err.statusCode = 403;
    throw err;
  }

  const applications = await Application.findAll({
    where: { serviceId: id },
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
  createService,
  listServices,
  getServiceById,
  updateService,
  deleteService,
  getServiceStats,
};
