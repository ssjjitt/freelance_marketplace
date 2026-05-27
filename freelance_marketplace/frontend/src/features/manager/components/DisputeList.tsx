import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ManagerService from "../../../services/manager.service";
import { displayUserInfo } from "../../../utils/display-utils";
import { appDialog } from "../../../components/ui/app-dialog";

interface Dispute {
  id: number;
  orderId: number;
  customerId: number;
  executerId: number;
  reason: string;
  status: string;
  resolution?: string;
  createdAt: string;
  customer?: { id: number; username: string };
  executer?: { id: number; username: string };
}

const DisputeList: React.FC = () => {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  useEffect(() => {
    loadDisputes();
  }, [statusFilter]);

  const loadDisputes = async () => {
    try {
      setLoading(true);
      const res = await ManagerService.getDisputes();
      let filtered = res.data.disputes || res.data;
      if (statusFilter !== "all") {
        filtered = filtered.filter(
          (d: Dispute) => d.status === statusFilter
        );
      }
      setDisputes(filtered);
    } catch (error) {
      console.error("Ошибка загрузки споров:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      open: "bg-blue-500/20 text-blue-300",
      in_review: "bg-yellow-500/20 text-yellow-300",
      resolved: "bg-green-500/20 text-green-300",
      closed: "bg-gray-500/20 text-gray-300",
    };
    return styles[status] || "bg-gray-500/20 text-gray-300";
  };

  const getResolutionLabel = (resolution?: string) => {
    if (!resolution) return "—";
    const labels: { [key: string]: string } = {
      customer_wins: "Выиграл заказчик",
      executer_wins: "Выиграл исполнитель",
      split: "Поделено пополам",
      refund: "Возврат",
    };
    return labels[resolution] || resolution;
  };

  const handleQuickResolve = async (disputeId: number, resolution: string) => {
    try {
      setResolvingId(disputeId);
      await ManagerService.resolveDispute(disputeId, { resolution });
      await loadDisputes();
    } catch (error) {
      console.error("Ошибка быстрого решения спора:", error);
      void appDialog.alert("Не удалось сохранить решение спора", "error");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto text-white">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Споры и арбитраж</h1>
          <Link
            to="/manager"
            className="px-4 py-2 bg-primary/20 rounded hover:bg-primary/30 transition"
          >
            ← Назад
          </Link>
        </div>

        {/* Фильтры статуса */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "open", "in_review", "resolved", "closed"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded transition ${
                statusFilter === status
                  ? "bg-primary text-white"
                  : "bg-white/5 hover:bg-white/10"
              }`}
            >
              {status === "all"
                ? "Все"
                : status === "in_review"
                ? "На разборе"
                : status === "open"
                ? "Открытые"
                : status === "resolved"
                ? "Решены"
                : "Закрыты"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="panel-surface p-6 backdrop-blur-xl">
            <p className="text-white-soft">Загрузка споров...</p>
          </div>
        ) : disputes.length === 0 ? (
          <div className="panel-surface p-6 backdrop-blur-xl">
            <p className="text-white-soft">Нет споров с выбранным статусом</p>
          </div>
        ) : (
          <div className="panel-surface backdrop-blur-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-white-soft text-sm">ID</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Заказ</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Заказчик</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Исполнитель</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Причина</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Статус</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Решение</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Дата</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Действия</th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((dispute) => (
                  <tr key={dispute.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-4 text-sm text-white">{dispute.id}</td>
                    <td className="px-6 py-4 text-sm text-white">Заказ #{dispute.orderId}</td>
                    <td className="px-6 py-4 text-sm text-white-soft">
                      {displayUserInfo(dispute.customer?.username, dispute.customerId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-white-soft">
                      {displayUserInfo(dispute.executer?.username, dispute.executerId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-white truncate max-w-xs">
                      {dispute.reason}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(dispute.status)}`}>
                        {dispute.status === "in_review"
                          ? "На разборе"
                          : dispute.status === "open"
                          ? "Открытый"
                          : dispute.status === "resolved"
                          ? "Решен"
                          : "Закрыт"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white-soft">
                      {getResolutionLabel(dispute.resolution)}
                    </td>
                    <td className="px-6 py-4 text-sm text-white-soft">
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          to={`/manager/disputes/${dispute.id}`}
                          className="text-primary hover:underline"
                        >
                          Открыть
                        </Link>
                        {dispute.status !== "resolved" && dispute.status !== "closed" && (
                          <>
                            <button
                              onClick={() => handleQuickResolve(dispute.id, "customer_wins")}
                              disabled={resolvingId !== null}
                              className="rounded bg-blue-500/20 px-2 py-1 text-xs text-blue-300 hover:bg-blue-500/30 disabled:opacity-50"
                            >
                              Заказчик прав
                            </button>
                            <button
                              onClick={() => handleQuickResolve(dispute.id, "executer_wins")}
                              disabled={resolvingId !== null}
                              className="rounded bg-purple-500/20 px-2 py-1 text-xs text-purple-300 hover:bg-purple-500/30 disabled:opacity-50"
                            >
                              Исполнитель прав
                            </button>
                            <button
                              onClick={() => handleQuickResolve(dispute.id, "refund")}
                              disabled={resolvingId !== null}
                              className="rounded bg-red-500/20 px-2 py-1 text-xs text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                            >
                              Возврат
                            </button>
                          </>
                        )}
                      </div>
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

export default DisputeList;
