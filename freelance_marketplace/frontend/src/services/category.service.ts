import axios from "axios";
import { API_BASE_URL } from "../config/api.config";
import { withApiCall } from "../utils/api-request";
import { getAuthAxiosConfig } from "../utils/auth-headers";

const API_URL = `${API_BASE_URL}/`;

const cfg = () => getAuthAxiosConfig();

/** Создание категории. */
const createCategory = (data: { name: string; description?: string }) => {
  if (!data?.name?.trim()) {
    return Promise.reject(new Error("Укажите название категории"));
  }
  return withApiCall("category.create", () =>
    axios.post(API_URL + "categories", { ...data, name: data.name.trim() }, cfg())
  );
};

/** Дерево категорий. */
const getCategories = () => {
  return withApiCall("category.list", () =>
    axios.get(API_URL + "categories", { withCredentials: true })
  );
};

/** Удаление категории. */
const deleteCategory = (id: number) => {
  if (id == null || !Number.isFinite(Number(id))) {
    return Promise.reject(new Error("Некорректный id категории"));
  }
  return withApiCall("category.delete", () => axios.delete(API_URL + `categories/${id}`, cfg()));
};

/** Создание подкатегории. */
const createSubcategory = (data: { parentId: number; name: string; description?: string }) => {
  if (data?.parentId == null || !data?.name?.trim()) {
    return Promise.reject(new Error("Укажите родителя и название"));
  }
  return withApiCall("category.createSub", () =>
    axios.post(API_URL + "categories/subcategory", { ...data, name: data.name.trim() }, cfg())
  );
};

const CategoryService = {
  createCategory,
  getCategories,
  deleteCategory,
  createSubcategory,
};

export default CategoryService;
