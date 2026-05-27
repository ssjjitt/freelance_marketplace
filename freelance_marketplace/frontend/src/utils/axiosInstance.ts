import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import AuthService from "../services/auth.service";
import { API_BASE_URL } from "../config/api.config";

const axiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/`,
  withCredentials: true,
  timeout: 10000,
});

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        if (userData.accessToken && config.headers) {
          config.headers.Authorization = `Bearer ${userData.accessToken}`;
        }
      } catch (error) {
        console.error("Ошибка парсинга токена:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      
      if (status === 401 || status === 403) {
        const message = (error.response.data as any)?.message;
        
        if (message && (message.includes("Нет токена") || message.includes("Неавторизовано"))) {
          return Promise.reject(error);
        }
        
        if (status === 401) {
          AuthService.logout();
        }
      }
    } else if (error.request) {
      console.error("Ошибка сети:", error.request);
    } else {
      console.error("Ошибка запроса:", error.message);
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;

