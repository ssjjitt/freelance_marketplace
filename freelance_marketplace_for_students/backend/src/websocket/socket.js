const jwt = require("jsonwebtoken");
const db = require("../models");
const User = db.user;
const config = require("../config");

const connectedUsers = new Map();

function initializeSocket(server) {
  const io = require("socket.io")(server, {
    cors: {
      origin: config.corsOrigins,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token || socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.SECRET);
      const user = await User.findByPk(decoded.id);

      if (!user || user.isBlocked) {
        return next(new Error("Authentication error: User not found or blocked"));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;

    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, []);
    }
    connectedUsers.get(userId).push(socket.id);

    socket.join(`user:${userId}`);

    socket.on("send_message", async () => {});

    socket.on("subscribe_chat", (chatId) => {
      socket.join(`chat:${chatId}`);
    });

    socket.on("unsubscribe_chat", (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    socket.on("disconnect", () => {
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        const index = userSockets.indexOf(socket.id);
        if (index > -1) {
          userSockets.splice(index, 1);
        }
        if (userSockets.length === 0) {
          connectedUsers.delete(userId);
        }
      }
    });
  });

  return io;
}

function sendChatMessage(io, chatId, message, recipientId) {
  if (!io) return;

  const messageWithChatId = { ...message.toJSON(), chatId };

  io.to(`chat:${chatId}`).emit("new_message", messageWithChatId);

  io.to(`user:${recipientId}`).emit("chat_updated", { chatId });
}

function updateChatsList(io, userId) {
  if (!io) return;
  io.to(`user:${userId}`).emit("chats_list_updated");
}

function sendNotification(io, userId, notification) {
  if (!io) return;
  io.to(`user:${userId}`).emit("new_notification", notification);
  io.to(`user:${userId}`).emit("notifications_updated");
}

function sendChatMessageDeleted(io, chatId, messageId, recipientId) {
  if (!io) return;
  io.to(`chat:${chatId}`).emit("message_deleted", { messageId, chatId });
  io.to(`user:${recipientId}`).emit("chat_updated", { chatId });
}

function sendChatMessageUpdated(io, chatId, message, recipientId) {
  if (!io) return;
  const messageWithChatId = { ...message.toJSON(), chatId };
  io.to(`chat:${chatId}`).emit("message_updated", messageWithChatId);
  io.to(`user:${recipientId}`).emit("chat_updated", { chatId });
}

function isUserConnected(userId) {
  return connectedUsers.has(userId) && connectedUsers.get(userId).length > 0;
}

module.exports = {
  initializeSocket,
  sendChatMessage,
  updateChatsList,
  sendNotification,
  sendChatMessageDeleted,
  sendChatMessageUpdated,
  isUserConnected,
};
