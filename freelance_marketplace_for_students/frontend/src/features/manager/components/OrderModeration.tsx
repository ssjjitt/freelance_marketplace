import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import ManagerService from "../../../services/manager.service";
import { displayUserInfo } from "../../../utils/display-utils";

interface Order {
  id: number;
  title: string;
  budget: number;
  status: string;
  isModerated: boolean;
  moderationReason?: string;
  customerId: number;
  customer?: { id: number; username: string };
  category?: { id: number; name: string };
  moderatorTrustBadge?: boolean;
  createdAt: string;
}

const OrderModeration: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [hideOrderId, setHideOrderId] = useState<number | null>(null);
  const [hideReason, setHideReason] = useState("");

  useEffect(() => {
    void loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await ManagerService.getOrders();
      setOrders(res.data);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Ошибка загрузки заказов";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleHideOrder = async (orderId: number) => {
    if (!hideReason.trim()) {
      setError("Введите причину скрытия заказа");
      return;
    }

    try {
      setActionLoadingId(orderId);
      setError("");
      await ManagerService.hideOrder(orderId, { reason: hideReason });
      setHideOrderId(null);
      setHideReason("");
      await loadOrders();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Ошибка скрытия заказа";
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnhideOrder = async (orderId: number) => {
    try {
      setActionLoadingId(orderId);
      setError("");
      await ManagerService.unhideOrder(orderId);
      await loadOrders();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Ошибка возврата заказа в каталог";
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReopenOrder = async (orderId: number) => {
    try {
      setActionLoadingId(orderId);
      setError("");
      await ManagerService.reopenOrder(orderId);
      await loadOrders();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Ошибка открытия заказа";
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleGrantTrustBadge = async (orderId: number) => {
    try {
      setActionLoadingId(orderId);
      setError("");
      await ManagerService.grantOrderTrustBadge(orderId);
      await loadOrders();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Ошибка одобрения заказа";
      setError(msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredOrders = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return orders;
    return orders.filter((order) => {
      const values = [
        String(order.id),
        order.title,
        order.customer?.username || "",
        order.status,
        order.category?.name || "",
      ];
      return values.some((value) => value.toLowerCase().includes(term));
    });
  }, [orders, searchTerm]);

  /** Заказы, которым ещё нужно одобрение для каталога. */
  const ordersAwaitingModeration = useMemo(
    () =>
      orders.filter((o) => {
        if (o.moderatorTrustBadge === true) return false;
        if (["hidden", "closed", "completed", "cancelled"].includes(o.status)) return false;
        return true;
      }),
    [orders]
  );

  const searchActive = searchTerm.trim().length > 0;

  const statusLabel = (status: string) => {
    const map: Record<string, string> = {
      open: "Открыт",
      in_progress: "В работе",
      completed: "Завершен",
      cancelled: "Отменен",
      dispute: "Спор",
      hidden: "Скрыт",
      closed: "Закрыт",
    };
    return map[status] || status;
  };

  const statusStyle = (status: string) => {
    if (status === "completed") return "bg-green-500/20 text-green-300";
    if (status === "cancelled" || status === "hidden") return "bg-red-500/20 text-red-300";
    if (status === "closed") return "bg-gray-500/20 text-gray-300";
    if (status === "dispute") return "bg-orange-500/20 text-orange-300";
    if (status === "in_progress") return "bg-blue-500/20 text-blue-300";
    return "bg-cyan-500/20 text-cyan-300";
  };

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto text-white">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Модерация заказов</h1>
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
            placeholder="Поиск по ID, названию, заказчику, категории, статусу..."
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
            <p className="text-white-soft">Загрузка заказов...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="panel-surface backdrop-blur-xl p-6">
            <p className="text-white-soft">
              {searchActive ? "Заказы не найдены" : "Нет заказов"}
            </p>
          </div>
        ) : (
          <>
            {!searchActive &&
              orders.length > 0 &&
              ordersAwaitingModeration.length === 0 && (
                <div className="panel-surface backdrop-blur-xl p-8 mb-6 text-center">
                  <p className="text-white-soft">Нет заказов на модерацию</p>
                </div>
              )}
            <div className="panel-surface backdrop-blur-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-4 py-3 text-left text-white-soft text-sm">ID</th>
                  <th className="px-4 py-3 text-left text-white-soft text-sm">Заказ</th>
                  <th className="px-4 py-3 text-left text-white-soft text-sm">Категория</th>
                  <th className="px-4 py-3 text-left text-white-soft text-sm">Заказчик</th>
                  <th className="px-4 py-3 text-left text-white-soft text-sm">Бюджет</th>
                  <th className="px-4 py-3 text-left text-white-soft text-sm">Статус</th>
                  <th className="px-4 py-3 text-left text-white-soft text-sm">Дата</th>
                  <th className="px-4 py-3 text-left text-white-soft text-sm">Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const actionLoading = actionLoadingId === order.id;
                  const isHidden = order.status === "hidden";
                  const isClosed = order.status === "closed";
                  const canHide = !isHidden && !isClosed;
                  const needsTrustBadge = order.moderatorTrustBadge !== true;

                  return (
                    <tr key={order.id} className="border-b border-white/5 align-top">
                      <td className="px-4 py-3 text-sm">{order.id}</td>
                      <td className="px-4 py-3 text-sm">
                        <p className="font-medium">{order.title}</p>
                        {order.status === "dispute" ? (
                          <p className="mt-1 text-xs text-amber-300/90">спор</p>
                        ) : null}
                        {order.moderationReason ? (
                          <p className="text-xs text-red-300 mt-1">{order.moderationReason}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm text-white-soft">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{order.category?.name ?? "—"}</span>
                          {order.moderatorTrustBadge === true && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-200">
                              <CircleCheck className="h-3 w-3 shrink-0 opacity-90" strokeWidth={2} />
                              Одобрено менеджером
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-white-soft">
                        {displayUserInfo(order.customer?.username, order.customerId)}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {Number(order.budget || 0).toLocaleString("ru-RU", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        BYN
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded text-xs ${statusStyle(order.status)}`}
                        >
                          {statusLabel(order.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-white-soft">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-col gap-2 min-w-[11rem]">
                          <Link
                            to={`/orders/${order.id}`}
                            className="ui-btn-outline inline-flex items-center justify-center px-3 py-1.5 text-xs"
                          >
                            Просмотр
                          </Link>

                          {!isHidden && needsTrustBadge && (
                            <button
                              type="button"
                              onClick={() => handleGrantTrustBadge(order.id)}
                              disabled={actionLoading}
                              className="ui-btn-primary inline-flex items-center justify-center px-3 py-1.5 text-xs disabled:opacity-50"
                            >
                              {actionLoading ? "…" : "Одобрить"}
                            </button>
                          )}

                          {isHidden && (
                            <button
                              type="button"
                              onClick={() => handleUnhideOrder(order.id)}
                              disabled={actionLoading}
                              className="ui-btn-primary inline-flex items-center justify-center px-3 py-1.5 text-xs disabled:opacity-50"
                            >
                              {actionLoading ? "…" : "Показать в каталоге"}
                            </button>
                          )}

                          {isClosed && (
                            <button
                              type="button"
                              onClick={() => handleReopenOrder(order.id)}
                              disabled={actionLoading}
                              className="ui-btn-primary inline-flex items-center justify-center px-3 py-1.5 text-xs disabled:opacity-50"
                            >
                              {actionLoading ? "…" : "Открыть заказ"}
                            </button>
                          )}

                          {hideOrderId === order.id ? (
                            <>
                              <textarea
                                value={hideReason}
                                onChange={(e) => setHideReason(e.target.value)}
                                placeholder="Причина скрытия..."
                                rows={3}
                                className="ui-input text-xs py-2"
                              />
                              <button
                                type="button"
                                onClick={() => handleHideOrder(order.id)}
                                disabled={actionLoading || !hideReason.trim()}
                                className="ui-btn-outline-danger inline-flex items-center justify-center px-3 py-1.5 text-xs disabled:opacity-50"
                              >
                                {actionLoading ? "Скрытие..." : "Подтвердить скрытие"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setHideOrderId(null);
                                  setHideReason("");
                                }}
                                className="ui-btn-outline inline-flex items-center justify-center px-3 py-1.5 text-xs"
                              >
                                Отмена
                              </button>
                            </>
                          ) : (
                            canHide && (
                              <button
                                type="button"
                                onClick={() => setHideOrderId(order.id)}
                                disabled={actionLoading}
                                className="ui-btn-outline-danger inline-flex items-center justify-center px-3 py-1.5 text-xs disabled:opacity-50"
                              >
                                Скрыть
                              </button>
                            )
                          )}
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

export default OrderModeration;
