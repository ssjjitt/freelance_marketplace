import axios from "axios";
import { API_BASE_URL } from "../config/api.config";
import { withApiCall } from "../utils/api-request";
import { getAuthAxiosConfig } from "../utils/auth-headers";

const API_URL = `${API_BASE_URL}/`;

const cfg = () => getAuthAxiosConfig();

/**
 * Создание отклика на заказ или услугу.
 */
const createApplication = (data: {
  orderId?: number;
  serviceId?: number;
  message?: string;
  proposedPrice?: number;
}) => {
  if (data?.orderId == null && data?.serviceId == null) {
    return Promise.reject(new Error("Укажите orderId или serviceId"));
  }
  return withApiCall("application.create", () => axios.post(API_URL + "applications", data, cfg()));
};

/** Отмена отклика. */
const cancelApplication = (id: number) => {
  if (id == null || !Number.isFinite(Number(id))) {
    return Promise.reject(new Error("Некорректный id отклика"));
  }
  return withApiCall("application.cancel", () => axios.delete(API_URL + `applications/${id}`, cfg()));
};

/** Принятие отклика. */
const approveApplication = (id: number) => {
  if (id == null || !Number.isFinite(Number(id))) {
    return Promise.reject(new Error("Некорректный id отклика"));
  }
  return withApiCall("application.approve", () =>
    axios.put(API_URL + `applications/${id}/approve`, {}, cfg())
  );
};

/** Отклонение отклика. */
const rejectApplication = (id: number) => {
  if (id == null || !Number.isFinite(Number(id))) {
    return Promise.reject(new Error("Некорректный id отклика"));
  }
  return withApiCall("application.reject", () =>
    axios.put(API_URL + `applications/${id}/reject`, {}, cfg())
  );
};

/** Открытие спора по заказу. */
const openDispute = (data: { orderId: number; reason: string }) => {
  return withApiCall("dispute.open", () => axios.post(API_URL + "disputes", data, cfg()));
};

/** Открытие спора по отклоненному отклику. */
const openDisputeForApplication = (
  applicationId: number,
  data: { reason: string; description?: string }
) => {
  if (applicationId == null || !Number.isFinite(Number(applicationId))) {
    return Promise.reject(new Error("Некорректный id отклика"));
  }
  return withApiCall("application.openDispute", () =>
    axios.post(API_URL + `applications/${applicationId}/disputes`, data, cfg())
  );
};

/** Мои отклики. */
const getMyApplications = () => {
  return withApiCall("application.my", () => axios.get(API_URL + "applications/my", cfg()));
};

/** Отклики к моим объявлениям. */
const getApplicationsForMyItems = () => {
  return withApiCall("application.forMyItems", () =>
    axios.get(API_URL + "applications/for-my-items", cfg())
  );
};

/** История откликов на заказ. */
const getApplicationsByOrderId = (orderId: number) => {
  if (orderId == null || !Number.isFinite(Number(orderId))) {
    return Promise.reject(new Error("Некорректный id заказа"));
  }
  return withApiCall("application.byOrderId", () =>
    axios.get(API_URL + `applications/order/${orderId}`)
  );
};

/** История откликов на услугу. */
const getApplicationsByServiceId = (serviceId: number) => {
  if (serviceId == null || !Number.isFinite(Number(serviceId))) {
    return Promise.reject(new Error("Некорректный id услуги"));
  }
  return withApiCall("application.byServiceId", () =>
    axios.get(API_URL + `applications/service/${serviceId}`)
  );
};

const ApplicationService = {
  createApplication,
  cancelApplication,
  approveApplication,
  rejectApplication,
  openDispute,
  openDisputeForApplication,
  getMyApplications,
  getApplicationsForMyItems,
  getApplicationsByOrderId,
  getApplicationsByServiceId,
};

export default ApplicationService;
