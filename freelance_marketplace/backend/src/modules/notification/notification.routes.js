const controller = require("./notification.controller");
const { getUserFromToken, isAdministrator } = require("../../common/middleware/authJwt");

module.exports = function registerNotificationRoutes(app) {
  app.get("/api/notifications", getUserFromToken, controller.getNotifications);
  app.get("/api/notifications/unread/count", getUserFromToken, controller.getUnreadCount);
  app.put("/api/notifications/:id/read", getUserFromToken, controller.markAsRead);
  app.put("/api/notifications/read/all", getUserFromToken, controller.markAllAsRead);
  app.delete("/api/notifications/:id", getUserFromToken, controller.deleteNotification);
  app.post("/api/notifications/send-all", [getUserFromToken, isAdministrator], controller.sendNotificationToAll);
};
