import React, { useState, useEffect, useCallback, useRef } from "react";
import NotificationService from "../../../services/notification.service";
import AuthService from "../../../services/auth.service";
import websocketService from "../../../services/websocket.service";
import { useNavigate, Link } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  ClipboardList,
  FileCheck,
  FileText,
  MessageSquare,
  Star,
  Wrench,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";

const iconProps = { strokeWidth: 1.5, size: 20 } as const;

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  relatedId: number | null;
  relatedType: string | null;
  isRead: boolean;
  createdAt: string;
}

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = AuthService.getCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const filterRef = useRef(filter);

  useEffect(() => {
    filterRef.current = filter;
  }, [filter]);

  const loadNotifications = useCallback(async (showLoading = true) => {
    try {
      // if (showLoading) setLoading(true);
      const response = await NotificationService.getNotifications(
        100,
        0,
        filterRef.current === "unread"
      );
      setNotifications(response.data);
    } catch (error) {
      console.error("Ошибка загрузки уведомлений:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser?.id == null) {
      navigate("/login");
      return;
    }

    loadNotifications();
  }, [currentUser?.id, navigate, filter, loadNotifications]);

  useEffect(() => {
    if (currentUser?.id == null) {
      return;
    }

    const handleNewNotification = (notification: Notification) => {
      setNotifications((prev) => {
        if (prev.some((n) => n.id === notification.id)) {
          return prev;
        }
        if (filterRef.current === "unread" && notification.isRead) {
          return prev;
        }
        return [notification, ...prev];
      });
    };

    const handleNotificationsUpdated = () => {
      loadNotifications(false);
    };

    websocketService.onNotification(handleNewNotification);
    websocketService.onNotificationsUpdated(handleNotificationsUpdated);

    return () => {
      websocketService.offNotification(handleNewNotification);
      websocketService.offNotificationsUpdated(handleNotificationsUpdated);
    };
  }, [currentUser?.id, loadNotifications]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await NotificationService.markAsRead(id);
      loadNotifications(false);
    } catch (error) {
      console.error("Ошибка отметки уведомления:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await NotificationService.markAllAsRead();
    } catch (error) {
      console.error("Ошибка отметки всех уведомлений:", error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await NotificationService.deleteNotification(id);
    } catch (error) {
      console.error("Ошибка удаления уведомления:", error);
    }
  };

  const getNotificationLink = (notification: Notification) => {
    if (!notification.relatedId || !notification.relatedType) return null;

    switch (notification.relatedType) {
      case "order":
        return `/orders/${notification.relatedId}`;
      case "service":
        return `/services/${notification.relatedId}`;
      case "application":
        return `/my-items`;
      case "message":
        return `/chats`;
      case "rating":
        return `/my-items`;
      default:
        return null;
    }
  };

  const getNotificationIconMeta = (
    type: string
  ): { Icon: LucideIcon; className: string } => {
    switch (type) {
      case "new_application":
        return { Icon: FileText, className: "text-primary" };
      case "application_approved":
        return { Icon: CheckCircle2, className: "text-success" };
      case "application_rejected":
        return { Icon: XCircle, className: "text-danger" };
      case "new_message":
        return { Icon: MessageSquare, className: "text-primary" };
      case "new_rating":
        return { Icon: Star, className: "text-secondary" };
      case "order_status_changed":
        return { Icon: ClipboardList, className: "text-primary" };
      case "service_status_changed":
        return { Icon: Wrench, className: "text-primary" };
      case "resume_approved":
        return { Icon: FileCheck, className: "text-success" };
      case "system":
        return { Icon: Bell, className: "text-white-soft" };
      default:
        return { Icon: Bell, className: "text-white-soft" };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return "Только что";
    if (minutes < 60) return `${minutes} мин. назад`;
    if (hours < 24) return `${hours} ч. назад`;
    if (days === 1) return "Вчера";
    if (days < 7) return `${days} дн. назад`;
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
        <div className="max-w-5xl mx-auto text-white">
          <div className="panel-surface p-6 md:p-8 backdrop-blur-xl">
            <p className="text-center">Загрузка уведомлений...</p>
          </div>
        </div>
      </section>
    );
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-5xl mx-auto text-white">
        <div className="panel-surface p-6 md:p-8 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-semibold">Оповещения</h1>
            <div className="flex items-center gap-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter("all")}
                  className={`rounded-xl border px-4 py-2 transition-all ${
                    filter === "all"
                      ? "border-primary/40 bg-white/5 text-primary"
                      : "border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setFilter("unread")}
                  className={`relative rounded-xl border px-4 py-2 transition-all ${
                    filter === "unread"
                      ? "border-primary/40 bg-white/5 text-primary"
                      : "border-white/10 bg-white/5 text-white/80 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  Непрочитанные
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-error text-white text-xs px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10"
                >
                  Отметить все как прочитанные
                </button>
              )}
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-12 text-white-soft">
              <p className="text-xl mb-2">Нет уведомлений</p>
              <p className="text-sm">
                Здесь будут появляться важные обновления
              </p>
            </div>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {notifications.map((notification) => {
                const link = getNotificationLink(notification);
                const { Icon, className: iconClassName } =
                  getNotificationIconMeta(notification.type);

                const card = (
                  <article
                    className={`rounded-xl border p-4 transition-all ${
                      notification.isRead
                        ? "border-white/10 bg-body/30"
                        : "border-primary/35 bg-white/5 backdrop-blur-sm"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5"
                        aria-hidden
                      >
                        <Icon {...iconProps} className={iconClassName} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h3 className="mb-1 font-semibold leading-snug">
                              {notification.title}
                            </h3>
                            <p className="mb-2 whitespace-pre-line text-sm leading-relaxed text-white">
                              {notification.message
                                .trim()
                                .replace(/\n{3,}/g, "\n\n")}
                            </p>
                            <p className="text-xs text-white-soft">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {!notification.isRead && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleMarkAsRead(notification.id);
                                }}
                                className="rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white/80 backdrop-blur-md transition-all hover:border-primary/35 hover:text-primary"
                                title="Отметить как прочитанное"
                              >
                                Прочитано
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete(notification.id);
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded border border-white/10 bg-white/5 text-white/70 transition-all hover:border-danger/50 hover:text-danger"
                              title="Удалить"
                              aria-label="Удалить уведомление"
                            >
                              <X {...iconProps} size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );

                if (link) {
                  return (
                    <li key={notification.id} className="m-0 p-0">
                      <Link to={link} className="block no-underline">
                        {card}
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={notification.id} className="m-0 p-0">
                    {card}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default Notifications;
