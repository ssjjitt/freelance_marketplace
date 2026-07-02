const chatService = require("./chat.service");
const { asyncHandler } = require("../../common/middleware");

exports.getOrCreateChat = asyncHandler(async (req, res) => {
  const chat = await chatService.getOrCreateChat(req.user, req.params.userId);
  res.status(200).send(chat);
});

exports.getChats = asyncHandler(async (req, res) => {
  const chats = await chatService.listChats(req.user.id);
  res.status(200).send(chats);
});

exports.getMessages = asyncHandler(async (req, res) => {
  const messages = await chatService.getMessages(req.user, req.params.chatId, req.query);
  res.status(200).send(messages);
});

exports.sendMessage = asyncHandler(async (req, res) => {
  const message = await chatService.sendMessage(req.user, req.params.chatId, req.body.content);
  res.status(201).send(message);
});

exports.markAsRead = asyncHandler(async (req, res) => {
  const result = await chatService.markChatRead(req.user, req.params.chatId);
  res.status(200).send(result);
});

exports.getUnreadCount = asyncHandler(async (req, res) => {
  const unreadCount = await chatService.getUnreadCount(req.user.id);
  res.status(200).send({ unreadCount });
});

exports.deleteChat = asyncHandler(async (req, res) => {
  const result = await chatService.deleteChat(req.user, req.params.chatId);
  res.status(200).send(result);
});

exports.deleteMessage = asyncHandler(async (req, res) => {
  const result = await chatService.deleteMessage(req.user, req.params.messageId);
  res.status(200).send(result);
});

exports.updateMessage = asyncHandler(async (req, res) => {
  const message = await chatService.updateMessage(
    req.user,
    req.params.messageId,
    req.body.content
  );
  res.status(200).send(message);
});
