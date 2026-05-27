import axios from "axios";
import { API_BASE_URL } from "../config/api.config";
import { withApiCall } from "../utils/api-request";
import { getAuthAxiosConfig } from "../utils/auth-headers";

const API_URL = `${API_BASE_URL}/`;

const cfg = () => getAuthAxiosConfig();

/** Добавить исполнителя в избранное. */
const addFavorite = (executerId: number) => {
  if (executerId == null || !Number.isFinite(Number(executerId))) {
    return Promise.reject(new Error("Некорректный id исполнителя"));
  }
  return withApiCall("favorite.add", () =>
    axios.post(API_URL + "favorites", { executerId }, cfg())
  );
};

/** Удалить из избранного. */
const removeFavorite = (executerId: number) => {
  if (executerId == null || !Number.isFinite(Number(executerId))) {
    return Promise.reject(new Error("Некорректный id исполнителя"));
  }
  return withApiCall("favorite.remove", () =>
    axios.delete(API_URL + `favorites/${executerId}`, cfg())
  );
};

/** Список избранных исполнителей. */
const getFavorites = () => {
  return withApiCall("favorite.list", () => axios.get(API_URL + "favorites", cfg()));
};

const FavoriteService = {
  addFavorite,
  removeFavorite,
  getFavorites,
};

export default FavoriteService;
