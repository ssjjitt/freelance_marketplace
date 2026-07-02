import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ResumeService from "../../../services/resume.service";
import AuthService from "../../../services/auth.service";
import { appDialog } from "../../../components/ui/app-dialog";

const isExecuter = (): boolean => {
  const currentUser = AuthService.getCurrentUser() as { roles?: string[] } | null;
  const userRoles = currentUser?.roles || [];
  return userRoles.some((r: string) => r.toUpperCase().includes("EXECUTER") || r === "executer");
};

interface Resume {
  id: number;
  title: string;
  description: string;
  experience?: string;
  education?: string;
  skills?: string;
  portfolio?: string;
  isActive: boolean;
  isApproved: boolean; // Added field
  executerId: number;
  createdAt: string;
  updatedAt: string;
}

interface ResumesListProps {
  executerId: number;
  isOwnProfile?: boolean;
}

const ResumesList: React.FC<ResumesListProps> = ({ executerId, isOwnProfile = false }) => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadResumes();
  }, [executerId]);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const res = await ResumeService.getResumes({ executerId });
      setResumes(res.data);
      setError("");
    } catch (err: any) {
      setError("Не удалось загрузить резюме");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!(await appDialog.confirm("Вы уверены, что хотите удалить это резюме?", { danger: true }))) {
      return;
    }

    try {
      await ResumeService.deleteResume(id);
      loadResumes();
    } catch (err: any) {
      void appDialog.alert("Ошибка удаления резюме: " + (err.response?.data?.message || err.message), "error");
    }
  };

  const handleToggleActive = async (resume: Resume) => {
    try {
      await ResumeService.updateResume(resume.id, { isActive: !resume.isActive });
      loadResumes();
    } catch (err: any) {
      void appDialog.alert("Ошибка обновления резюме: " + (err.response?.data?.message || err.message), "error");
    }
  };

  if (loading) {
    return (
      <div className="panel-surface p-6 md:p-8 backdrop-blur-xl">
        <p className="text-white-soft">Загрузка резюме...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="panel-surface p-6 md:p-8 backdrop-blur-xl">
        <p className="text-error">{error}</p>
      </div>
    );
  }

  const canCreateResume = isOwnProfile && isExecuter();

  if (resumes.length === 0) {
    return (
      <div className="panel-surface p-6 md:p-8 backdrop-blur-xl">
        <h2 className="text-2xl font-semibold mb-4">Резюме</h2>
        <p className="text-white-soft mb-6">Резюме пока нет.</p>
        {canCreateResume && (
          <div className="flex justify-end">
            <Link
              to="/resumes/new"
              className="ui-btn-primary px-6 py-2.5 font-medium"
            >
              Создать резюме
            </Link>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="panel-surface p-6 md:p-8 backdrop-blur-xl space-y-6">
      <h2 className="text-2xl font-semibold">Резюме</h2>

      <div className="space-y-4">
        {resumes.map((resume) => (
          <div
            key={resume.id}
            className={`border rounded-xl p-5 space-y-3 ${
              !resume.isApproved 
                ? "border-primary/30 bg-white/5"
                : resume.isActive
                ? "border-white/20 bg-white/5"
                : "border-white/10 bg-white/2 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-semibold">{resume.title}</h3>
                  {!resume.isApproved ? (
                    <span className="rounded border border-primary/30 bg-white/5 px-2 py-1 text-xs text-primary">
                      На модерации
                    </span>
                  ) : resume.isActive ? (
                    <span className="px-2 py-1 bg-success/20 text-success rounded text-xs">
                      Активно
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-white-muted text-white-soft rounded text-xs">
                      Неактивно
                    </span>
                  )}
                </div>
                <p className="text-white line-clamp-2">{resume.description}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                to={`/resumes/${resume.id}`}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors"
              >
                Просмотреть
              </Link>
              {isOwnProfile && (
                <>
                  <Link
                    to={`/resumes/${resume.id}/edit`}
                    className="px-4 py-2 bg-success/20 hover:bg-success/30 text-success rounded-xl text-sm transition-colors"
                  >
                    Редактировать
                  </Link>
                  <button
                    onClick={() => handleToggleActive(resume)}
                    className={`px-4 py-2 rounded-xl text-sm transition-colors ${
                      resume.isActive
                        ? "border border-primary/35 bg-white/5 text-primary hover:bg-white/10"
                        : "bg-success/20 hover:bg-success/30 text-success"
                    }`}
                  >
                    {resume.isActive ? "Деактивировать" : "Активировать"}
                  </button>
                  <button
                    onClick={() => handleDelete(resume.id)}
                    className="px-4 py-2 bg-error/20 hover:bg-error/30 text-error rounded-xl text-sm transition-colors"
                  >
                    Удалить
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {canCreateResume && (
        <div className="flex justify-end pt-4">
          <Link
            to="/resumes/new"
            className="ui-btn-primary px-6 py-2.5 font-medium"
          >
            Создать резюме
          </Link>
        </div>
      )}
    </div>
  );
};

export default ResumesList;

