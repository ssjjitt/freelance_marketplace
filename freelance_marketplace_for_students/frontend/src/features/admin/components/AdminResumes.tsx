import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminService from "../../../services/admin.service";

interface Resume {
  id: number;
  title: string;
  executer: {
    id: number;
    username: string;
    email: string;
  };
  createdAt: string;
}

const AdminResumes: React.FC = () => {
  const [pendingResumes, setPendingResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await AdminService.getPendingResumes();
      setPendingResumes(res.data);
    } catch (error) {
      console.error("Ошибка загрузки данных:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveResume = async (id: number) => {
    try {
      await AdminService.approveResume(id);
      setPendingResumes(pendingResumes.filter(r => r.id !== id));
      setMessage("Резюме одобрено");
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Ошибка одобрения резюме");
    }
  };

  const handleRejectResume = async (id: number) => {
    try {
      await AdminService.rejectResume(id, rejectReason);
      setPendingResumes(pendingResumes.filter(r => r.id !== id));
      setMessage("Резюме отклонено");
      setShowRejectModal(null);
      setRejectReason("");
      setTimeout(() => setMessage(""), 3000);
    } catch (error: any) {
      setMessage(error.response?.data?.message || "Ошибка отклонения резюме");
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="panel-surface p-6 backdrop-blur-xl">
            <p className="text-white-soft">Загрузка...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto text-white">
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold">Модерация резюме</h1>
            <Link to="/admin" className="px-4 py-2 border border-white/20 rounded-xl hover:bg-white/10 transition-colors">
                Назад в панель
            </Link>
        </div>
        
        {message && (
            <div className={`mb-6 p-4 rounded-xl border ${
                message.includes("одобрено") ? "bg-success/10 border-success/20 text-success" : "bg-error/10 border-error/20 text-error"
            }`}>
              {message}
            </div>
        )}

        <div className="panel-surface p-6 backdrop-blur-xl">
            {pendingResumes.length === 0 ? (
              <p className="text-white-soft">Нет резюме, ожидающих проверки.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingResumes.map((resume) => (
                  <div key={resume.id} className="border border-white/10 rounded-xl p-4 flex flex-col justify-between bg-white/5">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg line-clamp-1" title={resume.title}>{resume.title}</h3>
                        <span className="text-xs text-white-soft whitespace-nowrap ml-2">{new Date(resume.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-sm text-white mb-2">Исполнитель: <Link to={`/profile/${resume.executer.id}`} className="text-primary hover:underline">{resume.executer.username}</Link></p>
                    </div>
                    <div className="flex gap-2 mt-4 flex-col sm:flex-row">
                      <Link 
                        to={`/resumes/${resume.id}`} 
                        className="px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors text-sm text-center"
                        target="_blank"
                      >
                        Просмотреть
                      </Link>
                      <button
                        onClick={() => handleApproveResume(resume.id)}
                        className="px-4 py-2 bg-success/20 border border-success text-success rounded-xl hover:bg-success/30 transition-colors text-sm"
                      >
                        ✓ Одобрить
                      </button>
                      <button
                        onClick={() => setShowRejectModal(resume.id)}
                        className="px-4 py-2 bg-error/20 border border-error text-error rounded-xl hover:bg-error/30 transition-colors text-sm"
                      >
                        ✕ Отклонить
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </div>
      </div>

      {/* Модальное окно для отклонения */}
      {showRejectModal && (
        <div
          className="modal-backdrop"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowRejectModal(null);
              setRejectReason("");
            }
          }}
        >
          <div className="modal-panel w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-semibold text-white mb-4">Отклонить резюме</h2>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Укажите причину отклонения (необязательно)"
              className="ui-textarea mb-4 min-h-[100px]"
              rows={4}
            />
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectReason("");
                }}
                className="ui-btn-outline flex-1 py-2.5"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => handleRejectResume(showRejectModal)}
                className="ui-btn-outline-danger flex-1 py-2.5"
              >
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default AdminResumes;

