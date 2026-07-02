import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ResumeService from "../../../services/resume.service";
import TagInput from "../../../components/ui/TagInput";

const ResumeForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    experience: "",
    education: "",
    skills: "",
    portfolio: "",
    isActive: true
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) {
      setFormData({
        title: "",
        description: "",
        experience: "",
        education: "",
        skills: "",
        portfolio: "",
        isActive: true,
      });
      setMessage("");
      setError("");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError("");

    (async () => {
      try {
        const res = await ResumeService.getResumeById(Number(id));
        if (cancelled) return;
        const resume = res.data;
        setFormData({
          title: resume.title || "",
          description: resume.description || "",
          experience: resume.experience || "",
          education: resume.education || "",
          skills: resume.skills || "",
          portfolio: resume.portfolio || "",
          isActive: resume.isActive ?? true,
        });
      } catch (error) {
        if (!cancelled) setError("Не удалось загрузить резюме");
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

    try {
      if (id) {
        await ResumeService.updateResume(Number(id), formData);
        setMessage("Резюме обновлено и отправлено на модерацию");
      } else {
        // При создании не передаем isActive, так как оно имеет значение по умолчанию
        const { isActive, ...createData } = formData;
        await ResumeService.createResume(createData);
        setMessage("Резюме создано и отправлено на модерацию");
      }

      setTimeout(() => {
        navigate("/profile");
      }, 2000);
    } catch (error: any) {
      setError(error.response?.data?.message || "Ошибка сохранения резюме");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-3xl mx-auto text-white">
        <form
          onSubmit={handleSubmit}
          className="form-panel"
        >
          <h1 className="text-3xl font-semibold mb-6">{id ? "Редактировать резюме" : "Создать резюме"}</h1>
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
            Опыт работы
            <textarea
              rows={4}
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              className="ui-textarea"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            Образование
            <textarea
              rows={4}
              value={formData.education}
              onChange={(e) => setFormData({ ...formData, education: e.target.value })}
              className="ui-textarea"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            Навыки
            <TagInput
              tags={formData.skills ? formData.skills.split(",").filter(Boolean) : []}
              onChange={(newTags) => setFormData({ ...formData, skills: newTags.join(",") })}
              placeholder="Введите навык и нажмите Enter"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm">
            Портфолио (ссылка)
            <input
              type="url"
              value={formData.portfolio}
              onChange={(e) => setFormData({ ...formData, portfolio: e.target.value })}
              className="ui-input"
            />
          </label>

          <div className="flex items-center justify-between rounded-xl border border-white/10 bg-surface p-4">
            <span className="text-sm font-medium">Статус резюме</span>
            <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="sr-only peer"
            />
              <div className="w-11 h-6 bg-white/20 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/40 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white-muted after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:border peer-checked:border-primary/40 peer-checked:bg-white/10"></div>
              <span className="ml-3 text-sm font-medium text-white">
                {formData.isActive ? "Активно" : "Скрыто"}
              </span>
          </label>
          </div>

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
            <button type="button" onClick={() => navigate("/profile")} className="ui-btn-outline-danger">
              Отмена
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default ResumeForm;

