import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import AdminService from "../../../services/admin.service";
import ManagerService from "../../../services/manager.service";
import { displayUserInfo } from "../../../utils/display-utils";

interface Service {
  id: number;
  title: string;
  status: string;
  price?: number | string | null;
  executerId: number;
  executer?: { id: number; username: string; email?: string };
  category?: { id: number; name: string };
  isApproved?: boolean;
  isActive?: boolean;
  createdAt: string;
}

function getServiceStatusText(service: Service): string {
  if (service.status === "cancelled") return "Закрыта";
  if (service.isApproved === false && service.isActive === false) return "Скрыта";
  if (service.isApproved === false) return "На модерации";
  if (service.isActive === false) return "Неактивна";
  if (service.status === "completed") return "Завершена";
  if (service.status === "inactive") return "Неактивна";
  return "Активна";
}

function statusStyle(statusText: string): string {
  if (statusText === "Завершена") return "bg-green-500/20 text-green-300";
  if (statusText === "Отменена" || statusText === "Скрыта") return "bg-red-500/20 text-red-300";
  if (statusText === "Закрыта") return "bg-gray-500/20 text-gray-300";
  if (statusText === "На модерации") return "bg-yellow-500/20 text-yellow-300";
  if (statusText === "Неактивна") return "bg-gray-500/20 text-gray-300";
  if (statusText === "Активна") return "bg-cyan-500/20 text-cyan-300";
  return "bg-gray-500/20 text-gray-300";
}

