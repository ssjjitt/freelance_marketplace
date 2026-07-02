import axios from "axios";
import { API_BASE_URL } from "../config/api.config";
import { withApiCall } from "../utils/api-request";
import { getAuthAxiosConfig } from "../utils/auth-headers";

const API_URL = `${API_BASE_URL}/`;

const cfg = () => getAuthAxiosConfig();

/** Создание резюме. */
const createResume = (data: {
  title: string;
  description: string;
  experience?: string;
  education?: string;
  skills?: string;
  portfolio?: string;
}) => {
  if (!data?.title?.trim() || !data?.description?.trim()) {
    return Promise.reject(new Error("Укажите заголовок и описание"));
  }
  return withApiCall("resume.create", () =>
    axios.post(
      API_URL + "resumes",
      { ...data, title: data.title.trim(), description: data.description.trim() },
      cfg()
    )
  );
};

/** Список резюме. */
const getResumes = (params?: { executerId?: number }) => {
  return withApiCall("resume.list", () =>
    axios.get(API_URL + "resumes", { params, withCredentials: true })
  );
};

/** Резюме по id. */
const getResumeById = (id: number) => {
  if (id == null || !Number.isFinite(Number(id))) {
    return Promise.reject(new Error("Некорректный id резюме"));
  }
  return withApiCall("resume.getById", () =>
    axios.get(API_URL + `resumes/${id}`, { withCredentials: true })
  );
};

/** Обновление резюме. */
const updateResume = (
  id: number,
  data: {
    title?: string;
    description?: string;
    experience?: string;
    education?: string;
    skills?: string;
    portfolio?: string;
    isActive?: boolean;
  }
) => {
  if (id == null || !Number.isFinite(Number(id))) {
    return Promise.reject(new Error("Некорректный id резюме"));
  }
  return withApiCall("resume.update", () => axios.put(API_URL + `resumes/${id}`, data, cfg()));
};

/** Удаление резюме. */
const deleteResume = (id: number) => {
  if (id == null || !Number.isFinite(Number(id))) {
    return Promise.reject(new Error("Некорректный id резюме"));
  }
  return withApiCall("resume.delete", () => axios.delete(API_URL + `resumes/${id}`, cfg()));
};

/** Одобрение резюме (модерация). */
const approveResume = (id: number) => {
  if (id == null || !Number.isFinite(Number(id))) {
    return Promise.reject(new Error("Некорректный id резюме"));
  }
  return withApiCall("resume.approve", () =>
    axios.post(API_URL + `resumes/${id}/approve`, {}, cfg())
  );
};

/** Очередь на модерацию. */
const getPendingResumes = () => {
  return withApiCall("resume.pending", () => axios.get(API_URL + "resumes/pending", cfg()));
};

const ResumeService = {
  createResume,
  getResumes,
  getResumeById,
  updateResume,
  deleteResume,
  approveResume,
  getPendingResumes,
};

export default ResumeService;
