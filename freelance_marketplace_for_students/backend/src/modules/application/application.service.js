const { Op } = require("sequelize");
const db = require("../../models");
const Application = db.application;
const Order = db.order;
const Service = db.service;
const User = db.user;
const Dispute = db.dispute;
const { createNotification } = require("../notification/notification.service");
const { getOrCreateDirectChat, postSystemMessage } = require("../chat/chat.service");

function validateCreatePayload({ orderId, serviceId }) {
  if (!orderId && !serviceId) {
    const err = new Error("Необходимо указать orderId или serviceId");
    err.statusCode = 400;
    throw err;
  }
  if (orderId && serviceId) {
    const err = new Error("Укажите только orderId или serviceId");
    err.statusCode = 400;
    throw err;
  }
}

async function ensureOrderRules(currentUserId, orderId) {
  const order = await Order.findByPk(orderId);
  if (!order) {
    const err = new Error("Заказ не найден");
    err.statusCode = 404;
    throw err;
  }
  if (order.customerId === currentUserId) {
    const err = new Error("Вы не можете откликнуться на свой заказ");
    err.statusCode = 403;
    throw err;
  }
  return order;
}

async function ensureServiceRules(currentUserId, serviceId) {
  const service = await Service.findByPk(serviceId);
  if (!service) {
    const err = new Error("Услуга не найдена");
    err.statusCode = 404;
    throw err;
  }
  if (service.executerId === currentUserId) {
    const err = new Error("Вы не можете откликнуться на свою услугу");
    err.statusCode = 403;
    throw err;
  }
  return service;
}

async function ensureNoDuplicate(currentUserId, orderId, serviceId) {
  let existing = null;
  if (orderId) {
    existing = await Application.findOne({
      where: { userId: currentUserId, orderId },
    });
  } else if (serviceId) {
    existing = await Application.findOne({
      where: { userId: currentUserId, serviceId },
    });
  }
  if (existing) {
    const err = new Error("Вы уже откликнулись на этот заказ/услугу");
    err.statusCode = 400;
    throw err;
  }
}

async function notifyNewApplication(currentUser, orderId, serviceId, applicationId) {
  if (orderId) {
    const order = await Order.findByPk(orderId);
    if (order) {
      await createNotification(
        order.customerId,
        "new_application",
        "Новый отклик на ваш заказ",
        `Пользователь ${currentUser.username} откликнулся на ваш заказ "${order.title}"`,
        applicationId,
        "application"
      );
    }
  } else if (serviceId) {
    const service = await Service.findByPk(serviceId);
    if (service) {
      await createNotification(
        service.executerId,
        "new_application",
        "Новый отклик на вашу услугу",
        `Пользователь ${currentUser.username} откликнулся на вашу услугу "${service.title}"`,
        applicationId,
        "application"
      );
    }
  }
}

async function createApplication(currentUser, body) {
  const { orderId, serviceId, message, proposedPrice } = body;
  validateCreatePayload({ orderId, serviceId });

  let order = null;
  let service = null;
  if (orderId) order = await ensureOrderRules(currentUser.id, orderId);
  if (serviceId) service = await ensureServiceRules(currentUser.id, serviceId);
  await ensureNoDuplicate(currentUser.id, orderId, serviceId);

  const application = await Application.create({
    userId: currentUser.id,
    orderId: orderId || null,
    serviceId: serviceId || null,
    message: message || null,
    proposedPrice: proposedPrice || null,
  });

  await notifyNewApplication(currentUser, orderId, serviceId, application.id);

  const ownerId = order ? order.customerId : service ? service.executerId : null;
  if (ownerId) {
    const chat = await getOrCreateDirectChat(currentUser.id, ownerId);
    if (chat) {
      await postSystemMessage(
        chat.id,
        `Создан отклик #${application.id}. Чат открыт для обсуждения условий.`
      );
    }
  }

  return Application.findByPk(application.id, {
    include: [
      { model: User, as: "user", attributes: ["id", "username", "email"] },
      { model: Order, as: "order" },
      { model: Service, as: "service" },
    ],
  });
}

