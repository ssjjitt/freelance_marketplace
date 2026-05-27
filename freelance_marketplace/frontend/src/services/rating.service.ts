import axios from "axios";
import { API_BASE_URL } from "../config/api.config";
import { withApiCall } from "../utils/api-request";
import { getAuthAxiosConfig } from "../utils/auth-headers";

const API_URL = `${API_BASE_URL}/`;

const cfg = () => getAuthAxiosConfig();

/**
 * Создание отзыва/оценки.
 */
const createRating = (data: {
  toUserId: number;
  orderId?: number;
  serviceId?: number;
  rating: number;
  comment?: string;
}) => {
  if (data?.toUserId == null || data?.rating == null) {
    return Promise.reject(new Error("Укажите пользователя и оценку"));
  }
  return withApiCall("rating.create", () => axios.post(API_URL + "ratings", data, cfg()));
};

/**
 * Список оценок (опционально по userId).
 */
const getRatings = (params?: { userId?: number }) => {
  return withApiCall("rating.list", () =>
    axios.get(API_URL + "ratings", { params, withCredentials: true })
  );
};

const RatingService = {
  createRating,
  getRatings,
};

export default RatingService;
