import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import OrderService from "../../../services/order.service";
import ApplicationService from "../../../services/application.service";
import ApplicationForm from "../../applications/components/ApplicationForm";
import AuthService from "../../../services/auth.service";
import RatingForm from "../../rating/components/RatingForm";
import RatingService from "../../../services/rating.service";
import AttachmentList from "../../../components/ui/AttachmentList";
import type { AttachmentDto } from "../../../services/attachment.service";
import ReportService from "../../../services/report.service";
import { appDialog } from "../../../components/ui/app-dialog";
import { formatOrderStatusShortLabel } from "../../../utils/display-utils";
import { CircleCheck } from "lucide-react";

function orderDetailStatusChipClass(status: string): string {
  if (status === "open") return "bg-success/20 text-success";
  if (status === "in_progress") return "bg-blue-500/20 text-blue-400";
  if (status === "completed") return "bg-emerald-500/20 text-emerald-300";
  if (status === "cancelled") return "bg-white-muted text-white-soft";
  if (status === "dispute") return "bg-amber-500/20 text-amber-300";
  if (status === "hidden") return "bg-red-500/15 text-red-300";
  if (status === "closed") return "bg-gray-500/20 text-gray-300";
  return "bg-white-muted text-white-soft";
}

const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [myApplication, setMyApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [existingRating, setExistingRating] = useState<any>(null);
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeSubmitting, setDisputeSubmitting] = useState(false);
  
  const currentUser = AuthService.getCurrentUser() as { id?: number; roles?: string[] } | null;
  const userId = currentUser?.id ?? null;
  const hasExecuterRole =
    currentUser?.roles?.some((r: string) => r.toUpperCase().includes("EXECUTER")) ?? false;
  const isOwner = Boolean(order && userId != null && order.customer?.id === userId);
  const approvedApplication = applications.find((a) => a.status === "approved");
  const isExecuter = Boolean(
    approvedApplication && userId != null && approvedApplication.user?.id === userId
  );
  const approvedApplicantUserId = approvedApplication?.user?.id;

  useEffect(() => {
    if (!id) return;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return;

    let cancelled = false;
    setOrder(null);
    setApplications([]);
    setMyApplication(null);
    setExistingRating(null);
    setShowApplicationForm(false);
    setLoading(true);

    (async () => {
      try {
        const res = await OrderService.getOrderById(numericId);
        if (cancelled) return;
        const data = res.data;
        setOrder(data);
        setApplications(Array.isArray(data.applications) ? data.applications : []);
      } catch (error: unknown) {
        if (!cancelled) {
          console.error("Ошибка загрузки заказа:", error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || !order || userId == null) return;
    const customerId = order.customer?.id;
    const owner = customerId === userId;
    if (owner) {
      setMyApplication(null);
      return;
    }
    if (!hasExecuterRole) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await ApplicationService.getMyApplications();
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        const app = list.find((a: { orderId?: number }) => Number(a.orderId) === Number(id));
        setMyApplication(app || null);
      } catch (error) {
        if (!cancelled) {
          console.error("Ошибка загрузки моего отклика:", error);
          setMyApplication(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, order?.id, order?.customer?.id, userId, hasExecuterRole]);

  useEffect(() => {
    if (!id || !order || order.status !== "completed" || userId == null) return;

    let cancelled = false;
    (async () => {
      try {
        const owner = order.customer?.id === userId;
        const targetUserId = owner ? approvedApplicantUserId : order.customer?.id;
        if (!targetUserId) return;

        const resRatings = await RatingService.getRatings({ userId: targetUserId });
        if (cancelled) return;
        const myRating = resRatings.data.find(
          (r: { fromUserId?: number; orderId?: number }) =>
            r.fromUserId === userId && r.orderId === Number(id)
        );
        setExistingRating(myRating ?? null);
      } catch (error) {
        if (!cancelled) console.error("Ошибка проверки рейтинга:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, order?.id, order?.status, userId, approvedApplicantUserId]);

  const checkExistingRating = useCallback(async () => {
    if (!id || !order || order.status !== "completed" || userId == null) return;
    const owner = order.customer?.id === userId;
    const targetUserId = owner ? approvedApplicantUserId : order.customer?.id;
    if (!targetUserId) return;
    try {
      const resRatings = await RatingService.getRatings({ userId: targetUserId });
      const myRating = resRatings.data.find(
        (r: { fromUserId?: number; orderId?: number }) =>
          r.fromUserId === userId && r.orderId === Number(id)
      );
      setExistingRating(myRating ?? null);
    } catch (error) {
      console.error("Ошибка проверки рейтинга:", error);
    }
  }, [id, order, userId, approvedApplicantUserId]);

  const loadMyApplication = useCallback(async () => {
    if (userId == null || !id) {
      setMyApplication(null);
      return;
    }
    try {
      const res = await ApplicationService.getMyApplications();
      const list = Array.isArray(res.data) ? res.data : [];
      const app = list.find((a: { orderId?: number }) => Number(a.orderId) === Number(id));
      setMyApplication(app || null);
    } catch (error) {
      console.error("Ошибка загрузки моего отклика:", error);
      setMyApplication(null);
    }
  }, [id, userId]);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await OrderService.getOrderById(Number(id));
      const data = res.data;
      setOrder(data);
      setApplications(Array.isArray(data.applications) ? data.applications : []);
    } catch (error: unknown) {
      console.error("Ошибка загрузки заказа:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadApplications = useCallback(async () => {
    if (!id) return;
    try {
      const res = await OrderService.getOrderStats(Number(id));
      setApplications(res.data.applications || []);
    } catch (error) {
      console.error("Ошибка загрузки откликов:", error);
    }
  }, [id]);

  const handleApprove = async (applicationId: number) => {
    try {
      await ApplicationService.approveApplication(applicationId);
      await loadApplications();
    } catch (error) {
      console.error("Ошибка одобрения отклика:", error);
    }
  };

  const handleReject = async (applicationId: number) => {
    try {
      await ApplicationService.rejectApplication(applicationId);
      await loadApplications();
    } catch (error) {
      console.error("Ошибка отклонения отклика:", error);
    }
  };

  const handleDelete = async () => {
    if (!(await appDialog.confirm("Вы уверены, что хотите удалить этот заказ?", { danger: true })))
      return;
    try {
      await OrderService.deleteOrder(Number(id));
      navigate("/catalog");
    } catch (error) {
      console.error("Ошибка удаления заказа:", error);
    }
  };

  const handleCancelApplication = async () => {
    if (!myApplication) return;
    if (!(await appDialog.confirm("Вы уверены, что хотите отменить отклик?"))) return;
    try {
      await ApplicationService.cancelApplication(myApplication.id);
      setMyApplication(null);
      await loadApplications();
      void appDialog.alert("Отклик отменен", "success");
    } catch (error) {
      console.error("Ошибка отмены отклика:", error);
    }
  };

  const handleCompleteOrder = async () => {
    if (!(await appDialog.confirm("Вы уверены, что хотите завершить заказ?"))) return;
    try {
      await OrderService.updateOrder(Number(id), { status: "completed" });
      loadOrder();
    } catch (error) {
      console.error("Ошибка завершения заказа:", error);
    }
  };

  const handleReportOrder = async () => {
    const reason = await appDialog.prompt("Опишите причину жалобы на заказ:", {
      placeholder: "Текст жалобы",
    });
    if (reason === null || !reason.trim()) return;
    try {
      await ReportService.createReport({
        targetId: Number(id),
        targetType: "order",
        reason: reason.trim(),
      });
      void appDialog.alert("Жалоба отправлена менеджеру", "success");
    } catch (error) {
      console.error("Ошибка отправки жалобы:", error);
      void appDialog.alert("Не удалось отправить жалобу", "error");
    }
  };

  const handleOpenDispute = async () => {
    if (!myApplication?.id) return;
    if (!disputeReason.trim()) {
      void appDialog.alert("Укажите причину спора", "error");
      return;
    }
    try {
      setDisputeSubmitting(true);
      await ApplicationService.openDisputeForApplication(myApplication.id, {
        reason: disputeReason.trim(),
        description: disputeDescription.trim() || undefined,
      });
      await loadOrder();
      setShowDisputeForm(false);
      setDisputeReason("");
      setDisputeDescription("");
      void appDialog.alert("Спор открыт. Менеджер подключится к рассмотрению.", "success");
    } catch (error: any) {
      console.error("Ошибка открытия спора:", error);
      void appDialog.alert(error?.response?.data?.message || "Не удалось открыть спор", "error");
    } finally {
      setDisputeSubmitting(false);
    }
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

  if (!order) {
    return <div className="login_container"><p>Заказ не найден</p></div>;
  }

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-5xl mx-auto text-white flex flex-col gap-6">
        <div className="panel-surface p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <button
              onClick={() => navigate("/catalog")}
              className="rounded border border-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/10"
            >
              ← Назад
            </button>
            {isOwner && (
              <div className="flex gap-4">
                {(order.status === "open" || order.status === "in_progress") && (
                  <button
                    onClick={handleCompleteOrder}
                    className="rounded border border-emerald-600/60 bg-emerald-600/20 px-4 py-2 text-sm text-emerald-300 transition-colors hover:bg-emerald-600/30"
                  >
                    Завершить заказ
                  </button>
                )}
                <button
                  onClick={() => navigate(`/orders/${id}/edit`)}
                  className="ui-btn-primary px-4 py-2 text-sm"
                >
                  Редактировать
                </button>
                <button
                  onClick={handleDelete}
                  className="rounded border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-md transition-all hover:border-danger/50 hover:text-danger"
                >
                  Удалить
                </button>
              </div>
            )}
            {!isOwner && (
              <button
                onClick={handleReportOrder}
                className="rounded border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition-all hover:border-danger/50 hover:text-danger"
              >
                Пожаловаться на заказ
              </button>
            )}
          </div>
        </div>

        <div className="panel-surface p-6 md:p-8 backdrop-blur-xl">
          <h1 className="text-3xl font-semibold mb-4">{order.title}</h1>
          <p className="text-white mb-4">{order.description}</p>
          
          <div className="flex flex-wrap gap-4 mb-4">
            {order.category && (
              <span className="px-3 py-1 bg-white/10 rounded">{order.category.name}</span>
            )}
            <span
              className={`px-3 py-1 rounded ${orderDetailStatusChipClass(order.status)}`}
            >
              {formatOrderStatusShortLabel(order.status)}
            </span>
            {order.moderatorTrustBadge === true && order.status !== "hidden" && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-200">
                <CircleCheck className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} />
                Одобрено менеджером
              </span>
            )}
          </div>

          {order.customer && (
            <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-white-soft text-sm mb-1">Автор заказа:</p>
              <Link 
                to={`/profile/${order.customer.id}`}
                className="font-semibold text-primary transition-colors hover:text-primary-hover"
              >
                {order.customer.username}
              </Link>
            </div>
          )}

          {order.budget && (
            <p className="mb-2 text-xl font-semibold text-primary">Бюджет: {order.budget} BYN</p>
          )}
          {order.deadline && (
            <p className="text-white-soft text-sm">Срок: {new Date(order.deadline).toLocaleDateString()}</p>
          )}

          {Array.isArray(order.attachments) && order.attachments.length > 0 && (
            <div className="mt-8 border-t border-white/10 pt-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Вложения</h2>
              <AttachmentList attachments={order.attachments as AttachmentDto[]} />
            </div>
          )}
        </div>

        {hasExecuterRole && !isOwner && order.status === "open" && (
          <div className="panel-surface p-6 backdrop-blur-xl">
            {myApplication ? (
              <div className="flex items-center justify-between bg-white/10 rounded-xl p-4">
                <div>
                  <p className="font-medium">Вы откликнулись на этот заказ</p>
                  <span className={`text-sm ${
                    myApplication.status === "approved" ? "text-success" :
                    myApplication.status === "rejected" ? "text-error" : "text-primary"
                  }`}>
                    Статус: {
                      myApplication.status === "approved" ? "Одобрен" :
                      myApplication.status === "rejected" ? "Отклонен" : "На рассмотрении"
                    }
                  </span>
                </div>
                {myApplication.status === "pending" && (
                  <button
                    onClick={handleCancelApplication}
                    className="rounded border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-md transition-all hover:border-danger/50 hover:text-danger"
                  >
                    Отменить отклик
                  </button>
                )}
                {myApplication.status === "rejected" && (
                  <div className="w-full">
                    {showDisputeForm ? (
                      <div className="rounded-xl border border-warning/40 bg-warning/10 p-3">
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
                            onClick={handleOpenDispute}
                            disabled={disputeSubmitting}
                            className="rounded-lg border border-warning/50 bg-warning/20 px-3 py-1.5 text-sm text-warning transition-colors hover:bg-warning/30 disabled:opacity-50"
                          >
                            {disputeSubmitting ? "Отправка..." : "Отправить спор"}
                          </button>
                          <button
                            onClick={() => {
                              setShowDisputeForm(false);
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
                        onClick={() => setShowDisputeForm(true)}
                        className="rounded border border-warning/50 bg-warning/10 px-4 py-2 text-sm text-warning transition-colors hover:bg-warning/20"
                      >
                        Начать спор
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : showApplicationForm ? (
              <ApplicationForm
                orderId={order.id}
                onSuccess={async () => {
                  setShowApplicationForm(false);
                  setTimeout(async () => {
                    await loadApplications();
                    await loadMyApplication();
                  }, 500);
                }}
              />
            ) : (
              <button
                onClick={() => setShowApplicationForm(true)}
                className="ui-btn-primary w-full py-2.5"
              >
                Откликнуться на заказ
              </button>
            )}
          </div>
        )}

        {order.status === "completed" && (isOwner || isExecuter) && !existingRating && (
            <div className="panel-surface p-6 backdrop-blur-xl">
                <h2 className="text-2xl font-semibold mb-4">Оставить отзыв</h2>
                <RatingForm 
                    toUserId={isOwner ? approvedApplication?.user?.id : order.customer?.id}
                    orderId={order.id}
                    onSuccess={() => {
                        checkExistingRating();
                        loadOrder(); 
                    }}
                />
            </div>
        )}

        {order.status === "completed" && existingRating && (
             <div className="panel-surface p-6 backdrop-blur-xl">
                <h2 className="text-xl font-semibold mb-2">Ваш отзыв</h2>
                <div className="border border-white/10 rounded-xl p-4 bg-white/5">
                    <div className="mb-2 flex items-center gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className={i < existingRating.rating ? 'text-primary' : 'text-white-soft'}>
                        ★
                        </span>
                    ))}
                    </div>
                    <p className="text-white">{existingRating.comment}</p>
                </div>
             </div>
        )}

        {isOwner && (
          <div className="panel-surface p-6 backdrop-blur-xl">
            <h2 className="text-2xl font-semibold mb-4">Отклики ({applications.length})</h2>
            {applications.length === 0 ? (
              <p className="text-white-soft">Нет откликов</p>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <div key={app.id} className="border border-white/10 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold">{app.user?.username}</p>
                        {app.message && <p className="text-white text-sm mt-1">{app.message}</p>}
                        {app.proposedPrice && (
                          <p className="mt-1 font-semibold text-primary">Предложенная цена: {app.proposedPrice} BYN</p>
                        )}
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        app.status === "approved" ? "bg-success/20 text-success" :
                        app.status === "rejected" ? "bg-error/20 text-error" :
                        "border border-primary/35 bg-white/5 text-primary"
                      }`}>
                        {app.status === "approved" ? "Одобрен" :
                         app.status === "rejected" ? "Отклонен" : "Ожидает"}
                      </span>
                    </div>
                    {app.status === "pending" && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleApprove(app.id)}
                          className="px-3 py-1 bg-success/20 border border-success rounded text-success text-sm hover:bg-success/30 transition-colors"
                        >
                          Одобрить
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          className="rounded border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 backdrop-blur-md transition-all hover:border-danger/50 hover:text-danger"
                        >
                          Отклонить
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default OrderDetail;

