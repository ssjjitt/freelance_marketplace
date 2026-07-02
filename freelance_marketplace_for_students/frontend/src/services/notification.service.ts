import axios from "axios";
import { API_BASE_URL } from "../config/api.config";
import { withApiCall } from "../utils/api-request";
import { getAuthAxiosConfig } from "../utils/auth-headers";

const API_URL = `${API_BASE_URL}/api/notifications/`;

const cfg = () => getAuthAxiosConfig();

/** Список уведомлений. */
const getNotifications = (limit: number = 50, offset: number = 0, unreadOnly: boolean = false) => {
  return withApiCall("notification.list", () =>
    axios.get(API_URL, {
      params: { limit, offset, unreadOnly },
      ...cfg(),
    })
  );
};

/** Счётчик непрочитанных. */
const getUnreadCount = () => {
  return withApiCall("notification.unreadCount", () => axios.get(`${API_URL}unread/count`, cfg()));
};

/** Пометить уведомление прочитанным. */
const markAsRead = (id: number) => {
  if (id == null || !Number.isFinite(Number(id))) {
    return Promise.reject(new Error("Некорректный id уведомления"));
  }
  return withApiCall("notification.markRead", () =>
    axios.put(`${API_URL}${id}/read`, {}, cfg())
  );
};

/** Пометить все прочитанными. */
const markAllAsRead = () => {
  return withApiCall("notification.markAllRead", () =>
    axios.put(`${API_URL}read/all`, {}, cfg())
  );
};

/** Удаление уведомления. */
const deleteNotification = (id: number) => {
  if (id == null || !Number.isFinite(Number(id))) {
    return Promise.reject(new Error("Некорректный id уведомления"));
  }
  return withApiCall("notification.delete", () => axios.delete(`${API_URL}${id}`, cfg()));
};

/** Массовая рассылка (админ). */
const sendNotificationToAll = (title: string, message: string) => {
  if (!title?.trim() || !message?.trim()) {
    return Promise.reject(new Error("Укажите заголовок и текст"));
  }
  return withApiCall("notification.sendAll", () =>
    axios.post(`${API_URL}send-all`, { title: title.trim(), message: message.trim() }, cfg())
  );
};

const NotificationService = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  sendNotificationToAll,
};

export default NotificationService;
