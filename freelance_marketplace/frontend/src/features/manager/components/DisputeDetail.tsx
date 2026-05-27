import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ManagerService from "../../../services/manager.service";

interface Dispute {
  id: number;
  orderId: number;
  applicationId: number;
  customerId: number;
  executerId: number;
  reason: string;
  description: string;
  status: string;
  resolution?: string;
  resolutionComment?: string;
  createdAt: string;
  customer?: { id: number; username: string };
  executer?: { id: number; username: string };
}

const DisputeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [resolution, setResolution] = useState("");
  const [resolutionComment, setResolutionComment] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (id) {
      loadDispute();
    }
  }, [id]);

  const loadDispute = async () => {
    try {
      setLoading(true);
      const res = await ManagerService.getDisputes();
      const data = res.data.disputes || res.data;
      const found = data.find((d: Dispute) => d.id === parseInt(id!));
      setDispute(found);
      setResolution(found?.resolution || "");
      setResolutionComment(found?.resolutionComment || "");
    } catch (error) {
      console.error("Ошибка загрузки спора:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!id || !resolution) return;

    try {
      setResolving(true);
      setError("");
      setSuccess("");
      await ManagerService.resolveDispute(parseInt(id), {
        resolution,
        comment: resolutionComment,
      });
      await loadDispute();
      setSuccess("Спор успешно разрешен");
    } catch (error) {
      console.error("Ошибка разрешения спора:", error);
      setError("Не удалось сохранить решение спора");
    } finally {
      setResolving(false);
    }
  };

  const getResolutionLabel = (value?: string) => {
    if (!value) return "—";
    const labels: Record<string, string> = {
      customer_wins: "Выиграл заказчик",
      executer_wins: "Выиграл исполнитель",
      split: "Поделено пополам",
      refund: "Возврат",
    };
    return labels[value] || value;
  };

  if (loading) {
    return (
      <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="panel-surface p-6 backdrop-blur-xl">
            <p className="text-white-soft">Загрузка спора...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!dispute) {
    return (
      <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
        <div className="max-w-4xl mx-auto">
          <div className="panel-surface p-6 backdrop-blur-xl">
            <p className="text-red-400">Спор не найден</p>
            <button
              onClick={() => navigate("/manager/disputes")}
              className="mt-4 px-4 py-2 bg-primary/20 rounded hover:bg-primary/30"
            >
              ← Назад к спорам
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
          onClick={() => navigate("/manager/disputes")}
          className="mb-6 px-4 py-2 bg-primary/20 rounded hover:bg-primary/30 transition"
        >
          ← Назад к спорам
        </button>

        <div className="panel-surface backdrop-blur-xl p-8">
          {error && (
            <p className="mb-4 rounded border border-red-400/40 bg-red-500/20 px-3 py-2 text-red-300">
              {error}
            </p>
          )}
          {success && (
            <p className="mb-4 rounded border border-green-400/40 bg-green-500/20 px-3 py-2 text-green-300">
              {success}
            </p>
          )}

          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Спор #{dispute.id}</h1>
              <p className="text-white-soft">
                Заказ: <span className="text-white">#{dispute.orderId}</span>
              </p>
            </div>
            <div>
              <span
                className={`px-3 py-1 rounded text-sm ${
                  dispute.status === "open"
                    ? "bg-blue-500/20 text-blue-300"
                    : dispute.status === "in_review"
                    ? "bg-yellow-500/20 text-yellow-300"
                    : "bg-green-500/20 text-green-300"
                }`}
              >
                {dispute.status === "in_review"
                  ? "На разборе"
                  : dispute.status === "open"
                  ? "Открытый"
                  : "Решен"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-white-soft text-sm mb-1">Заказчик</p>
              <p className="text-white bg-white/5 p-2 rounded">
                {dispute.customer?.username || `User #${dispute.customerId}`}
              </p>
            </div>
            <div>
              <p className="text-white-soft text-sm mb-1">Исполнитель</p>
              <p className="text-white bg-white/5 p-2 rounded">
                {dispute.executer?.username || `User #${dispute.executerId}`}
              </p>
            </div>
            <div>
              <p className="text-white-soft text-sm mb-1">Причина спора</p>
              <p className="text-white bg-white/5 p-2 rounded">
                {dispute.reason}
              </p>
            </div>
            <div>
              <p className="text-white-soft text-sm mb-1">Дата создания</p>
              <p className="text-white bg-white/5 p-2 rounded">
                {new Date(dispute.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-white-soft text-sm mb-2">Описание</p>
            <div className="bg-white/5 p-4 rounded border border-white/10">
              <p className="text-white whitespace-pre-wrap">{dispute.description}</p>
            </div>
          </div>

          {dispute.status !== "resolved" && dispute.status !== "closed" && (
            <div className="border-t border-white/10 pt-6">
              <h2 className="text-xl font-bold mb-4">Разрешение спора</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-white-soft text-sm mb-2">Решение</p>
                  <div className="relative">
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="w-full appearance-none rounded-xl border border-white/20 bg-white/10 px-3 py-2 pr-10 text-sm text-white outline-none transition-colors hover:border-white/35 focus:border-primary/60"
                    >
                      <option value="" disabled className="bg-[#141414] text-[#d1d5db]">
                        Выберите решение
                      </option>
                      <option value="customer_wins" className="bg-[#141414] text-white">
                        Выиграл заказчик
                      </option>
                      <option value="executer_wins" className="bg-[#141414] text-white">
                        Выиграл исполнитель
                      </option>
                      <option value="split" className="bg-[#141414] text-white">
                        Поделено пополам
                      </option>
                      <option value="refund" className="bg-[#141414] text-white">
                        Возврат
                      </option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white-soft">
                      ▼
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-white-soft text-sm mb-2">Комментарий решения</p>
                  <textarea
                    value={resolutionComment}
                    onChange={(e) => setResolutionComment(e.target.value)}
                    placeholder="Объясните решение..."
                    className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white placeholder:text-white-soft"
                    rows={4}
                  />
                </div>

                <button
                  onClick={handleResolveDispute}
                  disabled={resolving || !resolution}
                  className="px-6 py-2 bg-primary rounded hover:bg-primary/80 transition disabled:opacity-50"
                >
                  {resolving ? "Сохранение..." : "Разрешить спор"}
                </button>
              </div>
            </div>
          )}

          {dispute.status === "resolved" && (
            <div className="border-t border-white/10 pt-6 bg-green-500/10 p-4 rounded">
              <h2 className="text-xl font-bold mb-4 text-green-300">Спор разрешен</h2>
              <p className="text-white-soft mb-2">
                Решение: <span className="text-white">{getResolutionLabel(dispute.resolution)}</span>
              </p>
              {dispute.resolutionComment && (
                <p className="text-white-soft">
                  Комментарий: <span className="text-white">{dispute.resolutionComment}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DisputeDetail;
