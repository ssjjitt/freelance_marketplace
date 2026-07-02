import axios from "axios";
import { API_BASE_URL } from "../config/api.config";
import { withApiCall } from "../utils/api-request";
import { getAuthAxiosConfig } from "../utils/auth-headers";

const API_URL = `${API_BASE_URL}/api/stats/`;

const publicCfg = { withCredentials: true as const };

/** Агрегированная статистика платформы. */
const getPlatformStats = () => {
  return withApiCall("stats.platform", () => axios.get(`${API_URL}platform`, publicCfg));
};

/** Популярные категории. */
const getPopularCategories = (limit: number = 6) => {
  return withApiCall("stats.popularCategories", () =>
    axios.get(`${API_URL}categories/popular`, { params: { limit }, ...publicCfg })
  );
};

/** Новые категории. */
const getNewCategories = (limit: number = 6) => {
  return withApiCall("stats.newCategories", () =>
    axios.get(`${API_URL}categories/new`, { params: { limit }, ...publicCfg })
  );
};

/** Топ исполнителей. */
const getBestFreelancers = (limit: number = 6) => {
  return withApiCall("stats.bestFreelancers", () =>
    axios.get(`${API_URL}freelancers/best`, { params: { limit }, ...publicCfg })
  );
};

/** Топ заказчиков. */
const getBestCustomers = (limit: number = 6) => {
  return withApiCall("stats.bestCustomers", () =>
    axios.get(`${API_URL}customers/best`, { params: { limit }, ...publicCfg })
  );
};

/** Лента активности. */
const getActivityFeed = (limit: number = 20) => {
  return withApiCall("stats.activity", () =>
    axios.get(`${API_URL}activity`, { params: { limit }, ...publicCfg })
  );
};

/**
 * Месячная статистика (только для авторизованных).
 */
const getMonthlyStats = (year: number, month: number, type: string) => {
  if (year == null || month == null || !type?.trim()) {
    return Promise.reject(new Error("Укажите год, месяц и тип"));
  }
  const auth = getAuthAxiosConfig();
  if (!auth.headers.Authorization) {
    return Promise.reject(new Error("Not authenticated"));
  }
  return withApiCall("stats.monthly", () =>
    axios.get(`${API_URL}monthly`, {
      params: { year, month, type },
      ...auth,
    })
  );
};

const StatsService = {
  getPlatformStats,
  getPopularCategories,
  getNewCategories,
  getBestFreelancers,
  getBestCustomers,
  getActivityFeed,
  getMonthlyStats,
};

export default StatsService;
