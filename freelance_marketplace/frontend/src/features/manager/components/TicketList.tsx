import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ManagerService from "../../../services/manager.service";
import { displayUserInfo } from "../../../utils/display-utils";

interface Ticket {
  id: number;
  subject: string;
  category: string;
  status: string;
  priority: string;
  userId: number;
  assignedManagerId?: number;
  createdAt: string;
  user?: { id: number; username: string };
}

const TicketList: React.FC = () => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadTickets();
  }, [statusFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const res = await ManagerService.getTickets();
      let filtered = res.data.tickets || res.data;
      if (statusFilter !== "all") {
        filtered = filtered.filter(
          (t: Ticket) => t.status === statusFilter
        );
      }
      setTickets(filtered);
    } catch (error) {
      console.error("Ошибка загрузки тикетов:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-500";
      case "high":
        return "text-orange-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return "text-white-soft";
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      open: "bg-blue-500/20 text-blue-300",
      in_progress: "bg-yellow-500/20 text-yellow-300",
      resolved: "bg-green-500/20 text-green-300",
      closed: "bg-gray-500/20 text-gray-300",
    };
    return styles[status] || "bg-gray-500/20 text-gray-300";
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      technical: "Техническая",
      payment: "Платеж",
      dispute: "Спор",
      abuse: "Нарушение",
      other: "Другое",
    };
    return labels[category] || category;
  };

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-6xl mx-auto text-white">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">Тикеты помощи</h1>
          <Link
            to="/manager"
            className="px-4 py-2 bg-primary/20 rounded hover:bg-primary/30 transition"
          >
            ← Назад
          </Link>
        </div>

        {/* Фильтры статуса */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {["all", "open", "in_progress", "resolved", "closed"].map((status) => (
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
                : status === "in_progress"
                ? "В работе"
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
            <p className="text-white-soft">Загрузка тикетов...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="panel-surface p-6 backdrop-blur-xl">
            <p className="text-white-soft">Нет тикетов с выбранным статусом</p>
          </div>
        ) : (
          <div className="panel-surface backdrop-blur-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-white-soft text-sm">ID</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Тема</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Категория</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Приоритет</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Статус</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">От кого</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Дата</th>
                  <th className="px-6 py-4 text-left text-white-soft text-sm">Действие</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="border-b border-white/5 hover:bg-white/5">
                    <td className="px-6 py-4 text-sm text-white">{ticket.id}</td>
                    <td className="px-6 py-4 text-sm text-white">{ticket.subject}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-white-soft">
                        {getCategoryLabel(ticket.category)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={getPriorityColor(ticket.priority)}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-white-soft">
                      {displayUserInfo(ticket.user?.username, ticket.userId)}
                    </td>
                    <td className="px-6 py-4 text-sm text-white-soft">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <Link
                        to={`/manager/tickets/${ticket.id}`}
                        className="text-primary hover:underline"
                      >
                        Открыть
                      </Link>
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

export default TicketList;
