import axios from "axios";
import { API_BASE_URL } from "../config/api.config";
import { withApiCall } from "../utils/api-request";
import { getAuthAxiosConfig } from "../utils/auth-headers";

const API_URL = `${API_BASE_URL}/`;

const cfg = () => getAuthAxiosConfig();

/**
 * Создание заказа.
 * @param data — поля заказа
 * @returns ответ axios
 */
const createOrder = (data: {
  title: string;
  description: string;
  budget?: number;
  deadline?: string;
  categoryId: number;
}) => {
  if (!data?.title?.trim() || !data?.description?.trim() || data.categoryId == null) {
    return Promise.reject(new Error("Укажите название, описание и категорию"));
  }
  return withApiCall("order.create", () =>
    axios.post(API_URL + "orders", { ...data, title: data.title.trim(), description: data.description.trim() }, cfg())
  );
};

/**
 * Список заказов с фильтрами.
 */
const getOrders = (params?: {
  categoryId?: number;
  search?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: string;
  /** Режим каталога: из списка по умолчанию исключаются скрытые заказы (не фильтр по одобрению). */
  catalogOnly?: boolean;
}) => {
  return withApiCall("order.list", () =>
    axios.get(API_URL + "orders", { params, withCredentials: true })
  );
};

const getMyOrders = () => {
  return withApiCall("order.listMine", () =>
    axios.get(API_URL + "orders/mine", cfg())
  );
};

/**
 * Заказ по id.
 * @param id — идентификатор
 */
const getOrderById = (id: number) => {
  if (id == null || !Number.isFinite(Number(id))) {
    return Promise.reject(new Error("Некорректный id заказа"));
  }
  return withApiCall("order.getById", () =>
    axios.get(API_URL + `orders/${id}`, { withCredentials: true })
  );
};

/**
 * Обновление заказа.
 */
const updateOrder = (
  id: number,
  data: {
    title?: string;
    description?: string;
    budget?: number;
    deadline?: string;
    categoryId?: number;
    status?: string;
  }
) => {
  if (id == null || !Number.isFinite(Number(id))) {
    return Promise.reject(new Error("Некорректный id заказа"));
  }
  return withApiCall("order.update", () => axios.put(API_URL + `orders/${id}`, data, cfg()));
};

/**
 * Удаление заказа.
 */
const deleteOrder = (id: number) => {
  if (id == null || !Number.isFinite(Number(id))) {
    return Promise.reject(new Error("Некорректный id заказа"));
  }
  return withApiCall("order.delete", () => axios.delete(API_URL + `orders/${id}`, cfg()));
};

/**
 * Статистика по заказу.
 */
const getOrderStats = (id: number) => {
  if (id == null || !Number.isFinite(Number(id))) {
    return Promise.reject(new Error("Некорректный id заказа"));
  }
  return withApiCall("order.stats", () => axios.get(API_URL + `orders/${id}/stats`, cfg()));
};

const OrderService = {
  createOrder,
  getOrders,
  getMyOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  getOrderStats,
};

export default OrderService;
