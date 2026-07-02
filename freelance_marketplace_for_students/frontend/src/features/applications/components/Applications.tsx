import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import ApplicationService from "../../../services/application.service";
import AuthService from "../../../services/auth.service";
import { appDialog } from "../../../components/ui/app-dialog";

interface Application {
  id: number;
  message?: string;
  proposedPrice?: number;
  status: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
  order?: {
    id: number;
    title: string;
    description: string;
    budget?: number;
    status: string;
    category?: {
      id: number;
      name: string;
    };
    customer?: {
      id: number;
      username: string;
    };
  };
  service?: {
    id: number;
    title: string;
    description: string;
    price?: number;
    status: string;
    category?: {
      id: number;
      name: string;
    };
    executer?: {
      id: number;
      username: string;
    };
  };
}

const Applications: React.FC = () => {
  const navigate = useNavigate();
  const [myApplications, setMyApplications] = useState<Application[]>([]);
  const [applicationsForMyItems, setApplicationsForMyItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"my" | "for-my-items">("my");
  const [disputeApplicationId, setDisputeApplicationId] = useState<number | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser) {
      navigate("/login");
      return;
    }

    isMountedRef.current = true;
    loadData();

    return () => {
      isMountedRef.current = false;
    };
  }, [activeTab, navigate]);

  const loadData = async () => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      if (activeTab === "my") {
        const res = await ApplicationService.getMyApplications();
        if (isMountedRef.current) {
          setMyApplications(res.data || []);
        }
      } else {
        const res = await ApplicationService.getApplicationsForMyItems();
        if (isMountedRef.current) {
          setApplicationsForMyItems(res.data || []);
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки откликов:", error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const handleCancel = async (applicationId: number) => {
    if (!(await appDialog.confirm("Вы уверены, что хотите отменить этот отклик?"))) return;
    try {
      await ApplicationService.cancelApplication(applicationId);
      setMyApplications(prev => prev.filter(app => app.id !== applicationId));
    } catch (error) {
      console.error("Ошибка отмены отклика:", error);
      void appDialog.alert("Не удалось отменить отклик", "error");
    }
  };

  const handleApprove = async (applicationId: number) => {
    try {
      await ApplicationService.approveApplication(applicationId);
      setApplicationsForMyItems(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: "approved" } : app
        )
      );
    } catch (error) {
      console.error("Ошибка одобрения отклика:", error);
      void appDialog.alert("Не удалось одобрить отклик", "error");
    }
  };

  const handleReject = async (applicationId: number) => {
    if (!(await appDialog.confirm("Вы уверены, что хотите отклонить этот отклик?", { danger: true })))
      return;
    try {
      await ApplicationService.rejectApplication(applicationId);
      setApplicationsForMyItems(prev => 
        prev.map(app => 
          app.id === applicationId ? { ...app, status: "rejected" } : app
        )
      );
    } catch (error) {
      console.error("Ошибка отклонения отклика:", error);
      void appDialog.alert("Не удалось отклонить отклик", "error");
    }
  };

  const handleOpenDisputeForApplication = async (applicationId: number) => {
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
      void appDialog.alert("Спор открыт и передан менеджеру", "success");
      setDisputeApplicationId(null);
      setDisputeReason("");
      setDisputeDescription("");
    } catch (error: any) {
      console.error("Ошибка открытия спора:", error);
      void appDialog.alert(error?.response?.data?.message || "Не удалось открыть спор", "error");
    } finally {
      setDisputeSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      pending: { text: "На рассмотрении", className: "border border-primary/35 bg-white/5 text-primary" },
      approved: { text: "Одобрен", className: "bg-success/20 text-success" },
      rejected: { text: "Отклонен", className: "bg-error/20 text-error" },
    };
    const statusInfo = statusMap[status] || { text: status, className: "bg-white-muted text-white-soft" };
    return (
      <span className={`px-2 py-1 rounded text-xs ${statusInfo.className}`}>
        {statusInfo.text}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderApplicationCard = (app: Application, isMyApplication: boolean) => {
    const item = app.order || app.service;
    const itemType = app.order ? "order" : "service";
    const itemLink = app.order ? `/orders/${app.order.id}` : `/services/${app.service?.id}`;

    return (
      <div
        key={app.id}
        className="panel-surface p-6 backdrop-blur-xl"
      >
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start justify-between mb-3">
              <div>
                <Link
                  to={itemLink}
                  className="mb-2 block text-xl font-semibold text-primary transition-colors hover:text-primary-hover"
                >
                  {item?.title}
                </Link>
                {item?.category && (
                  <span className="px-2 py-1 bg-white/10 rounded text-sm mr-2">
                    {item.category.name}
                  </span>
                )}
                {getStatusBadge(app.status)}
              </div>
            </div>

            {item?.description && (
              <p className="text-white text-sm mb-3 line-clamp-2">{item.description}</p>
            )}

            <div className="flex flex-wrap gap-4 mb-3 text-sm">
              {app.order && app.order.budget && (
                <span className="font-semibold text-primary">Бюджет: {app.order.budget} BYN</span>
              )}
              {app.service && app.service.price && (
                <span className="font-semibold text-primary">Цена: {app.service.price} BYN</span>
              )}
              {app.proposedPrice && (
                <span className="font-semibold text-primary">
                  Предложенная цена: {app.proposedPrice} BYN
                </span>
              )}
            </div>

            {app.message && (
              <div className="mb-3 p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-white text-sm">{app.message}</p>
              </div>
            )}

            {isMyApplication ? (
              <div className="flex items-center gap-2 text-sm text-white-soft">
                <span>Отклик отправлен:</span>
                <span>{formatDate(app.createdAt)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white-soft">Отклик от:</span>
                <Link
                  to={`/profile/${app.user?.id}`}
                  className="font-semibold text-primary transition-colors hover:text-primary-hover"
                >
                  {app.user?.username}
                </Link>
                <span className="text-white-soft">•</span>
                <span className="text-white-soft">{formatDate(app.createdAt)}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 md:min-w-[200px]">
            {isMyApplication ? (
              <>
                {app.status === "pending" && (
                  <button
                    onClick={() => handleCancel(app.id)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-md transition-all hover:border-danger/50 hover:text-danger"
                  >
                    Отменить отклик
                  </button>
                )}
                <Link
                  to={itemLink}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center text-sm text-white backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10"
                >
                  Посмотреть {itemType === "order" ? "заказ" : "услугу"}
                </Link>
                {app.status === "rejected" &&
                  (disputeApplicationId === app.id ? (
                    <div className="rounded-xl border border-warning/40 bg-warning/10 p-3">
                      <p className="mb-2 text-sm font-semibold text-warning">Открыть спор</p>
                      <input
                        type="text"
                        value={disputeReason}
                        onChange={(e) => setDisputeReason(e.target.value)}
                        placeholder="Краткая причина спора"
                        className="mb-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white-soft"
                      />
                      <textarea
                        value={disputeDescription}
                        onChange={(e) => setDisputeDescription(e.target.value)}
                        placeholder="Подробности (необязательно)"
                        rows={3}
                        className="mb-2 w-full rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white-soft"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenDisputeForApplication(app.id)}
                          disabled={disputeSubmitting}
                          className="rounded-lg border border-warning/50 bg-warning/20 px-3 py-1.5 text-sm text-warning transition-colors hover:bg-warning/30 disabled:opacity-50"
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
                          className="rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-sm text-white-soft transition-colors hover:bg-white/10"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDisputeApplicationId(app.id)}
                      className="rounded-xl border border-warning/50 bg-warning/10 px-4 py-2 text-sm text-warning transition-colors hover:bg-warning/20"
                    >
                      Начать спор
                    </button>
                  ))}
              </>
            ) : (
              <>
                {app.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(app.id)}
                      className="flex-1 px-4 py-2 bg-success/20 border border-success text-success rounded-xl hover:bg-success/30 transition-colors text-sm"
                    >
                      Одобрить
                    </button>
                    <button
                      onClick={() => handleReject(app.id)}
                      className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-md transition-all hover:border-danger/50 hover:text-danger"
                    >
                      Отклонить
                    </button>
                  </div>
                )}
                <Link
                  to={itemLink}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-center text-sm text-white backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10"
                >
                  Посмотреть {itemType === "order" ? "заказ" : "услугу"}
                </Link>
                <Link
                  to={`/profile/${app.user?.id}`}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-xl hover:bg-white/20 transition-colors text-center text-sm"
                >
                  Профиль пользователя
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="login_container">
        <div className="login_form">
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  const applications = activeTab === "my" ? myApplications : applicationsForMyItems;

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto text-white">
        <div className="panel-surface p-6 md:p-8 backdrop-blur-xl mb-8">
          <h1 className="text-3xl font-semibold mb-6">Отклики</h1>

          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("my")}
              className={`rounded-xl border px-4 py-2 transition-all ${activeTab === "my"
                  ? "border-primary/40 bg-white/5 text-primary"
                  : "border-white/15 bg-white/5 text-white/80 hover:border-primary/35 hover:text-primary"
                }`}
            >
              Мои отклики
            </button>
            <button
              onClick={() => setActiveTab("for-my-items")}
              className={`rounded-xl border px-4 py-2 transition-all ${activeTab === "for-my-items"
                  ? "border-primary/40 bg-white/5 text-primary"
                  : "border-white/15 bg-white/5 text-white/80 hover:border-primary/35 hover:text-primary"
                }`}
            >
              Отклики на мои заказы/услуги
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {applications.length === 0 ? (
            <div className="panel-surface p-8 backdrop-blur-xl text-center">
              <p className="text-white-soft text-lg">
                {activeTab === "my"
                  ? "У вас пока нет откликов"
                  : "На ваши заказы/услуги пока нет откликов"}
              </p>
            </div>
          ) : (
            applications.map((app) => renderApplicationCard(app, activeTab === "my"))
          )}
        </div>
      </div>
    </section>
  );
};

export default Applications;

