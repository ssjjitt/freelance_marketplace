import axios from "axios";
import { API_BASE_URL } from "../config/api.config";
import { withApiCall } from "../utils/api-request";
import { getAuthAxiosConfig } from "../utils/auth-headers";

const API_URL = `${API_BASE_URL}/api/chats/`;
const CHAT_MESSAGES_BASE = `${API_BASE_URL}/api/chats/messages/`;

const cfg = () => getAuthAxiosConfig();

/** Список чатов текущего пользователя. */
const getChats = () => {
  return withApiCall("chat.list", () => axios.get(API_URL, cfg()));
};

/**
 * Получить или создать чат с пользователем.
 * @param userId — id собеседника
 */
const getOrCreateChat = (userId: number) => {
  if (userId == null || !Number.isFinite(Number(userId))) {
    return Promise.reject(new Error("Некорректный id пользователя"));
  }
  return withApiCall("chat.getOrCreate", () =>
    axios.post(`${API_URL}${userId}`, {}, cfg())
  );
};

/**
 * История сообщений чата.
 */
const getMessages = (chatId: number, limit: number = 50, offset: number = 0) => {
  if (chatId == null || !Number.isFinite(Number(chatId))) {
    return Promise.reject(new Error("Некорректный id чата"));
  }
  return withApiCall("chat.messages", () =>
    axios.get(`${API_URL}${chatId}/messages`, {
      params: { limit, offset },
      ...cfg(),
    })
  );
};

/** Отправка сообщения. */
const sendMessage = (chatId: number, content: string) => {
  if (chatId == null || !Number.isFinite(Number(chatId))) {
    return Promise.reject(new Error("Некорректный id чата"));
  }
  if (content == null || String(content).trim() === "") {
    return Promise.reject(new Error("Пустое сообщение"));
  }
  return withApiCall("chat.send", () =>
    axios.post(`${API_URL}${chatId}/messages`, { content: String(content).trim() }, cfg())
  );
};

/** Пометить чат прочитанным. */
const markAsRead = (chatId: number) => {
  if (chatId == null || !Number.isFinite(Number(chatId))) {
    return Promise.reject(new Error("Некорректный id чата"));
  }
  return withApiCall("chat.markRead", () => axios.put(`${API_URL}${chatId}/read`, {}, cfg()));
};

/** Количество непрочитанных чатов/сообщений. */
const getUnreadCount = () => {
  return withApiCall("chat.unreadCount", () => axios.get(`${API_URL}unread/count`, cfg()));
};

/** Удаление чата. */
const deleteChat = (chatId: number) => {
  if (chatId == null || !Number.isFinite(Number(chatId))) {
    return Promise.reject(new Error("Некорректный id чата"));
  }
  return withApiCall("chat.delete", () => axios.delete(`${API_URL}${chatId}`, cfg()));
};

/** Удаление сообщения. */
const deleteMessage = (messageId: number) => {
  if (messageId == null || !Number.isFinite(Number(messageId))) {
    return Promise.reject(new Error("Некорректный id сообщения"));
  }
  return withApiCall("chat.deleteMessage", () =>
    axios.delete(`${CHAT_MESSAGES_BASE}${messageId}`, cfg())
  );
};

/** Редактирование сообщения. */
const updateMessage = (messageId: number, content: string) => {
  if (messageId == null || !Number.isFinite(Number(messageId))) {
    return Promise.reject(new Error("Некорректный id сообщения"));
  }
  if (content == null || String(content).trim() === "") {
    return Promise.reject(new Error("Пустое сообщение"));
  }
  return withApiCall("chat.updateMessage", () =>
    axios.put(`${CHAT_MESSAGES_BASE}${messageId}`, { content: String(content).trim() }, cfg())
  );
};

const ChatService = {
  getChats,
  getOrCreateChat,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
  deleteChat,
  deleteMessage,
  updateMessage,
};

export default ChatService;
