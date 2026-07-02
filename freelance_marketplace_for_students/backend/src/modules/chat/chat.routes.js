const controller = require("./chat.controller");
const { getUserFromToken } = require("../../common/middleware/authJwt");

module.exports = function registerChatRoutes(app) {
  app.put("/api/chats/messages/:messageId", getUserFromToken, controller.updateMessage);
  app.delete("/api/chats/messages/:messageId", getUserFromToken, controller.deleteMessage);
  app.get("/api/chats/unread/count", getUserFromToken, controller.getUnreadCount);

  app.post("/api/chats/:userId", getUserFromToken, controller.getOrCreateChat);
  app.get("/api/chats", getUserFromToken, controller.getChats);
  app.delete("/api/chats/:chatId", getUserFromToken, controller.deleteChat);
  app.get("/api/chats/:chatId/messages", getUserFromToken, controller.getMessages);
  app.post("/api/chats/:chatId/messages", getUserFromToken, controller.sendMessage);
  app.put("/api/chats/:chatId/read", getUserFromToken, controller.markAsRead);
};
