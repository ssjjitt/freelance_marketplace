const { Op, Sequelize } = require("sequelize");
const db = require("../../models");
const Chat = db.chat;
const Message = db.message;
const User = db.user;
const { createNotification } = require("../notification/notification.service");

function loadSocket() {
  return require("../../websocket/socket");
}

async function getOrCreateChat(currentUser, otherUserId) {
  if (currentUser.id === parseInt(otherUserId, 10)) {
    const err = new Error("Нельзя создать чат с самим собой");
    err.statusCode = 400;
    throw err;
  }

  const otherUser = await User.findByPk(otherUserId);
  if (!otherUser) {
    const err = new Error("Пользователь не найден");
    err.statusCode = 404;
    throw err;
  }

  let chat = await Chat.findOne({
    where: {
      [Op.or]: [
        { user1Id: currentUser.id, user2Id: otherUserId },
        { user1Id: otherUserId, user2Id: currentUser.id },
      ],
    },
    include: [
      { model: User, as: "user1", attributes: ["id", "username", "email"] },
      { model: User, as: "user2", attributes: ["id", "username", "email"] },
    ],
  });

  if (!chat) {
    const user1Id = currentUser.id < otherUserId ? currentUser.id : otherUserId;
    const user2Id = currentUser.id < otherUserId ? otherUserId : currentUser.id;

    chat = await Chat.create({
      user1Id,
      user2Id,
    });

    chat = await Chat.findByPk(chat.id, {
      include: [
        { model: User, as: "user1", attributes: ["id", "username", "email"] },
        { model: User, as: "user2", attributes: ["id", "username", "email"] },
      ],
    });
  }

  return chat;
}

async function getOrCreateDirectChat(userAId, userBId) {
  if (!userAId || !userBId || userAId === userBId) {
    return null;
  }

  let chat = await Chat.findOne({
    where: {
      [Op.or]: [
        { user1Id: userAId, user2Id: userBId },
        { user1Id: userBId, user2Id: userAId },
      ],
    },
  });

  if (!chat) {
    const user1Id = userAId < userBId ? userAId : userBId;
    const user2Id = userAId < userBId ? userBId : userAId;
    chat = await Chat.create({ user1Id, user2Id });
  }

  return chat;
}

async function postSystemMessage(chatId, content) {
  const chat = await Chat.findByPk(chatId);
  if (!chat || !content?.trim()) {
    return null;
  }

  const message = await Message.create({
    chatId: chat.id,
    senderId: chat.user1Id,
    content: content.trim(),
    isType: "system",
    isRead: false,
  });

  await chat.update({ lastMessageAt: new Date() });

  if (global.io) {
    const { sendChatMessage, updateChatsList } = loadSocket();
    const messageWithSender = await Message.findByPk(message.id, {
      include: [{ model: User, as: "sender", attributes: ["id", "username", "email"] }],
    });
    sendChatMessage(global.io, chat.id, messageWithSender, chat.user1Id);
    sendChatMessage(global.io, chat.id, messageWithSender, chat.user2Id);
    updateChatsList(global.io, chat.user1Id);
    updateChatsList(global.io, chat.user2Id);
    return messageWithSender;
  }

  return message;
}

async function listChats(currentUserId) {
  return Chat.findAll({
    where: {
      [Op.or]: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
    },
    attributes: {
      include: [
        [
          Sequelize.literal(`(
                            SELECT content
                            FROM messages
                            WHERE messages.chatId = chat.id
                            ORDER BY messages.createdAt DESC
                            LIMIT 1
                        )`),
          "lastMessage",
        ],
        [
          Sequelize.literal(`(
                            SELECT createdAt
                            FROM messages
                            WHERE messages.chatId = chat.id
                            ORDER BY messages.createdAt DESC
                            LIMIT 1
                        )`),
          "lastMessageTime",
        ],
        [
          Sequelize.literal(`(
                            SELECT COUNT(*)
                            FROM messages
                            WHERE messages.chatId = chat.id
                              AND messages.senderId != ${currentUserId}
                              AND messages.isRead = false
                        )`),
          "unreadCount",
        ],
      ],
    },
    include: [
      { model: User, as: "user1", attributes: ["id", "username"] },
      { model: User, as: "user2", attributes: ["id", "username"] },
    ],
    order: [[Sequelize.literal("lastMessageTime"), "DESC"]],
  });
}

async function assertChatMember(chat, currentUserId) {
  if (!chat) {
    const err = new Error("Чат не найден");
    err.statusCode = 404;
    throw err;
  }
  if (chat.user1Id !== currentUserId && chat.user2Id !== currentUserId) {
    const err = new Error("Нет доступа к этому чату");
    err.statusCode = 403;
    throw err;
  }
}

async function getMessages(currentUser, chatId, query) {
  const { limit = 50, offset = 0 } = query;
  const chat = await Chat.findByPk(chatId);
  await assertChatMember(chat, currentUser.id);

  const messages = await Message.findAll({
    where: { chatId },
    include: [{ model: User, as: "sender", attributes: ["id", "username", "email"] }],
    order: [["createdAt", "DESC"]],
    limit: parseInt(limit, 10),
    offset: parseInt(offset, 10),
  });

  const updatedCount = await Message.update(
    { isRead: true, readAt: new Date() },
    {
      where: {
        chatId,
        senderId: { [Op.ne]: currentUser.id },
        isRead: false,
      },
    }
  );

  if (updatedCount[0] > 0 && global.io) {
    const otherUserId = chat.user1Id === currentUser.id ? chat.user2Id : chat.user1Id;
    const { updateChatsList } = loadSocket();
    updateChatsList(global.io, otherUserId);
  }

  return messages.reverse();
}

