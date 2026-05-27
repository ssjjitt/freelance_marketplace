import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminService from "../../../services/admin.service";

interface ModerationStats {
  resumes: {
    pending: number;
    approved: number;
  };
  services: {
    pending: number;
    approved: number;
  };
}

const ModerationDashboard: React.FC = () => {
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const res = await AdminService.getModerationStats();
      setStats(res.data);
    } catch (error) {
      console.error("Ошибка загрузки статистики:", error);
    } finally {
      setLoading(false);
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

  if (!stats) {
    return (
      <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="panel-surface p-6 backdrop-blur-xl">
            <p className="text-white-soft">Не удалось загрузить статистику</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto text-white">
        <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-semibold">Панель модерации</h1>
            <Link to="/admin" className="px-4 py-2 border border-white/20 rounded-xl hover:bg-white/10 transition-colors">
                Назад в панель
            </Link>
        </div>

        {/* Статистика по резюме */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Резюме</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="panel-surface p-6 backdrop-blur-xl border-l-4 border-l-warning">
              <p className="text-white-soft text-sm mb-2">В ожидании проверки</p>
              <p className="text-4xl font-bold text-warning">{stats.resumes.pending}</p>
            </div>
            <div className="panel-surface p-6 backdrop-blur-xl border-l-4 border-l-success">
              <p className="text-white-soft text-sm mb-2">Одобрено</p>
              <p className="text-4xl font-bold text-success">{stats.resumes.approved}</p>
            </div>
          </div>
          <Link 
            to="/admin/resumes" 
            className="mt-4 inline-block px-6 py-3 bg-primary hover:bg-primary/80 rounded-xl transition-colors font-semibold"
          >
            Перейти к модерации резюме →
          </Link>
        </div>

        {/* Статистика по сервисам */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Сервисы</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="panel-surface p-6 backdrop-blur-xl border-l-4 border-l-warning">
              <p className="text-white-soft text-sm mb-2">В ожидании проверки</p>
              <p className="text-4xl font-bold text-warning">{stats.services.pending}</p>
            </div>
            <div className="panel-surface p-6 backdrop-blur-xl border-l-4 border-l-success">
              <p className="text-white-soft text-sm mb-2">Одобрено</p>
              <p className="text-4xl font-bold text-success">{stats.services.approved}</p>
            </div>
          </div>
          <Link 
            to="/admin/services" 
            className="mt-4 inline-block px-6 py-3 bg-primary hover:bg-primary/80 rounded-xl transition-colors font-semibold"
          >
            Перейти к модерации сервисов →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ModerationDashboard;
