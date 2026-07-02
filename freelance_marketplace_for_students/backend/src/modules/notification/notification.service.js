const db = require("../../models");
const Notification = db.notification;
const User = db.user;

async function emitSocketNotification(userId, notification) {
  if (!global.io) return;
  const { sendNotification } = require("../../websocket/socket");
  sendNotification(global.io, userId, notification);
}

async function createNotification(userId, type, title, message, relatedId = null, relatedType = null) {
  try {
    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      relatedId,
      relatedType,
    });

    emitSocketNotification(userId, notification);
    return notification;
  } catch (error) {
    return null;
  }
}

async function listForUser(userId, query) {
  const { limit = 50, offset = 0, unreadOnly = false } = query;
  const where = { userId };
  if (unreadOnly === "true") {
    where.isRead = false;
  }
  return Notification.findAll({
    where,
    order: [["createdAt", "DESC"]],
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
  });
}

async function countUnread(userId) {
  return Notification.count({
    where: {
      userId,
      isRead: false,
    },
  });
}

async function markOneRead(userId, notificationId) {
  const notification = await Notification.findByPk(notificationId);
  if (!notification) {
    const err = new Error("Уведомление не найдено");
    err.statusCode = 404;
    throw err;
  }
  if (notification.userId !== userId) {
    const err = new Error("Нет доступа к этому уведомлению");
    err.statusCode = 403;
    throw err;
  }
  await notification.update({
    isRead: true,
    readAt: new Date(),
  });
  return notification;
}

async function markAllRead(userId) {
  await Notification.update(
    { isRead: true, readAt: new Date() },
    {
      where: {
        userId,
        isRead: false,
      },
    }
  );
}

async function removeOne(userId, notificationId) {
  const notification = await Notification.findByPk(notificationId);
  if (!notification) {
    const err = new Error("Уведомление не найдено");
    err.statusCode = 404;
    throw err;
  }
  if (notification.userId !== userId) {
    const err = new Error("Нет доступа к этому уведомлению");
    err.statusCode = 403;
    throw err;
  }
  await notification.destroy();
}

async function assertAdministrator(userId) {
  const user = await User.findByPk(userId, {
    include: [{ model: db.role, as: "roles", through: { attributes: [] } }],
  });
  const userRoles = user.roles.map((r) => r.name);
  if (!userRoles.includes("administrator")) {
    const err = new Error("Только администраторы могут отправлять уведомления всем пользователям");
    err.statusCode = 403;
    throw err;
  }
  return user;
}

async function broadcastAdminNotification(adminUserId, title, message) {
  await assertAdministrator(adminUserId);
  const allUsers = await User.findAll({
    attributes: ["id"],
  });

  const notifications = [];
  for (const u of allUsers) {
    const notification = await Notification.create({
      userId: u.id,
      type: "admin_notification",
      title: title || "Уведомление от администратора",
      message,
      isRead: false,
    });
    emitSocketNotification(u.id, notification);
    notifications.push(notification);
  }
  return notifications.length;
}

module.exports = {
  createNotification,
  listForUser,
  countUnread,
  markOneRead,
  markAllRead,
  removeOne,
  broadcastAdminNotification,
};
