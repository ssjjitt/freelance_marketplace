const notificationService = require("./notification.service");
const { asyncHandler } = require("../../common/middleware");

exports.getNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationService.listForUser(req.user.id, req.query);
  res.status(200).send(notifications);
});

exports.getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await notificationService.countUnread(req.user.id);
  res.status(200).send({ unreadCount });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markOneRead(req.user.id, req.params.id);
  res.status(200).send(notification);
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  await notificationService.markAllRead(req.user.id);
  res.status(200).send({ message: "Все уведомления отмечены как прочитанные" });
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.removeOne(req.user.id, req.params.id);
  res.status(200).send({ message: "Уведомление удалено" });
});

exports.sendNotificationToAll = asyncHandler(async (req, res) => {
  const { title, message } = req.body;
  const count = await notificationService.broadcastAdminNotification(req.user.id, title, message);
  res.status(200).send({
    message: `Уведомление отправлено ${count} пользователям`,
    count,
  });
});
