import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ProfileService from "../../../services/profile.service";

type ContactType = "messenger" | "social" | "other";

type ContactFormState = {
  platform: string;
  username?: string;
  url?: string;
  phone?: string;
  email?: string;
};

type ContactState = Record<ContactType, ContactFormState[]>;

const contactSections: Array<{ key: ContactType; title: string }> = [
  { key: "messenger", title: "Мессенджеры" },
  { key: "social", title: "Социальные сети" },
  { key: "other", title: "Другие контакты" }
];

const emptyContact = (): ContactFormState => ({
  platform: "",
  username: "",
  url: "",
  phone: "",
  email: ""
});

const defaultContactState: ContactState = {
  messenger: [],
  social: [],
  other: []
};

const ProfileEditor: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [skillInput, setSkillInput] = useState("");
  const [formData, setFormData] = useState({
    lastname: "",
    name: "",
    country: "",
    city: "",
    education: "",
    website: "",
    phone: "",
    email: "",
    availability: "",
    about: "",
    completedProjects: "",
    inProgress: "",
    responseTimeHours: ""
  });
  const [skills, setSkills] = useState<string[]>([]);
  const [contacts, setContacts] = useState<ContactState>(defaultContactState);

  useEffect(() => {
    ProfileService.getProfile<{ profile: any }>()
      .then((response) => {
        const profile = response.data?.profile;
        if (profile) {
          setFormData({
            lastname: profile.lastname || "",
            name: profile.name || "",
            country: profile.country || "",
            city: profile.city || "",
            education: profile.education || "",
            website: profile.website || "",
            phone: profile.phone || "",
            email: profile.email || "",
            availability: profile.availability || "",
            about: profile.about || "",
            completedProjects: profile.completedProjects?.toString() || "",
            inProgress: profile.inProgress?.toString() || "",
            responseTimeHours: profile.responseTimeHours?.toString() || ""
          });
          setSkills(
            profile.skills
              ? profile.skills.map((skill: { name: string }) => skill.name)
              : []
          );
          if (profile.contacts?.length) {
            const next: ContactState = { messenger: [], social: [], other: [] };
            profile.contacts.forEach(
              (contact: ContactFormState & { type?: ContactType }) => {
                const type = (contact.type || "other") as ContactType;
                next[type] = [
                  ...next[type],
                  {
                    platform: contact.platform || "",
                    username: contact.username || "",
                    url: contact.url || "",
                    phone: contact.phone || "",
                    email: contact.email || ""
                  }
                ];
              }
            );
            setContacts(next);
          }
        }
      })
      .catch((err: unknown) => {
        const apiError = err as { response?: { data?: { message?: string } } };
        setError(
          apiError.response?.data?.message ||
            "Не удалось загрузить данные профиля. Попробуйте позже."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const profileSkills = useMemo(() => skills, [skills]);

  const handleFieldChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills((prev) => [...prev, trimmed]);
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((item) => item !== skill));
  };

  const addContact = (type: ContactType) => {
    setContacts((prev) => ({
      ...prev,
      [type]: [...prev[type], emptyContact()]
    }));
  };

  const updateContact = (
    type: ContactType,
    index: number,
    field: keyof ContactFormState,
    value: string
  ) => {
    setContacts((prev) => {
      const nextList = [...prev[type]];
      nextList[index] = {
        ...nextList[index],
        [field]: value
      };
      return {
        ...prev,
        [type]: nextList
      };
    });
  };

  const removeContact = (type: ContactType, index: number) => {
    setContacts((prev) => {
      const nextList = [...prev[type]];
      nextList.splice(index, 1);
      return {
        ...prev,
        [type]: nextList
      };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const profileData = {
      ...formData,
      completedProjects: Number(formData.completedProjects) || 0,
      inProgress: Number(formData.inProgress) || 0,
      responseTimeHours: Number(formData.responseTimeHours) || 0
    };

    const contactsData = contactSections.flatMap(({ key }) =>
      contacts[key]
        .filter((contact) => contact.platform?.trim())
        .map((contact) => ({
          type: key,
          platform: contact.platform,
          username: contact.username || null,
          url: contact.url || null,
          phone: contact.phone || null,
          email: contact.email || null
        }))
    );

    ProfileService.updateProfile(profileData, contactsData, profileSkills)
      .then(() => {
        setMessage("Профиль успешно обновлен");
        setTimeout(() => {
          navigate("/profile");
        }, 800);
      })
      .catch((err: unknown) => {
        const apiError = err as { response?: { data?: { message?: string } } };
        setError(
          apiError.response?.data?.message ||
            "Ошибка сохранения профиля. Попробуйте позже."
        );
      })
      .finally(() => setSaving(false));
  };

  if (loading) {
    return (
      <div className="login_container">
        <div className="login_form">
          <p>Загрузка формы...</p>
        </div>
      </div>
    );
  }

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-5xl mx-auto text-white">
        <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div>
            <p className="text-sm uppercase tracking-[3px] text-primary">
              Редактор
            </p>
            <h1 className="text-3xl font-semibold mt-2">Профиль пользователя</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
          >
            Вернуться к профилю
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8 rounded-xl border border-white/10 bg-surface p-6 backdrop-blur-xl md:p-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex flex-col gap-2 text-sm">
              Имя
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleFieldChange("name", e.target.value)}
                className="ui-input"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Фамилия
              <input
                type="text"
                value={formData.lastname}
                onChange={(e) => handleFieldChange("lastname", e.target.value)}
                className="ui-input"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Страна
              <input
                type="text"
                value={formData.country}
                onChange={(e) => handleFieldChange("country", e.target.value)}
                className="ui-input"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Город
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleFieldChange("city", e.target.value)}
                className="ui-input"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Телефон
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleFieldChange("phone", e.target.value)}
                className="ui-input"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Email
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                className="ui-input"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Website / Портфолио
              <input
                type="url"
                value={formData.website}
                onChange={(e) => handleFieldChange("website", e.target.value)}
                className="ui-input"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Доступность (например, "Свободен")
              <input
                type="text"
                value={formData.availability}
                onChange={(e) => handleFieldChange("availability", e.target.value)}
                className="ui-input"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex flex-col gap-2 text-sm">
              Завершено проектов
              <input
                type="number"
                min="0"
                value={formData.completedProjects}
                onChange={(e) =>
                  handleFieldChange("completedProjects", e.target.value)
                }
                className="ui-input"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Проектов в работе
              <input
                type="number"
                min="0"
                value={formData.inProgress}
                onChange={(e) => handleFieldChange("inProgress", e.target.value)}
                className="ui-input"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              Время ответа (часы)
              <input
                type="number"
                min="0"
                value={formData.responseTimeHours}
                onChange={(e) =>
                  handleFieldChange("responseTimeHours", e.target.value)
                }
                className="ui-input"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <label className="flex flex-col gap-2 text-sm">
              Образование
              <textarea
                value={formData.education}
                onChange={(e) => handleFieldChange("education", e.target.value)}
                rows={4}
                className="ui-textarea"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              О себе
              <textarea
                value={formData.about}
                onChange={(e) => handleFieldChange("about", e.target.value)}
                rows={4}
                className="ui-textarea"
              />
            </label>
          </div>

          <div>
            <h2 className="text-2xl font-semibold mb-3">Навыки</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                placeholder="Например, React"
                className="ui-input flex-1"
              />
              <button
                type="button"
                onClick={addSkill}
                className="ui-btn border-primary/40 text-primary hover:border-white/20 hover:text-white"
              >
                Добавить
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {profileSkills.length === 0 && (
                <p className="text-white-soft text-sm">
                  Навыки пока не указаны. Добавьте первый!
                </p>
              )}
              {profileSkills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-2 border border-white/30 rounded-full px-4 py-1 text-sm"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => removeSkill(skill)}
                    className="text-white/50 transition-colors hover:text-danger"
                    aria-label={`Удалить ${skill}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Контакты</h2>
            {contactSections.map(({ key, title }) => (
              <div
                key={key}
                className="space-y-4 rounded-xl border border-white/10 p-4"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-white uppercase tracking-[3px] text-sm">
                    {title}
                  </p>
                  <button
                    type="button"
                    onClick={() => addContact(key)}
                    className="rounded-xl border border-primary/40 px-3 py-1 text-sm text-primary transition-colors hover:bg-white/10 hover:text-white"
                  >
                    + Добавить
                  </button>
                </div>

                {contacts[key].length === 0 && (
                  <p className="text-white-soft text-sm">
                    Пока нет контактов в этой категории.
                  </p>
                )}

                {contacts[key].map((contact, index) => (
                  <div
                    key={`${key}-${index}`}
                    className="space-y-3 rounded-xl border border-white/10 p-4"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-white-soft">
                        Платформа
                        <input
                          type="text"
                          value={contact.platform}
                          onChange={(e) =>
                            updateContact(key, index, "platform", e.target.value)
                          }
                          className="ui-input text-sm"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-white-soft">
                        Имя пользователя
                        <input
                          type="text"
                          value={contact.username}
                          onChange={(e) =>
                            updateContact(key, index, "username", e.target.value)
                          }
                          className="ui-input text-sm"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-white-soft">
                        Ссылка
                        <input
                          type="url"
                          value={contact.url}
                          onChange={(e) =>
                            updateContact(key, index, "url", e.target.value)
                          }
                          className="ui-input text-sm"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-white-soft">
                        Телефон
                        <input
                          type="text"
                          value={contact.phone}
                          onChange={(e) =>
                            updateContact(key, index, "phone", e.target.value)
                          }
                          className="ui-input text-sm"
                        />
                      </label>
                      <label className="flex flex-col gap-1 text-xs uppercase tracking-wide text-white-soft">
                        Email
                        <input
                          type="email"
                          value={contact.email}
                          onChange={(e) =>
                            updateContact(key, index, "email", e.target.value)
                          }
                          className="ui-input text-sm"
                        />
                      </label>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeContact(key, index)}
                        className="rounded-xl border border-error/60 px-3 py-1 text-sm text-error transition-colors hover:bg-error/15 hover:text-white"
                      >
                        Удалить контакт
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {(message || error) && (
            <p className={`message-box ${message ? "success" : "error"}`}>
              {message || error}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="ui-btn-primary w-full cursor-pointer py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Сохраняем..." : "Сохранить изменения"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ProfileEditor;

