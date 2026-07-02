import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ManagerService from "../../../services/manager.service";

interface ManagerStats {
  tickets: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
  };
  disputes: {
    total: number;
    open: number;
    inReview: number;
    resolved: number;
  };
  users: {
    total: number;
    blocked: number;
    active: number;
  };
  moderation: {
    resumesPending: number;
    servicesPending: number;
    ordersActive: number;
  };
}

const ManagerDashboard: React.FC = () => {
  const [stats, setStats] = useState<ManagerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ManagerService.getManagerStats();
      console.log("Manager stats loaded:", res.data);
      setStats(res.data);
    } catch (error: any) {
      console.error("Ошибка загрузки статистики:", error);
      setError(error.response?.data?.message || "Ошибка загрузки статистики");
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

  if (error) {
    return (
      <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="panel-surface p-6 backdrop-blur-xl bg-red-500/10">
            <p className="text-red-300 mb-4">{error}</p>
            <button
              onClick={loadStats}
              className="px-4 py-2 bg-primary rounded hover:bg-primary/80"
            >
              Повторить
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto text-white">
        <h1 className="text-4xl font-bold mb-8">Панель менеджера</h1>

        {/* Ключевые показатели */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link
            to="/manager/tickets"
            className="panel-surface p-6 backdrop-blur-xl hover:bg-white/10 transition-colors text-center"
          >
            <p className="text-white-soft text-sm mb-2">ТИКЕТЫ</p>
            <p className="text-3xl font-bold text-primary">{stats?.tickets.open || 0}</p>
            <p className="text-xs text-white-soft mt-2">открыто</p>
          </Link>

          <Link
            to="/manager/disputes"
            className="panel-surface p-6 backdrop-blur-xl hover:bg-white/10 transition-colors text-center"
          >
            <p className="text-white-soft text-sm mb-2">СПОРЫ</p>
            <p className="text-3xl font-bold text-warning">{stats?.disputes.open || 0}</p>
            <p className="text-xs text-white-soft mt-2">на разбор</p>
          </Link>

          <Link
            to="/manager/users"
            className="panel-surface p-6 backdrop-blur-xl hover:bg-white/10 transition-colors text-center"
          >
            <p className="text-white-soft text-sm mb-2">ПОЛЬЗОВАТЕЛИ</p>
            <p className="text-3xl font-bold text-success">{stats?.users.active || 0}</p>
            <p className="text-xs text-white-soft mt-2">активных</p>
          </Link>

          <Link
            to="/manager/orders"
            className="panel-surface p-6 backdrop-blur-xl hover:bg-white/10 transition-colors text-center"
          >
            <p className="text-white-soft text-sm mb-2">МОДЕРАЦИЯ</p>
            <p className="text-3xl font-bold text-info">{stats?.moderation.ordersActive || 0}</p>
            <p className="text-xs text-white-soft mt-2">активных заказов</p>
          </Link>
        </div>

        {/* Подробная статистика */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8 items-stretch">
          {/* Тикеты */}
          <div className="panel-surface flex h-full flex-col p-6 backdrop-blur-xl">
            <h2 className="text-2xl font-semibold mb-4">Тикеты поддержки</h2>
            <div className="min-h-0 flex-1 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-white-soft">Всего</span>
                <span className="font-bold text-lg">{stats?.tickets.total || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-white-soft">Открыто</span>
                <span className="font-bold text-warning">{stats?.tickets.open || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-white-soft">В работе</span>
                <span className="font-bold text-info">{stats?.tickets.inProgress || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white-soft">Решено</span>
                <span className="font-bold text-success">{stats?.tickets.resolved || 0}</span>
              </div>
            </div>
            <div className="mt-auto w-full pt-4">
              <Link
                to="/manager/tickets"
                className="block px-4 py-2 border border-white/15 rounded-xl text-center transition-colors text-sm text-white-soft hover:text-white hover:border-white/30"
              >
                Управлять тикетами
              </Link>
            </div>
          </div>

          {/* Споры */}
          <div className="panel-surface flex h-full flex-col p-6 backdrop-blur-xl">
            <h2 className="text-2xl font-semibold mb-4">Арбитраж и споры</h2>
            <div className="min-h-0 flex-1 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-white-soft">Всего</span>
                <span className="font-bold text-lg">{stats?.disputes.total || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-white-soft">Открыто</span>
                <span className="font-bold text-warning">{stats?.disputes.open || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-white-soft">На проверке</span>
                <span className="font-bold text-info">{stats?.disputes.inReview || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white-soft">Разрешено</span>
                <span className="font-bold text-success">{stats?.disputes.resolved || 0}</span>
              </div>
            </div>
            <div className="mt-auto w-full pt-4">
              <Link
                to="/manager/disputes"
                className="block px-4 py-2 border border-white/15 rounded-xl text-center transition-colors text-sm text-white-soft hover:text-white hover:border-white/30"
              >
                Управлять спорами
              </Link>
            </div>
          </div>

          {/* Пользователи */}
          <div className="panel-surface flex h-full flex-col p-6 backdrop-blur-xl">
            <h2 className="text-2xl font-semibold mb-4">Управление пользователями</h2>
            <div className="min-h-0 flex-1 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-white-soft">Всего</span>
                <span className="font-bold text-lg">{stats?.users.total || 0}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-white/10">
                <span className="text-white-soft">Активных</span>
                <span className="font-bold text-success">{stats?.users.active || 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white-soft">Заблокировано</span>
                <span className="font-bold text-error">{stats?.users.blocked || 0}</span>
              </div>
            </div>
            <div className="mt-auto w-full pt-4">
              <Link
                to="/manager/users"
                className="block px-4 py-2 border border-white/15 rounded-xl text-center transition-colors text-sm text-white-soft hover:text-white hover:border-white/30"
              >
                Управлять пользователями
              </Link>
            </div>
          </div>
        </div>

        {/* Модерация контента */}
        <div className="panel-surface p-6 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold mb-4">Модерация контента</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-white-soft text-xs mb-1">РЕЗЮМЕ НА ПРОВЕРКЕ</p>
              <p className="text-2xl font-semibold">{stats?.moderation.resumesPending || 0}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-white-soft text-xs mb-1">УСЛУГИ НА ПРОВЕРКЕ</p>
              <p className="text-2xl font-semibold">{stats?.moderation.servicesPending || 0}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-white-soft text-xs mb-1">АКТИВНЫЕ ЗАКАЗЫ</p>
              <p className="text-2xl font-semibold">{stats?.moderation.ordersActive || 0}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Link
              to="/manager/resumes"
              className="px-4 py-3 border border-white/15 rounded-xl transition-colors text-center text-sm text-white-soft hover:text-white hover:border-white/30"
            >
              Одобрение и отклонение резюме
            </Link>
            <Link
              to="/manager/services"
              className="px-4 py-3 border border-white/15 rounded-xl transition-colors text-center text-sm text-white-soft hover:text-white hover:border-white/30"
            >
              Модерация услуг
            </Link>
            <Link
              to="/manager/orders"
              className="px-4 py-3 border border-white/15 rounded-xl transition-colors text-center text-sm text-white-soft hover:text-white hover:border-white/30"
            >
              Модерация заказов
            </Link>
            <Link
              to="/manager/tickets"
              className="px-4 py-3 border border-white/15 rounded-xl transition-colors text-center text-sm text-white-soft hover:text-white hover:border-white/30"
            >
              Тикеты поддержки
            </Link>
            <Link
              to="/manager/disputes"
              className="px-4 py-3 border border-white/15 rounded-xl transition-colors text-center text-sm text-white-soft hover:text-white hover:border-white/30"
            >
              Управление спорами
            </Link>
            <Link
              to="/manager/users"
              className="px-4 py-3 border border-white/15 rounded-xl transition-colors text-center text-sm text-white-soft hover:text-white hover:border-white/30"
            >
              Управление пользователями
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ManagerDashboard;
