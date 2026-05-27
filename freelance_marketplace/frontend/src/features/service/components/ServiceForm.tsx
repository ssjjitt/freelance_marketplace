import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ServiceService from "../../../services/service.service";
import CategoryService from "../../../services/category.service";
import AttachmentService from "../../../services/attachment.service";
import CategoryDropdown from "../../../components/ui/CategoryDropdown";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import AttachmentPicker from "../../../components/ui/AttachmentPicker";
import type { ExistingAttachment } from "../../../components/ui/AttachmentPicker";
import { API_BASE_URL } from "../../../config/api.config";

interface Category {
  id: number;
  name: string;
  parentId?: number | null;
}

const ServiceForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    categoryId: "",
    status: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<ExistingAttachment[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await CategoryService.getCategories();
        if (!cancelled) setCategories(res.data);
      } catch (error) {
        if (!cancelled) console.error("Ошибка загрузки категорий:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!id) {
      setFormData({ title: "", description: "", price: "", categoryId: "", status: "" });
      setExistingAttachments([]);
      setSelectedFiles([]);
      setMessage("");
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setMessage("");
    setError("");

    (async () => {
      try {
        const res = await ServiceService.getServiceById(Number(id));
        if (cancelled) return;
        const service = res.data as {
          title?: string;
          description?: string;
          price?: number;
          categoryId?: number;
          status?: string;
          attachments?: {
            id: number;
            originalName: string;
            storedPath: string;
            url?: string;
          }[];
        };
        setFormData({
          title: service.title || "",
          description: service.description || "",
          price: service.price?.toString() || "",
          categoryId: service.categoryId?.toString() || "",
          status: service.status || "active"
        });
        const base = API_BASE_URL.replace(/\/+$/, "");
        setExistingAttachments(
          (service.attachments || []).map((a) => ({
            id: a.id,
            originalName: a.originalName,
            url:
              a.url ||
              `${base}/uploads/${String(a.storedPath).replace(/\\/g, "/")}`,
          }))
        );
      } catch (error) {
        if (!cancelled) setError("Не удалось загрузить услугу");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    if (!formData.categoryId) {
      setError("Пожалуйста, выберите категорию");
      setLoading(false);
      return;
    }

    try {
      const data = {
        title: formData.title,
        description: formData.description,
        price: formData.price ? Number(formData.price) : undefined,
        categoryId: Number(formData.categoryId),
        ...(id && formData.status && { status: formData.status })
      };

      let targetId: number;
      if (id) {
        await ServiceService.updateService(Number(id), data);
        targetId = Number(id);
        setMessage("Услуга обновлена");
      } else {
        const created = await ServiceService.createService(data);
        targetId = created.data.id;
        setMessage("Услуга создана");
      }

      if (selectedFiles.length > 0) {
        try {
          await AttachmentService.uploadServiceAttachments(targetId, selectedFiles);
          setSelectedFiles([]);
        } catch (uploadErr: any) {
          setError(
            uploadErr.response?.data?.message ||
              "Услуга сохранена, но не удалось загрузить вложения. Попробуйте позже."
          );
          setLoading(false);
          return;
        }
      }

      setTimeout(() => {
        navigate("/catalog");
      }, 1000);
    } catch (error: any) {
      setError(error.response?.data?.message || "Ошибка сохранения услуги");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExistingAttachment = async (attachmentId: number) => {
    try {
      await AttachmentService.deleteAttachment(attachmentId);
      setExistingAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
    } catch {
      setError("Не удалось удалить вложение");
    }
  };

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-3xl mx-auto text-white">
        <form
          onSubmit={handleSubmit}
          className="form-panel"
        >
          <h1 className="text-3xl font-semibold mb-6">{id ? "Редактировать услугу" : "Создать услугу"}</h1>
          <label className="flex flex-col gap-2 text-sm">
            Название
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="ui-input"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            Описание
            <textarea
              required
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="ui-textarea"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            Цена (BYN)
            <input
              type="number"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              className="ui-input"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            Категория
            <CategoryDropdown
              categories={categories}
              value={formData.categoryId}
              onChange={(categoryId) => setFormData({ ...formData, categoryId })}
              placeholder="Выберите категорию"
              required
            />
          </label>

          {id && (
            <label className="flex flex-col gap-2 text-sm">
              Статус услуги
              <SelectDropdown
                value={formData.status}
                onChange={(status) => setFormData({ ...formData, status })}
                options={[
                  { value: "active", label: "Активна" },
                  { value: "inactive", label: "Неактивна" },
                  { value: "archived", label: "Архивирована" }
                ]}
                placeholder="Выберите статус"
              />
            </label>
          )}

          <AttachmentPicker
            selectedFiles={selectedFiles}
            onSelectedFilesChange={setSelectedFiles}
            existingAttachments={existingAttachments}
            onDeleteExistingAttachment={handleDeleteExistingAttachment}
            disabled={loading}
          />

          {(message || error) && (
            <p className={`message-box ${message ? "success" : "error"}`}>
              {message || error}
            </p>
          )}

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="ui-btn-primary flex-1 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Сохранение..." : id ? "Обновить" : "Создать"}
            </button>
            <button type="button" onClick={() => navigate("/catalog")} className="ui-btn-outline-danger">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ServiceForm;