async function cancelApplication(currentUserId, id) {
  const application = await Application.findByPk(id);
  if (!application) {
    const err = new Error("Отклик не найден");
    err.statusCode = 404;
    throw err;
  }
  if (application.userId !== currentUserId) {
    const err = new Error("Вы можете отменять только свои отклики");
    err.statusCode = 403;
    throw err;
  }
  await application.destroy();
}

async function resolveApplicationOwner(application, currentUserId) {
  if (application.orderId) {
    const order = await Order.findByPk(application.orderId);
    return order && order.customerId === currentUserId;
  }
  if (application.serviceId) {
    const service = await Service.findByPk(application.serviceId);
    return service && service.executerId === currentUserId;
  }
  return false;
}

async function approveApplication(currentUserId, id) {
  const application = await Application.findByPk(id, {
    include: [{ model: Order, as: "order" }, { model: Service, as: "service" }],
  });
  if (!application) {
    const err = new Error("Отклик не найден");
    err.statusCode = 404;
    throw err;
  }
  const isOwner = await resolveApplicationOwner(application, currentUserId);
  if (!isOwner) {
    const err = new Error("Вы можете одобрять отклики только на свои заказы/услуги");
    err.statusCode = 403;
    throw err;
  }

  await application.update({ status: "approved" });

  await createNotification(
    application.userId,
    "application_approved",
    "Ваш отклик одобрен",
    application.orderId
      ? `Ваш отклик на заказ "${application.order?.title || "заказ"}" был одобрен`
      : `Ваш отклик на услугу "${application.service?.title || "услугу"}" был одобрен`,
    application.id,
    "application"
  );

  const ownerId = application.order ? application.order.customerId : application.service?.executerId;
  if (ownerId) {
    const chat = await getOrCreateDirectChat(application.userId, ownerId);
    if (chat) {
      await postSystemMessage(
        chat.id,
        `Отклик #${application.id} одобрен. Можно продолжать работу в этом чате.`
      );
    }
  }

  return application;
}

async function rejectApplication(currentUserId, id) {
  const application = await Application.findByPk(id, {
    include: [{ model: Order, as: "order" }, { model: Service, as: "service" }],
  });
  if (!application) {
    const err = new Error("Отклик не найден");
    err.statusCode = 404;
    throw err;
  }
  const isOwner = await resolveApplicationOwner(application, currentUserId);
  if (!isOwner) {
    const err = new Error("Вы можете отклонять отклики только на свои заказы/услуги");
    err.statusCode = 403;
    throw err;
  }

  await application.update({ status: "rejected" });

  await createNotification(
    application.userId,
    "application_rejected",
    "Ваш отклик отклонен",
    application.orderId
      ? `Ваш отклик на заказ "${application.order?.title || "заказ"}" был отклонен`
      : `Ваш отклик на услугу "${application.service?.title || "услугу"}" был отклонен`,
    application.id,
    "application"
  );

  const ownerId = application.order ? application.order.customerId : application.service?.executerId;
  if (ownerId) {
    const chat = await getOrCreateDirectChat(application.userId, ownerId);
    if (chat) {
      await postSystemMessage(chat.id, `Отклик #${application.id} отклонен.`);
    }
  }

  return application;
}

