import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ManagerService from "../../../services/manager.service";
import SelectDropdown from "../../../components/ui/SelectDropdown";

interface Ticket {
  id: number;
  subject: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  userId: number;
  assignedManagerId?: number;
  createdAt: string;
  user?: { id: number; username: string };
}

const TicketDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  useEffect(() => {
    if (id) {
      loadTicket();
    }
  }, [id]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const res = await ManagerService.getTicketById(parseInt(id!));
      setTicket(res.data);
      setNewStatus(res.data.status);
    } catch (error) {
      console.error("Ошибка загрузки тикета:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!id || newStatus === ticket?.status) return;

    try {
      setUpdatingStatus(true);
      await ManagerService.updateTicketStatus(parseInt(id), newStatus);
      setTicket({ ...ticket!, status: newStatus });
    } catch (error) {
      console.error("Ошибка обновления статуса:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="panel-surface p-6 backdrop-blur-xl">
            <p className="text-white-soft">Загрузка тикета...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!ticket) {
    return (
      <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="panel-surface p-6 backdrop-blur-xl">
            <p className="text-red-400">Тикет не найден</p>
            <button
              onClick={() => navigate("/manager/tickets")}
              className="mt-4 px-4 py-2 bg-primary/20 rounded hover:bg-primary/30"
            >
              ← Назад к тикетам
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-4xl mx-auto text-white">
        <button
          onClick={() => navigate("/manager/tickets")}
          className="mb-6 px-4 py-2 bg-primary/20 rounded hover:bg-primary/30 transition"
        >
          ← Назад к тикетам
        </button>

        <div className="panel-surface backdrop-blur-xl p-8">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">#{ticket.id} {ticket.subject}</h1>
              <p className="text-white-soft mb-2">
                От пользователя: <span className="text-white">{ticket.user?.username}</span>
              </p>
              {ticket.user?.id && (
                <Link
                  to={`/profile/${ticket.user.id}`}
                  className="text-primary hover:underline text-sm"
                >
                  Просмотреть профиль пользователя →
                </Link>
              )}
            </div>
            <div className="text-right">
              <p className="text-white-soft mb-2">Приоритет</p>
              <p
                className={`text-lg font-bold ${
                  ticket.priority === "urgent"
                    ? "text-red-500"
                    : ticket.priority === "high"
                    ? "text-orange-500"
                    : ticket.priority === "medium"
                    ? "text-yellow-500"
                    : "text-green-500"
                }`}
              >
                {ticket.priority}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-white-soft text-sm mb-1">Категория</p>
              <p className="text-white bg-white/5 p-2 rounded">
                {ticket.category}
              </p>
            </div>
            <div>
              <p className="text-white-soft text-sm mb-1">Дата создания</p>
              <p className="text-white bg-white/5 p-2 rounded">
                {new Date(ticket.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-white-soft text-sm mb-2">Описание</p>
            <div className="bg-white/5 p-4 rounded border border-white/10">
              <p className="text-white whitespace-pre-wrap">{ticket.description}</p>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h2 className="text-xl font-bold mb-4">Управление</h2>

            <div>
              <p className="text-white-soft text-sm mb-2">Статус</p>
              <div className="flex gap-2">
                <div className="flex-1">
                  <SelectDropdown
                    value={newStatus}
                    onChange={setNewStatus}
                    options={[
                      { value: "open", label: "Открытый" },
                      { value: "in_progress", label: "В работе" },
                      { value: "resolved", label: "Решен" },
                      { value: "closed", label: "Закрыт" }
                    ]}
                  />
                </div>
                <button
                  onClick={handleUpdateStatus}
                  disabled={updatingStatus || newStatus === ticket.status}
                  className="px-6 py-2 bg-primary rounded hover:bg-primary/80 transition disabled:opacity-50"
                >
                  {updatingStatus ? "Сохранение..." : "Сохранить"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TicketDetail;