const ServiceModeration: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ManagerService.getServices();
      setServices(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Ошибка загрузки услуг";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (serviceId: number) => {
    try {
      setActionLoadingId(serviceId);
      setError("");
      await AdminService.deleteService(serviceId);
      await loadServices();
    } catch {
      setError("Ошибка удаления услуги");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleHide = async (serviceId: number) => {
    try {
      setActionLoadingId(serviceId);
      setError("");
      await ManagerService.hideService(serviceId);
      await loadServices();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Ошибка скрытия услуги";
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnhide = async (serviceId: number) => {
    try {
      setActionLoadingId(serviceId);
      setError("");
      await ManagerService.unhideService(serviceId);
      await loadServices();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Ошибка восстановления услуги";
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApprove = async (serviceId: number) => {
    try {
      setActionLoadingId(serviceId);
      setError("");
      await AdminService.approveService(serviceId);
      await loadServices();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Ошибка одобрения услуги";
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredServices = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return services;
    return services.filter((s) => {
      const statusText = getServiceStatusText(s);
      const values = [
        String(s.id),
        s.title,
        s.executer?.username || "",
        s.status,
        s.category?.name || "",
        statusText,
      ];
      return values.some((value) => value.toLowerCase().includes(term));
    });
  }, [services, searchTerm]);

  /** Услуги, ожидающие одобрения менеджера (как очередь модерации заказов). */
  const servicesAwaitingModeration = useMemo(
    () =>
      services.filter(
        (s) =>
          s.isApproved !== true &&
          s.isActive !== false &&
          s.status !== "cancelled"
      ),
    [services]
  );

  const searchActive = searchTerm.trim().length > 0;

  const formatPrice = (s: Service) => {
    if (s.price == null || s.price === "") return "—";
    const n = Number(s.price);
    if (!Number.isFinite(n)) return String(s.price);
    return `${n.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} BYN`;
  };

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto text-white">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Модерация услуг</h1>
          <Link
            to="/manager"
            className="ui-btn-outline px-4 py-2 text-sm whitespace-nowrap"
          >
            ← Назад
          </Link>
        </div>

        <div className="panel-surface backdrop-blur-xl p-5 mb-6">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Поиск по ID, названию, исполнителю, категории, статусу..."
            className="ui-input w-full"
          />
        </div>

        {error && (
          <p className="mb-6 p-3 bg-red-500/20 text-red-300 rounded border border-red-400/30">
            {error}
          </p>
        )}

        {loading ? (
          <div className="panel-surface backdrop-blur-xl p-6">
            <p className="text-white-soft">Загрузка услуг...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="panel-surface backdrop-blur-xl p-6">
            <p className="text-white-soft">
              {searchActive ? "Услуги не найдены" : "Нет услуг"}
            </p>
          </div>
        ) : (
          <>
            {!searchActive &&
              services.length > 0 &&
              servicesAwaitingModeration.length === 0 && (
                <div className="panel-surface backdrop-blur-xl p-8 mb-6 text-center">
                  <p className="text-white-soft">Нет услуг на модерацию</p>
                </div>
              )}
            <div className="panel-surface backdrop-blur-xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="px-4 py-3 text-left text-white-soft text-sm">ID</th>
                    <th className="px-4 py-3 text-left text-white-soft text-sm">Услуга</th>
                    <th className="px-4 py-3 text-left text-white-soft text-sm">Категория</th>
                    <th className="px-4 py-3 text-left text-white-soft text-sm">Исполнитель</th>
                    <th className="px-4 py-3 text-left text-white-soft text-sm">Цена</th>
                    <th className="px-4 py-3 text-left text-white-soft text-sm">Статус</th>
                    <th className="px-4 py-3 text-left text-white-soft text-sm">Дата</th>
                    <th className="px-4 py-3 text-left text-white-soft text-sm">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredServices.map((service) => {
                    const actionLoading = actionLoadingId === service.id;
                    const statusText = getServiceStatusText(service);
                    const isCancelled = service.status === "cancelled";
                    const showRestore = service.isActive === false || isCancelled;
                    const canHide = service.isActive !== false && !isCancelled;
                    const showApprove =
                      service.isApproved !== true &&
                      service.isActive !== false &&
                      !isCancelled;

                    return (
                      <tr key={service.id} className="border-b border-white/5 align-top">
                        <td className="px-4 py-3 text-sm">{service.id}</td>
                        <td className="px-4 py-3 text-sm">
                          <p className="font-medium">{service.title}</p>
                        </td>
                        <td className="px-4 py-3 text-sm text-white-soft">
                          <div className="flex flex-wrap items-center gap-2">
                            <span>{service.category?.name ?? "—"}</span>
                            {service.isApproved === true && (
                              <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                                <CircleCheck
                                  className="h-3 w-3 shrink-0 opacity-90"
                                  strokeWidth={2}
                                />
                                Одобрено менеджером
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-white-soft">
                          {displayUserInfo(service.executer?.username, service.executerId)}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">{formatPrice(service)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`px-2 py-1 rounded text-xs ${statusStyle(statusText)}`}
                          >
                            {statusText}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-white-soft">
                          {new Date(service.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-col gap-2 min-w-[11rem]">
                            <Link
                              to={`/services/${service.id}`}
                              className="ui-btn-outline inline-flex items-center justify-center px-3 py-1.5 text-xs"
                            >
                              Просмотр
                            </Link>

                            {showApprove && (
                              <button
                                type="button"
                                onClick={() => handleApprove(service.id)}
                                disabled={actionLoading}
                                className="ui-btn-primary inline-flex items-center justify-center px-3 py-1.5 text-xs disabled:opacity-50"
                              >
                                {actionLoading ? "…" : "Одобрить"}
                              </button>
                            )}

                            {showRestore && (
                              <button
                                type="button"
                                onClick={() => handleUnhide(service.id)}
                                disabled={actionLoading}
                                className="ui-btn-primary inline-flex items-center justify-center px-3 py-1.5 text-xs disabled:opacity-50"
                              >
                                {actionLoading ? "…" : "Показать в каталоге"}
                              </button>
                            )}

                            {canHide && (
                              <button
                                type="button"
                                onClick={() => handleHide(service.id)}
                                disabled={actionLoading}
                                className="ui-btn-outline-danger inline-flex items-center justify-center px-3 py-1.5 text-xs disabled:opacity-50"
                              >
                                Скрыть
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDelete(service.id)}
                              disabled={actionLoadingId !== null}
                              className="ui-btn-outline-danger inline-flex items-center justify-center px-3 py-1.5 text-xs disabled:opacity-50"
                            >
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default ServiceModeration;
