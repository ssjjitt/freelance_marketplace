import axios from "axios";
import { API_BASE_URL } from "../config/api.config";
import { withApiCall } from "../utils/api-request";
import { getAuthAxiosConfig } from "../utils/auth-headers";

const API_URL = `${API_BASE_URL}/`;

const cfg = () => getAuthAxiosConfig();

/**
 * Создание услуги.
 */
const createService = (data: {
  title: string;
  description: string;
  price?: number;
  categoryId: number;
}) => {
  if (!data?.title?.trim() || !data?.description?.trim() || data.categoryId == null) {
    return Promise.reject(new Error("Укажите название, описание и категорию"));
  }
  return withApiCall("service.create", () =>
    axios.post(
      API_URL + "services",
      { ...data, title: data.title.trim(), description: data.description.trim() },
      cfg()
    )
  );
};

/** Список услуг. */
const getServices = (params?: {
  categoryId?: number;
  search?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: string;
  /** Только одобренные менеджером услуги (каталог). */
  catalogOnly?: boolean;
}) => {
  return withApiCall("service.list", () =>
    axios.get(API_URL + "services", { params, withCredentials: true })
  );
};

/** Услуга по id. */
const getServiceById = (id: number) => {
  if (id == null || !Number.isFinite(Number(id))) {
    return Promise.reject(new Error("Некорректный id услуги"));
  }
  return withApiCall("service.getById", () =>
    axios.get(API_URL + `services/${id}`, { withCredentials: true })
  );
};

/** Обновление услуги. */
const updateService = (
  id: number,
  data: {
    title?: string;
    description?: string;
    price?: number;
    categoryId?: number;
    status?: string;
  }
) => {
  if (id == null || !Number.isFinite(Number(id))) {
    return Promise.reject(new Error("Некорректный id услуги"));
  }
  return withApiCall("service.update", () => axios.put(API_URL + `services/${id}`, data, cfg()));
};

/** Удаление услуги. */
const deleteService = (id: number) => {
  if (id == null || !Number.isFinite(Number(id))) {
    return Promise.reject(new Error("Некорректный id услуги"));
  }
  return withApiCall("service.delete", () => axios.delete(API_URL + `services/${id}`, cfg()));
};

/** Статистика по услуге. */
const getServiceStats = (id: number) => {
  if (id == null || !Number.isFinite(Number(id))) {
    return Promise.reject(new Error("Некорректный id услуги"));
  }
  return withApiCall("service.stats", () => axios.get(API_URL + `services/${id}/stats`, cfg()));
};

const ServiceService = {
  createService,
  getServices,
  getServiceById,
  updateService,
  deleteService,
  getServiceStats,
};

export default ServiceService;
