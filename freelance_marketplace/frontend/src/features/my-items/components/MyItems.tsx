import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { CircleCheck } from "lucide-react";
import OrderService from "../../../services/order.service";
import ServiceService from "../../../services/service.service";
import AuthService from "../../../services/auth.service";
import { appDialog } from "../../../components/ui/app-dialog";
import {
  firstAttachmentImageUrl,
  formatOrderStatusShortLabel,
  getOrderStatusBadgeClass,
  getServiceStatusBadgeClass,
  BADGE_APPROVED_CLASS,
} from "../../../utils/display-utils";

const MyItems: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"orders" | "services">("orders");

  const currentUser = AuthService.getCurrentUser() as { roles?: string[] } | null;
  const userRoles = currentUser?.roles || [];
  const hasCustomerRole = userRoles.some((r: string) => r.toUpperCase().includes("CUSTOMER"));
  const hasExecuterRole = userRoles.some((r: string) => r.toUpperCase().includes("EXECUTER"));

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const userId = (currentUser as any)?.id;
      if (hasCustomerRole && activeTab === "orders" && userId) {
        const res = await OrderService.getMyOrders();
        setOrders(res.data ?? []);
      }
      if (hasExecuterRole && activeTab === "services" && userId) {
        const res = await ServiceService.getServices();
        setServices(res.data.filter((s: any) => s.executer?.id === userId));
      }
    }
    catch (error) {
      console.error("Ошибка загрузки данных:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!(await appDialog.confirm("Вы уверены, что хотите удалить этот заказ?", { danger: true })))
      return;
    try {
      await OrderService.deleteOrder(id);
      await loadData();
    } catch (error) {
      console.error("Ошибка удаления заказа:", error);
    }
  };

  const handleDeleteService = async (id: number) => {
    if (!(await appDialog.confirm("Вы уверены, что хотите удалить эту услугу?", { danger: true })))
      return;
    try {
      await ServiceService.deleteService(id);
      await loadData();
    } catch (error) {
      console.error("Ошибка удаления услуги:", error);
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

  return (
    <section className="min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto text-white">
        <div className="panel-surface p-6 md:p-8 backdrop-blur-xl mb-8">
          <h1 className="text-3xl font-semibold mb-6">Мои заказы и услуги</h1>

          <div className="flex gap-4">
            {hasCustomerRole && (
              <button
                onClick={() => setActiveTab("orders")}
                className={`px-4 py-2 rounded border transition-colors ${activeTab === "orders"
                    ? "border-primary/40 bg-white/5 text-primary"
                    : "border-white/15 bg-transparent text-white hover:border-primary/35 hover:text-primary"
                  }`}
              >
                Мои заказы
              </button>
            )}
            {hasExecuterRole && (
              <button
                onClick={() => setActiveTab("services")}
                className={`px-4 py-2 rounded border transition-colors ${activeTab === "services"
                    ? "border-primary/40 bg-white/10 text-primary"
                    : "border-white/15 bg-transparent text-white hover:border-primary/35 hover:text-primary"
                  }`}
              >
                Мои услуги
              </button>
            )}
          </div>
        </div>

        {activeTab === "orders" && hasCustomerRole && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.length === 0 ? (
              <div className="col-span-full panel-surface p-6 backdrop-blur-xl">
                <p className="text-white-soft text-center">У вас нет заказов</p>
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order.id}
                  className="panel-surface p-6 backdrop-blur-xl"
                >
                  <h3 className="text-xl font-semibold mb-2">{order.title}</h3>
                  <p className="text-white text-sm mb-4 line-clamp-3">{order.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={getOrderStatusBadgeClass(order.status)}>
                      {formatOrderStatusShortLabel(order.status)}
                    </span>
                    {order.moderatorTrustBadge === true && order.status !== "hidden" && (
                      <span className={`${BADGE_APPROVED_CLASS} text-[11px]`}>
                        <CircleCheck className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} />
                        Одобрено менеджером
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link
                      to={`/orders/${order.id}`}
                      className="flex-1 rounded border border-white/10 bg-white/5 px-4 py-2 text-center text-sm text-white backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10"
                    >
                      Открыть
                    </Link>
                    <Link
                      to={`/orders/${order.id}/edit`}
                      className="rounded border border-white/10 bg-transparent px-4 py-2 text-sm transition-colors hover:bg-white/10"
                    >
                      Редактировать
                    </Link>
                    <button
                      onClick={() => handleDeleteOrder(order.id)}
                      className="rounded border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-md transition-all hover:border-danger/50 hover:text-danger"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "services" && hasExecuterRole && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.length === 0 ? (
              <div className="col-span-full panel-surface p-6 backdrop-blur-xl">
                <p className="text-white-soft text-center">У вас нет услуг</p>
              </div>
            ) : (
              services.map((service) => (
                <div
                  key={service.id}
                  className="panel-surface p-6 backdrop-blur-xl"
                >
                  {(() => {
                    const cover = firstAttachmentImageUrl(service.attachments);
                    return cover ? (
                      <div className="mb-4 aspect-video w-full overflow-hidden rounded-xl border border-white/10">
                        <img
                          src={cover}
                          alt=""
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : null;
                  })()}
                  <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                  <p className="text-white text-sm mb-4 line-clamp-3">{service.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={getServiceStatusBadgeClass(service.status)}>
                      {service.status === "active" ? "Активна" : "Неактивна"}
                    </span>
                    {service.isApproved === true && (
                      <span className={`${BADGE_APPROVED_CLASS} text-[11px]`}>
                        <CircleCheck className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} />
                        Одобрено менеджером
                      </span>
                    )}
                  </div>
                  {service.price && (
                    <p className="mb-4 font-semibold text-primary">{service.price} BYN</p>
                  )}
                  <div className="flex gap-2 mt-4">
                    <Link
                      to={`/services/${service.id}`}
                      className="flex-1 rounded border border-white/10 bg-white/5 px-4 py-2 text-center text-sm text-white backdrop-blur-md transition-all hover:border-white/20 hover:bg-white/10"
                    >
                      Открыть
                    </Link>
                    <Link
                      to={`/services/${service.id}/edit`}
                      className="rounded border border-white/10 bg-transparent px-4 py-2 text-sm transition-colors hover:bg-white/10"
                    >
                      Редактировать
                    </Link>
                    <button
                      onClick={() => handleDeleteService(service.id)}
                      className="rounded border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 backdrop-blur-md transition-all hover:border-danger/50 hover:text-danger"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default MyItems;

