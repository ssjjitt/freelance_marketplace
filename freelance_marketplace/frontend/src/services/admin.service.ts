import axios from "axios";
import { API_BASE_URL } from "../config/api.config";
import { withApiCall } from "../utils/api-request";
import { getAuthAxiosConfig } from "../utils/auth-headers";

const API_URL = `${API_BASE_URL}/`;

const cfg = () => getAuthAxiosConfig();

/** Блокировка пользователя (админ). */
const blockUser = (userId: number, reason?: string) => {
  if (userId == null || !Number.isFinite(Number(userId))) {
    return Promise.reject(new Error("Некорректный id пользователя"));
  }
  return withApiCall("admin.blockUser", () =>
    axios.post(API_URL + `admin/users/${userId}/block`, { reason: reason || "" }, cfg())
  );
};

/** Разблокировка пользователя. */
const unblockUser = (userId: number) => {
  if (userId == null || !Number.isFinite(Number(userId))) {
    return Promise.reject(new Error("Некорректный id пользователя"));
  }
  return withApiCall("admin.unblockUser", () =>
    axios.put(API_URL + `admin/users/${userId}/unblock`, {}, cfg())
  );
};

/** Список всех пользователей. */
const getAllUsers = () => {
  return withApiCall("admin.getAllUsers", () => axios.get(API_URL + "admin/users", cfg()));
};

/** Получить список резюме, ожидающих модерации. */
const getPendingResumes = () => {
  return withApiCall("moderation.getPendingResumes", () =>
    axios.get(API_URL + "moderation/resumes/pending", cfg())
  );
};

/** Одобрить резюме. */
const approveResume = (resumeId: number) => {
  if (resumeId == null || !Number.isFinite(Number(resumeId))) {
    return Promise.reject(new Error("Некорректный id резюме"));
  }
  return withApiCall("moderation.approveResume", () =>
    axios.patch(API_URL + `moderation/resumes/${resumeId}/approve`, {}, cfg())
  );
};

/** Отклонить резюме с причиной. */
const rejectResume = (resumeId: number, reason?: string) => {
  if (resumeId == null || !Number.isFinite(Number(resumeId))) {
    return Promise.reject(new Error("Некорректный id резюме"));
  }
  return withApiCall("moderation.rejectResume", () =>
    axios.patch(
      API_URL + `moderation/resumes/${resumeId}/reject`,
      { reason: reason || "" },
      cfg()
    )
  );
};

/** Получить список сервисов, ожидающих модерации. */
const getPendingServices = () => {
  return withApiCall("moderation.getPendingServices", () =>
    axios.get(API_URL + "moderation/services/pending", cfg())
  );
};

/** Одобрить сервис. */
const approveService = (serviceId: number) => {
  if (serviceId == null || !Number.isFinite(Number(serviceId))) {
    return Promise.reject(new Error("Некорректный id сервиса"));
  }
  return withApiCall("moderation.approveService", () =>
    axios.patch(API_URL + `moderation/services/${serviceId}/approve`, {}, cfg())
  );
};

/** Отклонить сервис с причиной. */
const rejectService = (serviceId: number, reason?: string) => {
  if (serviceId == null || !Number.isFinite(Number(serviceId))) {
    return Promise.reject(new Error("Некорректный id сервиса"));
  }
  return withApiCall("moderation.rejectService", () =>
    axios.patch(
      API_URL + `moderation/services/${serviceId}/reject`,
      { reason: reason || "" },
      cfg()
    )
  );
};

/** Удалить сервис (менеджер/админ). */
const deleteService = (serviceId: number) => {
  if (serviceId == null || !Number.isFinite(Number(serviceId))) {
    return Promise.reject(new Error("Некорректный id сервиса"));
  }
  return withApiCall("moderation.deleteService", () =>
    axios.delete(API_URL + `moderation/services/${serviceId}`, cfg())
  );
};

/** Получить статистику модерации. */
const getModerationStats = () => {
  return withApiCall("moderation.getStats", () =>
    axios.get(API_URL + "moderation/stats", cfg())
  );
};

const AdminService = {
  blockUser,
  unblockUser,
  getAllUsers,
  getPendingResumes,
  approveResume,
  rejectResume,
  getPendingServices,
  approveService,
  rejectService,
  deleteService,
  getModerationStats,
};

export default AdminService;