async function openDisputeForRejectedApplication(currentUserId, id, body) {
  const reason = String(body?.reason || "").trim();
  const description = String(body?.description || "").trim();

  if (!reason) {
    const err = new Error("Укажите причину спора");
    err.statusCode = 400;
    throw err;
  }

  const application = await Application.findByPk(id, {
    include: [
      { model: Order, as: "order" },
      { model: Service, as: "service" },
      { model: User, as: "user", attributes: ["id", "username", "email"] },
    ],
  });
  if (!application) {
    const err = new Error("Отклик не найден");
    err.statusCode = 404;
    throw err;
  }
  if (application.status !== "rejected") {
    const err = new Error("Спор можно открыть только по отклоненному отклику");
    err.statusCode = 400;
    throw err;
  }
  if (application.userId !== currentUserId) {
    const err = new Error("Вы можете открыть спор только по своему отклику");
    err.statusCode = 403;
    throw err;
  }

  const existing = await Dispute.findOne({
    where: {
      applicationId: application.id,
      status: ["open", "in_review"],
    },
    order: [["createdAt", "DESC"]],
  });
  if (existing) {
    const err = new Error("По этому отклику уже открыт спор");
    err.statusCode = 409;
    throw err;
  }

  let customerId = null;
  let executerId = null;

  if (application.order) {
    customerId = application.order.customerId;
    executerId = application.userId;
  } else if (application.service) {
    customerId = application.userId;
    executerId = application.service.executerId;
  } else {
    const err = new Error("Отклик не привязан к заказу или услуге");
    err.statusCode = 400;
    throw err;
  }

  const dispute = await Dispute.create({
    orderId: application.orderId || null,
    applicationId: application.id,
    customerId,
    executerId: executerId || null,
    initiatorId: currentUserId,
    reason,
    description: description || null,
    status: "open",
  });

  const targetUserId = application.order ? application.order.customerId : application.service?.executerId;
  if (targetUserId) {
    await createNotification(
      targetUserId,
      "dispute_opened",
      "Открыт спор по отклику",
      `По отклику #${application.id} открыт спор. Причина: ${reason}`,
      dispute.id,
      "dispute"
    );

    const chat = await getOrCreateDirectChat(application.userId, targetUserId);
    if (chat) {
      await postSystemMessage(
        chat.id,
        `Открыт спор по отклику #${application.id}. Причина: ${reason}`
      );
    }
  }

  if (application.order) {
    await application.order.update({ status: "dispute" });
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

async function getMyApplications(currentUserId) {
  return Application.findAll({
    where: { userId: currentUserId },
    include: [
      { model: Order, as: "order", include: [{ model: db.category, as: "category" }] },
      { model: Service, as: "service", include: [{ model: db.category, as: "category" }] },
    ],
    order: [["createdAt", "DESC"]],
  });
}

async function getApplicationsForMyItems(currentUserId) {
  const myOrders = await Order.findAll({
    where: { customerId: currentUserId },
    attributes: ["id"],
  });
  const orderIds = myOrders.map((o) => o.id);

  const myServices = await Service.findAll({
    where: { executerId: currentUserId },
    attributes: ["id"],
  });
  const serviceIds = myServices.map((s) => s.id);

  return Application.findAll({
    where: {
      [Op.or]: [{ orderId: { [Op.in]: orderIds } }, { serviceId: { [Op.in]: serviceIds } }],
    },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "username", "email"],
      },
      {
        model: Order,
        as: "order",
        include: [
          { model: db.category, as: "category" },
          { model: User, as: "customer", attributes: ["id", "username", "email"] },
        ],
      },
      {
        model: Service,
        as: "service",
        include: [
          { model: db.category, as: "category" },
          { model: User, as: "executer", attributes: ["id", "username", "email"] },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
}

async function getApplicationsByOrderId(orderId) {
  const order = await Order.findByPk(orderId);
  if (!order) {
    const err = new Error("Заказ не найден");
    err.statusCode = 404;
    throw err;
  }

  return Application.findAll({
    where: { orderId },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "username", "email"],
        include: [
          { model: db.profile, as: "profile", attributes: ["id", "rating", "avatar"] },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
}

async function getApplicationsByServiceId(serviceId) {
  const service = await Service.findByPk(serviceId);
  if (!service) {
    const err = new Error("Услуга не найдена");
    err.statusCode = 404;
    throw err;
  }

  return Application.findAll({
    where: { serviceId },
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "username", "email"],
        include: [
          { model: db.profile, as: "profile", attributes: ["id", "rating", "avatar"] },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
}

module.exports = {
  createApplication,
  cancelApplication,
  approveApplication,
  rejectApplication,
  openDisputeForRejectedApplication,
  getMyApplications,
  getApplicationsForMyItems,
  getApplicationsByOrderId,
  getApplicationsByServiceId,
};
