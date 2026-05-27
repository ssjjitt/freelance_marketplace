import axios from "axios";
import type { AxiosResponse } from "axios";
import { API_BASE_URL } from "../config/api.config";
import type { ContactPayload } from "../types/profile.types";
import { withApiCall } from "../utils/api-request";
import { getAuthAxiosConfig } from "../utils/auth-headers";

const API_URL = `${API_BASE_URL}/`;

const cfg = () => getAuthAxiosConfig();

/**
 * Профиль текущего пользователя.
 */
const getProfile = <T = unknown>(): Promise<AxiosResponse<T>> => {
  return withApiCall("profile.get", () => axios.get(API_URL + "profile", cfg()));
};

/**
 * Сохранение профиля, контактов и навыков.
 */
const updateProfile = (
  profileData: Record<string, unknown>,
  contactsData: ContactPayload[],
  skillsData: string[]
): Promise<AxiosResponse<unknown>> => {
  if (!profileData || typeof profileData !== "object") {
    return Promise.reject(new Error("Некорректные данные профиля"));
  }
  if (!Array.isArray(contactsData) || !Array.isArray(skillsData)) {
    return Promise.reject(new Error("Некорректные контакты или навыки"));
  }
  return withApiCall("profile.update", () =>
    axios.put(
      API_URL + "profile",
      {
        profileData,
        contactsData,
        skillsData,
      },
      cfg()
    )
  );
};

/**
 * Рабочий профиль (исполнитель).
 */
const getWorkProfile = <T = unknown>(): Promise<AxiosResponse<T>> => {
  return withApiCall("profile.work", () => axios.get(API_URL + "profile/work", cfg()));
};

/**
 * Загрузка аватара (data URL или base64 строка).
 */
const uploadAvatar = (avatarData: string): Promise<AxiosResponse<unknown>> => {
  if (avatarData == null || String(avatarData).trim() === "") {
    return Promise.reject(new Error("Пустые данные аватара"));
  }
  return withApiCall("profile.avatar", () =>
    axios.put(API_URL + "profile/avatar", { avatar: avatarData }, cfg())
  );
};

/**
 * Поиск пользователей по строке (или все пользователи если строка пустая).
 */
const searchUsers = (searchQuery: string = ""): Promise<AxiosResponse<unknown>> => {
  return withApiCall("profile.searchUsers", () =>
    axios.get(API_URL + "profile/search", {
      ...cfg(),
      params: { search: searchQuery.trim() },
    })
  );
};

/**
 * Получить всех пользователей (для каталога).
 */
const getAllUsers = (): Promise<AxiosResponse<unknown>> => {
  return withApiCall("profile.getAllUsers", () =>
    axios.get(API_URL + "profile/search", {
      ...cfg(),
      params: { search: "" },
    })
  );
};

/**
 * Рабочий профиль другого пользователя.
 */
const getUserWorkProfile = <T = unknown>(userId: number): Promise<AxiosResponse<T>> => {
  if (userId == null || !Number.isFinite(Number(userId))) {
    return Promise.reject(new Error("Некорректный id пользователя"));
  }
  return withApiCall("profile.userWork", () =>
    axios.get(API_URL + `profile/${userId}/work`, cfg())
  );
};

const ProfileService = {
  getProfile,
  updateProfile,
  getWorkProfile,
  getUserWorkProfile,
  uploadAvatar,
  searchUsers,
  getAllUsers,
};

export default ProfileService;
