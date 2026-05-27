import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ResumeService from "../../../services/resume.service";
import AuthService from "../../../services/auth.service";
import { appDialog } from "../../../components/ui/app-dialog";

interface Resume {
  id: number;
  title: string;
  description: string;
  experience?: string;
  education?: string;
  skills?: string;
  portfolio?: string;
  isActive: boolean;
  isApproved: boolean;
  executerId: number;
  executer?: {
    id: number;
    username: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

const ResumeView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentUser = AuthService.getCurrentUser() as { id?: number } | null;
  const isOwnResume = currentUser && resume && currentUser.id === resume.executerId;

  useEffect(() => {
    if (!id) return;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return;

    let cancelled = false;
    setResume(null);
    setError("");
    setLoading(true);

    (async () => {
      try {
        const res = await ResumeService.getResumeById(numericId);
        if (!cancelled) setResume(res.data);
      } catch (err: unknown) {
        const ax = err as { response?: { status?: number } };
        if (!cancelled && ax.response?.status !== 401 && ax.response?.status !== 403) {
          setError("Не удалось загрузить резюме");
        }
        if (!cancelled) console.error(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleDelete = async () => {
    if (!(await appDialog.confirm("Вы уверены, что хотите удалить это резюме?", { danger: true }))) {
      return;
    }

    try {
      await ResumeService.deleteResume(Number(id));
      navigate("/profile");
    } catch (err: any) {
      void appDialog.alert("Ошибка удаления резюме: " + (err.response?.data?.message || err.message), "error");
    }
  };

  const calculateCompleteness = (resume: Resume) => {
    const fields = ["title", "description", "experience", "education", "skills", "portfolio"];
    const filledFields = fields.filter((field) => {
      const value = resume[field as keyof Resume];
      return value && typeof value === "string" && value.length > 0;
    });
    return Math.round((filledFields.length / fields.length) * 100);
  };

  if (loading) {
    return (
      <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="panel-surface p-6 md:p-8 backdrop-blur-xl">
            <p className="text-white-soft">Загрузка резюме...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error || !resume) {
    return (
      <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="panel-surface p-6 md:p-8 backdrop-blur-xl">
            <p className="text-error">{error || "Резюме не найдено"}</p>
            <Link
              to="/profile"
              className="catalog-button mt-4 inline-block"
            >
              Вернуться к профилю
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const completeness = calculateCompleteness(resume);
  const skillsArray = resume.skills ? resume.skills.split(",").filter(Boolean) : [];

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-5xl mx-auto text-white space-y-6">
        
        <div className="flex items-center justify-between">
            <Link
              to={resume.executer ? `/profile/${resume.executer.id}` : "/profile"}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm"
            >
              ← Назад к профилю
            </Link>
            
            {isOwnResume && (
              <div className="flex gap-3">
                <Link
                  to={`/resumes/${resume.id}/edit`}
                  className="ui-btn-primary px-4 py-2 text-sm"
                >
                  Редактировать
                </Link>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-error/10 hover:bg-error/20 text-error border border-error/20 rounded-xl transition-colors text-sm"
                >
                  Удалить
                </button>
              </div>
            )}
        </div>

        <div className="panel-surface p-6 md:p-8 backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{resume.title}</h1>
                    {resume.executer && (
                        <p className="text-white-soft text-lg">
                        Автор:{" "}
                        <Link
                            to={`/profile/${resume.executer.id}`}
                            className="text-primary hover:text-white transition-colors"
                        >
                            @{resume.executer.username}
                        </Link>
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {!resume.isApproved ? (
                         <div className="px-4 py-1.5 rounded-full text-sm font-medium border border-primary/30 bg-white/5 text-primary">
                            На модерации
                        </div>
                    ) : (
                        <div className={`px-4 py-1.5 rounded-full text-sm font-medium border ${
                            resume.isActive 
                            ? "bg-success/10 border-success/20 text-success" 
                            : "bg-white-muted/50 border-white/10 text-white-soft"
                        }`}>
                            {resume.isActive ? "Активно" : "Скрыто"}
                        </div>
                    )}
                </div>
            </div>

            {isOwnResume && (
                <div className="mt-8 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex justify-between items-center mb-2 text-sm">
                        <span className="text-white">Заполненность резюме</span>
                        <span className="text-primary font-bold">{completeness}%</span>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className="h-full rounded-full bg-primary/45 transition-all duration-1000 ease-out"
                            style={{ width: `${completeness}%` }}
                        ></div>
                    </div>
                </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                
                <div className="panel-surface p-6 backdrop-blur-xl">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 rounded-full bg-primary/50"></span>
                        О себе
                    </h2>
                    <p className="text-white leading-relaxed whitespace-pre-wrap">
                        {resume.description}
                    </p>
                </div>

                {resume.experience && (
                    <div className="panel-surface p-6 backdrop-blur-xl">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 rounded-full bg-primary/50"></span>
                            Опыт работы
                        </h2>
                        <p className="text-white leading-relaxed whitespace-pre-wrap">
                            {resume.experience}
                        </p>
                    </div>
                )}

                {resume.education && (
                    <div className="panel-surface p-6 backdrop-blur-xl">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 rounded-full bg-primary/50"></span>
                            Образование
                        </h2>
                        <p className="text-white leading-relaxed whitespace-pre-wrap">
                            {resume.education}
                        </p>
                    </div>
                )}
            </div>

            <div className="space-y-6">
                
                <div className="panel-surface p-6 backdrop-blur-xl h-fit">
                    <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <span className="w-1 h-6 rounded-full bg-primary/50"></span>
                        Навыки
                    </h2>
                    {skillsArray.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {skillsArray.map((skill, idx) => (
                                <span 
                                    key={idx} 
                                    className="px-3 py-1 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl text-sm transition-colors cursor-default"
                                >
                                    {skill.trim()}
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-white-soft text-sm italic">Навыки не указаны</p>
                    )}
                </div>

                {resume.portfolio && (
                    <div className="panel-surface p-6 backdrop-blur-xl">
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <span className="w-1 h-6 rounded-full bg-primary/50"></span>
                            Портфолио
                        </h2>
                        <a
                            href={resume.portfolio}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/30 bg-white/5 text-primary transition-transform group-hover:scale-110">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">Ссылка на портфолио</p>
                                <p className="text-xs text-white-soft truncate">{resume.portfolio}</p>
                            </div>
                            <svg className="w-5 h-5 text-white-soft group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </a>
                    </div>
                )}

                <div className="px-6 py-4 rounded-xl border border-white/5 border-t border-t-white/10 bg-white/5 text-sm text-white-soft space-y-1">
                    <p>Создано: {new Date(resume.createdAt).toLocaleDateString("ru-RU")}</p>
                    {resume.updatedAt !== resume.createdAt && (
                        <p>Обновлено: {new Date(resume.updatedAt).toLocaleDateString("ru-RU")}</p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default ResumeView;