async function sendMessage(currentUser, chatId, content) {
  if (!content || !content.trim()) {
    const err = new Error("Сообщение не может быть пустым");
    err.statusCode = 400;
    throw err;
  }

  const chat = await Chat.findByPk(chatId);
  await assertChatMember(chat, currentUser.id);

  const message = await Message.create({
    chatId,
    senderId: currentUser.id,
    content: content.trim(),
  });

  await chat.update({ lastMessageAt: new Date() });

  const recipientId = chat.user1Id === currentUser.id ? chat.user2Id : chat.user1Id;
  const notification = await createNotification(
    recipientId,
    "new_message",
    "Новое сообщение",
    `${currentUser.username}: ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`,
    chatId,
    "message"
  );

  const messageWithSender = await Message.findByPk(message.id, {
    include: [{ model: User, as: "sender", attributes: ["id", "username", "email"] }],
  });

  if (global.io) {
    const { sendChatMessage, updateChatsList, sendNotification } = loadSocket();
    sendChatMessage(global.io, chatId, messageWithSender, recipientId);
    updateChatsList(global.io, recipientId);
    if (notification) {
      sendNotification(global.io, recipientId, notification);
    }
  }

  return messageWithSender;
}

async function markChatRead(currentUser, chatId) {
  const chat = await Chat.findByPk(chatId);
  await assertChatMember(chat, currentUser.id);

  const updatedCount = await Message.update(
    { isRead: true, readAt: new Date() },
    {
      where: {
        chatId,
        senderId: { [Op.ne]: currentUser.id },
        isRead: false,
      },
    }
  );

  if (updatedCount[0] > 0 && global.io) {
    const otherUserId = chat.user1Id === currentUser.id ? chat.user2Id : chat.user1Id;
    const { updateChatsList } = loadSocket();
    updateChatsList(global.io, otherUserId);
  }

  return { message: "Сообщения отмечены как прочитанные" };
}

async function getUnreadCount(currentUserId) {
  const chats = await Chat.findAll({
    where: {
      [Op.or]: [{ user1Id: currentUserId }, { user2Id: currentUserId }],
    },
  });

  const chatIds = chats.map((c) => c.id);

  return Message.count({
    where: {
      chatId: { [Op.in]: chatIds },
      senderId: { [Op.ne]: currentUserId },
      isRead: false,
    },
  });
}

async function deleteChat(currentUser, chatId) {
  const chat = await Chat.findByPk(chatId);
  await assertChatMember(chat, currentUser.id);

  await Message.destroy({ where: { chatId } });
  await chat.destroy();

  if (global.io) {
    const otherUserId = chat.user1Id === currentUser.id ? chat.user2Id : chat.user1Id;
    const { updateChatsList } = loadSocket();
    updateChatsList(global.io, currentUser.id);
    updateChatsList(global.io, otherUserId);
  }

  return { message: "Чат удален" };
}

async function deleteMessage(currentUser, messageId) {
  const message = await Message.findByPk(messageId);
  if (!message) {
    const err = new Error("Сообщение не найдено");
    err.statusCode = 404;
    throw err;
  }

  const chat = await Chat.findByPk(message.chatId);
  await assertChatMember(chat, currentUser.id);

  if (message.senderId !== currentUser.id) {
    const err = new Error("Вы можете удалять только свои сообщения");
    err.statusCode = 403;
    throw err;
  }

  const chatId = chat.id;
  const otherUserId = chat.user1Id === currentUser.id ? chat.user2Id : chat.user1Id;

  await message.destroy();

  if (global.io) {
    const { sendChatMessageDeleted, updateChatsList } = loadSocket();
    sendChatMessageDeleted(global.io, chatId, parseInt(messageId, 10), otherUserId);
    updateChatsList(global.io, otherUserId);
    updateChatsList(global.io, currentUser.id);
  }

  return { message: "Сообщение удалено" };
}

async function updateMessage(currentUser, messageId, content) {
  if (!content || !content.trim()) {
    const err = new Error("Сообщение не может быть пустым");
    err.statusCode = 400;
    throw err;
  }

  const message = await Message.findByPk(messageId);
  if (!message) {
    const err = new Error("Сообщение не найдено");
    err.statusCode = 404;
    throw err;
  }

  const chat = await Chat.findByPk(message.chatId);
  await assertChatMember(chat, currentUser.id);

  if (message.senderId !== currentUser.id) {
    const err = new Error("Вы можете редактировать только свои сообщения");
    err.statusCode = 403;
    throw err;
  }

  await message.update({ content: content.trim() });

  const updatedMessage = await Message.findByPk(messageId, {
    include: [{ model: User, as: "sender", attributes: ["id", "username", "email"] }],
  });

  if (global.io) {
    const { sendChatMessageUpdated, updateChatsList } = loadSocket();
    const otherUserId = chat.user1Id === currentUser.id ? chat.user2Id : chat.user1Id;
    sendChatMessageUpdated(global.io, chat.id, updatedMessage, otherUserId);
    updateChatsList(global.io, otherUserId);
    updateChatsList(global.io, currentUser.id);
  }

  return updatedMessage;
}

module.exports = {
  getOrCreateChat,
  getOrCreateDirectChat,
  postSystemMessage,
  listChats,
  getMessages,
  sendMessage,
  markChatRead,
  getUnreadCount,
  deleteChat,
  deleteMessage,
  updateMessage,
};
