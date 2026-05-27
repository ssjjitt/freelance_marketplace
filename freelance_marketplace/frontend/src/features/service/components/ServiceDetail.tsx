import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import ServiceService from "../../../services/service.service";
import ApplicationService from "../../../services/application.service";
import ApplicationForm from "../../applications/components/ApplicationForm";
import AuthService from "../../../services/auth.service";
import RatingForm from "../../rating/components/RatingForm";
import RatingService from "../../../services/rating.service";
import ReportService from "../../../services/report.service";
import { appDialog } from "../../../components/ui/app-dialog";
import AttachmentList from "../../../components/ui/AttachmentList";
import type { AttachmentDto } from "../../../services/attachment.service";
import { CircleCheck } from "lucide-react";

const ServiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [myApplication, setMyApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [existingRating, setExistingRating] = useState<any>(null);
  
  const currentUser = AuthService.getCurrentUser() as { id?: number; roles?: string[] } | null;
  const userId = currentUser?.id ?? null;
  const hasCustomerRole =
    currentUser?.roles?.some((r: string) => r.toUpperCase().includes("CUSTOMER")) ?? false;
  const isOwner = Boolean(service && userId != null && service.executer?.id === userId);
  const approvedApplication = applications.find((a) => a.status === "approved");
  const isCustomer = Boolean(
    approvedApplication && userId != null && approvedApplication.user?.id === userId
  );
  const approvedCustomerUserId = approvedApplication?.user?.id;

  useEffect(() => {
    if (!id) return;
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return;

    let cancelled = false;
    setService(null);
    setApplications([]);
    setMyApplication(null);
    setExistingRating(null);
    setShowApplicationForm(false);
    setLoading(true);

    (async () => {
      try {
        const res = await ServiceService.getServiceById(numericId);
        if (cancelled) return;
        const data = res.data;
        setService(data);
        setApplications(Array.isArray(data.applications) ? data.applications : []);
      } catch (error: unknown) {
        if (!cancelled) console.error("Ошибка загрузки услуги:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!id || !service || userId == null) return;
    const executerId = service.executer?.id;
    const owner = executerId === userId;
    if (owner) {
      setMyApplication(null);
      return;
    }
    if (!hasCustomerRole) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await ApplicationService.getMyApplications();
        if (cancelled) return;
        const list = Array.isArray(res.data) ? res.data : [];
        const app = list.find((a: { serviceId?: number }) => Number(a.serviceId) === Number(id));
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
  }, [id, service?.id, service?.executer?.id, userId, hasCustomerRole]);

  useEffect(() => {
    if (!id || !service || service.status !== "completed" || userId == null) return;

    let cancelled = false;
    (async () => {
      try {
        const owner = service.executer?.id === userId;
        const targetUserId = owner ? approvedCustomerUserId : service.executer?.id;
        if (!targetUserId) return;

        const resRatings = await RatingService.getRatings({ userId: targetUserId });
        if (cancelled) return;
        const myRating = resRatings.data.find(
          (r: { fromUserId?: number; serviceId?: number }) =>
            r.fromUserId === userId && r.serviceId === Number(id)
        );
        setExistingRating(myRating ?? null);
      } catch (error) {
        if (!cancelled) console.error("Ошибка проверки рейтинга:", error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id, service?.id, service?.status, service?.executer?.id, userId, approvedCustomerUserId]);

  const checkExistingRating = useCallback(async () => {
    if (!id || !service || service.status !== "completed" || userId == null) return;
    const owner = service.executer?.id === userId;
    const targetUserId = owner ? approvedCustomerUserId : service.executer?.id;
    if (!targetUserId) return;
    try {
      const resRatings = await RatingService.getRatings({ userId: targetUserId });
      const myRating = resRatings.data.find(
        (r: { fromUserId?: number; serviceId?: number }) =>
          r.fromUserId === userId && r.serviceId === Number(id)
      );
      setExistingRating(myRating ?? null);
    } catch (error) {
      console.error("Ошибка проверки рейтинга:", error);
    }
  }, [id, service, userId, approvedCustomerUserId]);

  const loadMyApplication = useCallback(async () => {
    if (userId == null || !id) {
      setMyApplication(null);
      return;
    }
    try {
      const res = await ApplicationService.getMyApplications();
      const list = Array.isArray(res.data) ? res.data : [];
      const app = list.find((a: { serviceId?: number }) => Number(a.serviceId) === Number(id));
      setMyApplication(app || null);
    } catch (error) {
      console.error("Ошибка загрузки моего отклика:", error);
      setMyApplication(null);
    }
  }, [id, userId]);

  const loadService = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await ServiceService.getServiceById(Number(id));
      const data = res.data;
      setService(data);
      setApplications(Array.isArray(data.applications) ? data.applications : []);
    } catch (error: unknown) {
      console.error("Ошибка загрузки услуги:", error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadApplications = useCallback(async () => {
    if (!id) return;
    try {
      const res = await ServiceService.getServiceStats(Number(id));
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
    if (!(await appDialog.confirm("Вы уверены, что хотите удалить эту услугу?", { danger: true })))
      return;
    try {
      await ServiceService.deleteService(Number(id));
      navigate("/catalog");
    } catch (error) {
      console.error("Ошибка удаления услуги:", error);
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

  const handleCompleteService = async () => {
    if (!(await appDialog.confirm("Вы уверены, что хотите завершить услугу?"))) return;
    try {
      await ServiceService.updateService(Number(id), { status: "completed" });
      loadService();
    } catch (error) {
      console.error("Ошибка завершения услуги:", error);
    }
  };

  const handleReportService = async () => {
    const reason = await appDialog.prompt("Опишите причину жалобы на услугу:", {
      placeholder: "Текст жалобы",
    });
    if (reason === null || !reason.trim()) return;
    try {
      await ReportService.createReport({
        targetId: Number(id),
        targetType: "service",
        reason: reason.trim(),
      });
      void appDialog.alert("Жалоба отправлена менеджеру", "success");
    } catch (error) {
      console.error("Ошибка отправки жалобы:", error);
      void appDialog.alert("Не удалось отправить жалобу", "error");
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

  if (!service) {
    return <div className="login_container"><p>Услуга не найдена</p></div>;
  }

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-5xl mx-auto text-white flex flex-col gap-6">
        <div className="panel-surface p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <button
              onClick={() => navigate("/catalog")}
              className="px-4 py-2 border border-white/40 rounded text-sm hover:bg-white/10 transition-colors"
            >
              ← Назад
            </button>
            {isOwner && (
              <div className="flex gap-4">
                {service.status === "active" && (
                  <button
                    onClick={handleCompleteService}
                    className="ui-btn-primary px-4 py-2 text-sm"
                  >
                    Завершить услугу
                  </button>
                )}
                <button
                  onClick={() => navigate(`/services/${id}/edit`)}
                  className="ui-btn-primary px-4 py-2 text-sm"
                >
                  Редактировать
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-error/20 border border-error rounded text-error hover:bg-error/30 transition-colors text-sm"
                >
                  Удалить
                </button>
              </div>
            )}
            {!isOwner && (
              <button
                onClick={handleReportService}
                className="rounded border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 transition-all hover:border-danger/50 hover:text-danger"
              >
                Пожаловаться на услугу
              </button>
            )}
          </div>
        </div>

        <div className="panel-surface p-6 md:p-8 backdrop-blur-xl">
          <h1 className="text-3xl font-semibold mb-4">{service.title}</h1>
          <p className="text-white mb-4">{service.description}</p>
          
          <div className="flex flex-wrap gap-4 mb-4">
            {service.category && (
              <span className="px-3 py-1 bg-white/10 rounded">{service.category.name}</span>
            )}
            <span className={`px-3 py-1 rounded ${
              service.status === "active" ? "bg-success/20 text-success" :
              "bg-white-muted text-white-soft"
            }`}>
              {service.status === "active" ? "Активна" : "Неактивна"}
            </span>
            {service.isApproved === true && (
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-200">
                <CircleCheck className="h-4 w-4 shrink-0 opacity-90" strokeWidth={2} />
                Одобрено менеджером
              </span>
            )}
          </div>

          {service.executer && (
            <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
              <p className="text-white-soft text-sm mb-1">Автор услуги:</p>
              <Link 
                to={`/profile/${service.executer.id}`}
                className="font-semibold text-primary transition-colors hover:text-primary-hover"
              >
                {service.executer.username}
              </Link>
            </div>
          )}

          {service.price && (
            <p className="mb-2 text-xl font-semibold text-primary">Цена: {service.price} BYN</p>
          )}

          {Array.isArray(service.attachments) && service.attachments.length > 0 && (
            <div className="mt-6 border-t border-white/10 pt-6">
              <h2 className="mb-4 text-lg font-semibold text-white">Фото и файлы</h2>
              <AttachmentList attachments={service.attachments as AttachmentDto[]} />
            </div>
          )}
        </div>

        {hasCustomerRole && !isOwner && service.status === "active" && (
          <div className="panel-surface p-6 backdrop-blur-xl">
            {myApplication ? (
              <div className="flex items-center justify-between bg-white/10 rounded-xl p-4">
                <div>
                  <p className="font-medium">Вы откликнулись на эту услугу</p>
                  <span className={`text-sm ${
                    myApplication.status === "approved" ? "text-success" :
                    myApplication.status === "rejected" ? "text-error" : "text-white-soft"
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
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-md transition-all hover:border-danger/50 hover:text-danger"
                  >
                    Отменить отклик
                  </button>
                )}
              </div>
            ) : showApplicationForm ? (
              <ApplicationForm
                serviceId={service.id}
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
                className="ui-btn-primary w-full py-3"
              >
                Откликнуться на услугу
              </button>
            )}
          </div>
        )}

        {service.status === "completed" && (isOwner || isCustomer) && !existingRating && (
            <div className="panel-surface p-6 backdrop-blur-xl">
                <h2 className="text-2xl font-semibold mb-4">Оставить отзыв</h2>
                <RatingForm 
                    toUserId={isOwner ? approvedApplication?.user?.id : service.executer?.id}
                    serviceId={service.id}
                    onSuccess={() => {
                        checkExistingRating();
                        loadService();
                    }}
                />
            </div>
        )}

        {service.status === "completed" && existingRating && (
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
                          className="px-3 py-1 bg-success/20 border border-success rounded-xl text-success text-sm hover:bg-success/30 transition-colors"
                        >
                          Одобрить
                        </button>
                        <button
                          onClick={() => handleReject(app.id)}
                          className="rounded-xl border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/80 backdrop-blur-md transition-all hover:border-danger/50 hover:text-danger"
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

export default ServiceDetail;

