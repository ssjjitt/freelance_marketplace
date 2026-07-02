import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminService from "../../../services/admin.service";
import { displayUserInfo } from "../../../utils/display-utils";

interface Resume {
  id: number;
  title: string;
  status: string;
  userId: number;
  user?: { id: number; username: string };
  createdAt: string;
}

const ResumeModeration: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const res = await AdminService.getPendingResumes();
      setResumes(res.data);
    } catch (error) {
      console.error("Ошибка загрузки резюме:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (resumeId: number) => {
    try {
      setActionLoading(true);
      await AdminService.approveResume(resumeId);
      await loadResumes();
    } catch (error) {
      console.error("Ошибка одобрения резюме:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (resumeId: number) => {
    try {
      setActionLoading(true);
      await AdminService.rejectResume(resumeId);
      await loadResumes();
    } catch (error) {
      console.error("Ошибка отклонения резюме:", error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      pending: "bg-yellow-500/20 text-yellow-300",
      approved: "bg-green-500/20 text-green-300",
      rejected: "bg-red-500/20 text-red-300",
    };
    return styles[status] || "bg-gray-500/20 text-gray-300";
  };

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto text-white">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Модерация резюме</h1>
          <Link
            to="/manager"
            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded hover:border-white/20 transition"
          >
            ← На панель
          </Link>
        </div>

        {loading ? (
          <div className="panel-surface p-6 backdrop-blur-xl">
            <p className="text-white-soft">Загрузка резюме...</p>
          </div>
        ) : resumes.length === 0 ? (
          <div className="panel-surface p-6 backdrop-blur-xl">
            <p className="text-white-soft">Нет резюме на утверждение</p>
          </div>
        ) : (
          <div className="panel-surface backdrop-blur-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-white-soft text-sm">ID</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Название</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Автор</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Статус</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Дата</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Действия</th>
                </tr>
              </thead>
              <tbody>
                {resumes.map((resume) => (
                  <tr key={resume.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-4 text-sm text-white">{resume.id}</td>
                    <td className="px-6 py-4 text-sm text-white">{resume.title}</td>
                    <td className="px-6 py-4 text-sm text-white-soft">
                      {displayUserInfo(resume.user?.username, resume.userId)}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(resume.status)}`}>
                        {resume.status === "pending"
                          ? "На утверждение"
                          : resume.status === "approved"
                          ? "Одобрено"
                          : "Отклонено"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white-soft">
                      {new Date(resume.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      <Link
                        to={`/resumes/${resume.id}`}
                        className="text-primary hover:underline"
                      >
                        Просмотр
                      </Link>
                      <button
                        onClick={() => handleApprove(resume.id)}
                        disabled={actionLoading}
                        className="px-3 py-1 bg-green-500/20 text-green-300 rounded hover:bg-green-500/30 transition disabled:opacity-50 text-xs"
                      >
                        Одобрить
                      </button>
                      <button
                        onClick={() => handleReject(resume.id)}
                        disabled={actionLoading}
                        className="px-3 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/30 transition disabled:opacity-50 text-xs"
                      >
                        Отклонить
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default ResumeModeration;
