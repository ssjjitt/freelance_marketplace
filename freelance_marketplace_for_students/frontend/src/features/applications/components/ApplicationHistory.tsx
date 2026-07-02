import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ApplicationService from "../../../services/application.service";
import { appDialog } from "../../../components/ui/app-dialog";

interface Application {
  id: number;
  orderId?: number;
  serviceId?: number;
  order?: {
    id: number;
    title: string;
    budget?: number;
    status: string;
  };
  service?: {
    id: number;
    title: string;
    price?: number;
    status: string;
  };
  message?: string;
  proposedPrice?: number;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const ApplicationHistory: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [filterType, setFilterType] = useState<"all" | "order" | "service">("all");
  const [disputeApplicationId, setDisputeApplicationId] = useState<number | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await ApplicationService.getMyApplications();
      setApplications(Array.isArray(res.data) ? res.data : []);
    } catch (err: any) {
      console.error("Ошибка загрузки откликов:", err);
      setError(err.response?.data?.message || "Ошибка загрузки откликов");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelApplication = async (app: Application) => {
    if (
      !(await appDialog.confirm(
        `Вы уверены, что хотите отменить отклик на ${app.orderId ? "заказ" : "услугу"}?`
      ))
    )
      return;

    try {
      await ApplicationService.cancelApplication(app.id);
      setApplications(applications.filter(a => a.id !== app.id));
    } catch (err: any) {
      void appDialog.alert(err.response?.data?.message || "Ошибка отмены отклика", "error");
    }
  };

  const handleOpenDispute = async (applicationId: number) => {
    if (!disputeReason.trim()) {
      void appDialog.alert("Укажите причину спора", "error");
      return;
    }
    try {
      setDisputeSubmitting(true);
      await ApplicationService.openDisputeForApplication(applicationId, {
        reason: disputeReason.trim(),
        description: disputeDescription.trim() || undefined,
      });
      void appDialog.alert("Спор отправлен менеджеру", "success");
      setDisputeApplicationId(null);
      setDisputeReason("");
      setDisputeDescription("");
    } catch (err: any) {
      void appDialog.alert(err.response?.data?.message || "Не удалось открыть спор", "error");
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const filteredApps = applications.filter(app => {
    const statusMatch = filterStatus === "all" || app.status === filterStatus;
    let typeMatch = true;
    if (filterType === "order") typeMatch = !!app.orderId;
    if (filterType === "service") typeMatch = !!app.serviceId;
    return statusMatch && typeMatch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-success/20 text-success border-success";
      case "rejected":
        return "bg-error/20 text-error border-error";
      default:
        return "bg-warning/20 text-warning border-warning";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "approved":
        return "✓ Одобрен";
      case "rejected":
        return "✕ Отклонен";
      default:
        return "⏳ На рассмотрении";
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
        <div className="max-w-5xl mx-auto">
          <div className="panel-surface p-6 backdrop-blur-xl">
            <p className="text-white-soft">Загрузка...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-5xl mx-auto text-white">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold mb-2">Мои отклики</h1>
          <p className="text-white-soft">Всего откликов: {applications.length}</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error">
            {error}
          </div>
        )}

        {/* Фильтры */}
        <div className="panel-surface p-6 backdrop-blur-xl mb-6">
          <h2 className="text-lg font-semibold mb-4">Фильтры</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-white-soft block mb-2">По статусу</label>
              <div className="space-y-2">
                {["all", "pending", "approved", "rejected"].map((status) => (
                  <label key={status} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value={status}
                      checked={filterStatus === status}
                      onChange={(e) => setFilterStatus(e.target.value as any)}
                      className="accent-primary"
                    />
                    <span className="text-sm">
                      {status === "all"
                        ? "Все"
                        : status === "pending"
                        ? "На рассмотрении"
                        : status === "approved"
                        ? "Одобренные"
                        : "Отклоненные"}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm text-white-soft block mb-2">По типу</label>
              <div className="space-y-2">
                {["all", "order", "service"].map((type) => (
                  <label key={type} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      checked={filterType === type}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="accent-primary"
                    />
                    <span className="text-sm">
                      {type === "all" ? "Все" : type === "order" ? "Заказы" : "Услуги"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Отклики */}
        {filteredApps.length === 0 ? (
          <div className="panel-surface p-8 backdrop-blur-xl text-center">
            <p className="text-white-soft text-lg">
              {applications.length === 0 ? "У вас еще нет откликов" : "По заданным фильтрам откликов не найдено"}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApps.map((app) => (
              <div key={app.id} className="panel-surface p-6 backdrop-blur-xl">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    {app.orderId ? (
                      <Link
                        to={`/orders/${app.order?.id}`}
                        className="text-xl font-semibold text-primary hover:underline"
                      >
                        {app.order?.title}
                      </Link>
                    ) : (
                      <Link
                        to={`/services/${app.service?.id}`}
                        className="text-xl font-semibold text-primary hover:underline"
                      >
                        {app.service?.title}
                      </Link>
                    )}
                    <p className="text-xs text-white-soft mt-1">
                      {app.orderId ? "Заказ" : "Услуга"} (ID: {app.orderId || app.serviceId})
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-3 py-1 rounded-xl border text-sm font-semibold ${getStatusColor(
                        app.status
                      )}`}
                    >
                      {getStatusLabel(app.status)}
                    </span>
                    <p className="text-xs text-white-soft mt-2">
                      {new Date(app.createdAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                </div>

                {app.message && (
                  <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
                    <p className="text-sm text-white-soft mb-1">Сообщение:</p>
                    <p className="text-white">{app.message}</p>
                  </div>
                )}

                {app.proposedPrice && (
                  <p className="mb-4 text-lg font-semibold text-primary">
                    Предложенная цена: {app.proposedPrice} BYN
                  </p>
                )}

                <div className="flex flex-wrap gap-3 items-center">
                  {app.orderId ? (
                    <Link
                      to={`/orders/${app.order?.id}`}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm"
                    >
                      Перейти к заказу
                    </Link>
                  ) : (
                    <Link
                      to={`/services/${app.service?.id}`}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm"
                    >
                      Перейти к услуге
                    </Link>
                  )}

                  {app.status === "pending" && (
                    <button
                      onClick={() => handleCancelApplication(app)}
                      className="px-4 py-2 bg-error/20 border border-error text-error rounded-xl hover:bg-error/30 transition-colors text-sm"
                    >
                      Отменить отклик
                    </button>
                  )}
                  {app.status === "rejected" &&
                    (disputeApplicationId === app.id ? (
                      <div className="w-full rounded-xl border border-warning/40 bg-warning/10 p-3">
                        <p className="mb-2 text-sm font-semibold text-warning">Открыть спор</p>
                        <input
                          type="text"
                          value={disputeReason}
                          onChange={(e) => setDisputeReason(e.target.value)}
                          placeholder="Причина спора"
                          className="mb-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white-soft"
                        />
                        <textarea
                          value={disputeDescription}
                          onChange={(e) => setDisputeDescription(e.target.value)}
                          placeholder="Комментарий (необязательно)"
                          rows={3}
                          className="mb-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white-soft"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleOpenDispute(app.id)}
                            disabled={disputeSubmitting}
                            className="px-4 py-2 bg-warning/20 border border-warning text-warning rounded-xl hover:bg-warning/30 transition-colors text-sm disabled:opacity-50"
                          >
                            {disputeSubmitting ? "Отправка..." : "Отправить спор"}
                          </button>
                          <button
                            onClick={() => {
                              setDisputeApplicationId(null);
                              setDisputeReason("");
                              setDisputeDescription("");
                            }}
                            disabled={disputeSubmitting}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors text-sm"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDisputeApplicationId(app.id)}
                        className="px-4 py-2 bg-warning/20 border border-warning text-warning rounded-xl hover:bg-warning/30 transition-colors text-sm"
                      >
                        Начать спор
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ApplicationHistory;
