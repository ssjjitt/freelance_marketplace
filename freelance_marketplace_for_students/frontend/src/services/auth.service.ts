import axios from "axios";
import { API_BASE_URL } from "../config/api.config";
import { withApiCall } from "../utils/api-request";

const API_URL = `${API_BASE_URL}/auth/`;

/**
 * Регистрация нового пользователя.
 * @param username — логин
 * @param email — почта
 * @param password — пароль
 * @param roles — роли (опционально)
 * @returns Promise ответа axios
 */
const register = (username: string, email: string, password: string, roles: string[]) => {
  if (!username?.trim() || !email?.trim() || !password) {
    return Promise.reject(new Error("Заполните логин, email и пароль"));
  }
  const payload: Record<string, unknown> = {
    username: username.trim(),
    email: email.trim(),
    password,
  };
  if (roles?.length) {
    payload.roles = roles;
  }
  return withApiCall("auth.register", () => axios.post(`${API_URL}signup`, payload));
};

/**
 * Вход: сохраняет пользователя в localStorage при успехе.
 * @param username — логин
 * @param password — пароль
 * @returns данные пользователя с accessToken
 */
const login = (username: string, password: string) => {
  if (!username?.trim() || !password) {
    return Promise.reject(new Error("Укажите логин и пароль"));
  }
  return withApiCall("auth.login", () =>
    axios
      .post(`${API_URL}signin`, {
        username: username.trim(),
        password,
      })
      .then((response) => {
        if (response.data?.accessToken) {
          localStorage.setItem("user", JSON.stringify(response.data));
        }
        return response.data;
      })
  );
};

/** Удаляет сессию из localStorage. */
const logout = () => {
  localStorage.removeItem("user");
};

/**
 * Текущий пользователь из localStorage.
 * @returns объект пользователя или null
 */
const getCurrentUser = () => {
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

/**
 * Запрос письма для верификации email.
 * @param email — адрес
 */
const sendVerification = (email: string) => {
  if (!email?.trim()) {
    return Promise.reject(new Error("Укажите email"));
  }
  return withApiCall("auth.sendVerification", () =>
    axios.post(`${API_URL}send-verification`, { email: email.trim() })
  );
};

/**
 * Подтверждение email 4-значным кодом из письма.
 */
const verifyEmailCode = (email: string, code: string) => {
  if (!email?.trim()) {
    return Promise.reject(new Error("Укажите email"));
  }
  const digits = String(code ?? "").replace(/\D/g, "").slice(0, 4);
  if (digits.length !== 4) {
    return Promise.reject(new Error("Введите 4 цифры кода"));
  }
  return withApiCall("auth.verifyEmailCode", () =>
    axios.post(`${API_URL}verify-email-code`, {
      email: email.trim(),
      code: digits,
    })
  );
};

const AuthService = {
  register,
  login,
  logout,
  getCurrentUser,
  sendVerification,
  verifyEmailCode,
};

export default AuthService;
