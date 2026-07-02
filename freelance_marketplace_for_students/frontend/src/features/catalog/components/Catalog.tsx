import React, { useState, useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import OrderService from "../../../services/order.service";
import ServiceService from "../../../services/service.service";
import CategoryService from "../../../services/category.service";
import ProfileService from "../../../services/profile.service";
import AuthService from "../../../services/auth.service";
import SortDropdown from "../../../components/ui/SortDropdown";
import SelectDropdown from "../../../components/ui/SelectDropdown";
import {
  ArrowDownUp,
  ChevronDown,
  Search,
  CircleCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  firstAttachmentImageUrl,
  formatOrderStatusCatalogLabel,
  getOrderStatusBadgeClass,
  BADGE_APPROVED_CLASS,
} from "../../../utils/display-utils";

interface Category {
  id: number;
  name: string;
  description?: string;
  parentId?: number | null;
}

interface Order {
  id: number;
  title: string;
  description: string;
  budget?: number;
  deadline?: string;
  status: string;
  category?: Category;
  customer?: { id: number; username: string; email: string };
  moderatorTrustBadge?: boolean;
  attachments?: {
    id: number;
    url: string;
    mimeType?: string | null;
    originalName?: string;
  }[];
}

interface Service {
  id: number;
  title: string;
  description: string;
  price?: number;
  status: string;
  category?: Category;
  executer?: { id: number; username: string; email: string };
  isApproved?: boolean;
  attachments?: {
    id: number;
    url: string;
    mimeType?: string | null;
    originalName?: string;
  }[];
}

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  avatar: string | null;
  roles: string[];
  skills: string[];
  location: string | null;
}

const Catalog: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    searchParams.get("categoryId")
      ? Number(searchParams.get("categoryId"))
      : null
  );
  const [viewType, setViewType] = useState<
    "all" | "orders" | "services" | "users"
  >("all");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [debouncedMinPrice, setDebouncedMinPrice] = useState(minPrice);
  const [debouncedMaxPrice, setDebouncedMaxPrice] = useState(maxPrice);
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "date");
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("sortOrder") || "DESC"
  );
  const [orderStatus, setOrderStatus] = useState(
    searchParams.get("orderStatus") || "all"
  );

  const [showFilters, setShowFilters] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  const currentUser = AuthService.getCurrentUser() as {
    roles?: string[];
  } | null;
  const userRoles = currentUser?.roles || [];
  const hasCustomerRole = userRoles.some((r: string) =>
    r.toUpperCase().includes("CUSTOMER")
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setDebouncedMinPrice(minPrice);
      setDebouncedMaxPrice(maxPrice);
    }, 800);
    return () => clearTimeout(handler);
  }, [search, minPrice, maxPrice]);

  useEffect(() => {
    const params: any = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (selectedCategory) params.categoryId = selectedCategory.toString();
    if (debouncedMinPrice) params.minPrice = debouncedMinPrice;
    if (debouncedMaxPrice) params.maxPrice = debouncedMaxPrice;
    if (sortBy !== "date") params.sortBy = sortBy;
    if (sortOrder !== "DESC") params.sortOrder = sortOrder;
    if (orderStatus !== "all") params.orderStatus = orderStatus;

    setSearchParams(params);
  }, [
    debouncedSearch,
    selectedCategory,
    debouncedMinPrice,
    debouncedMaxPrice,
    sortBy,
    sortOrder,
    orderStatus,
  ]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const categoriesRes = await CategoryService.getCategories();
        if (!cancelled) setCategories(categoriesRes.data);
      } catch (error) {
        if (!cancelled) console.error("Ошибка загрузки категорий:", error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const queryParams = {
          categoryId: selectedCategory || undefined,
          search: debouncedSearch || undefined,
          minPrice: debouncedMinPrice ? Number(debouncedMinPrice) : undefined,
          maxPrice: debouncedMaxPrice ? Number(debouncedMaxPrice) : undefined,
          sortBy: sortBy === "date" ? undefined : sortBy,
          sortOrder,
          status: orderStatus !== "all" ? orderStatus : undefined,
          catalogOnly: true,
        };

        const promises: Promise<any>[] = [
          OrderService.getOrders(queryParams).catch((err) => {
            console.error("Ошибка загрузки заказов:", err);
            return { data: [] };
          }),
          ServiceService.getServices(queryParams).catch((err) => {
            console.error("Ошибка загрузки услуг:", err);
            return { data: [] };
          }),
        ];

        // Загружаем пользователей всегда если viewType === "users", или если есть поисковый запрос
        let shouldLoadUsers = false;
        if (viewType === "users" || debouncedSearch.trim().length >= 1) {
          shouldLoadUsers = true;
          promises.push(
            ProfileService.searchUsers(debouncedSearch).catch((err) => {
              console.error("Ошибка загрузки пользователей:", err);
              return { data: [] };
            })
          );
        }

        const results = await Promise.all(promises);
        const ordersRes = results[0];
        const servicesRes = results[1];

        if (shouldLoadUsers && results.length > 2) {
          const usersRes = results[2];
          setUsers(usersRes.data || []);
        } else {
          setUsers([]);
        }

        if (viewType === "all" || viewType === "orders") {
          const raw = ordersRes.data || [];
          setOrders(raw.filter((o: Order) => o.status !== "hidden"));
        } else {
          setOrders([]);
        }

        if (viewType === "all" || viewType === "services") {
          setServices(servicesRes.data || []);
        } else {
          setServices([]);
        }
      } catch (error) {
        console.error("Ошибка загрузки данных:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [
    debouncedSearch,
    selectedCategory,
    viewType,
    debouncedMinPrice,
    debouncedMaxPrice,
    sortBy,
    sortOrder,
    orderStatus,
  ]);

  const groupedCategories = useMemo(() => {
    const parents = categories.filter((cat) => !cat.parentId);
    return parents.map((parent) => ({
      ...parent,
      subcategories: categories.filter((cat) => cat.parentId === parent.id),
    }));
  }, [categories]);

  const toggleCategoryExpand = (id: number) => {
    setExpandedCategories((prev) =>
      prev.includes(id) ? prev.filter((catId) => catId !== id) : [...prev, id]
    );
  };

  const handleCategorySelect = (id: number | null) => {
    setSelectedCategory(id);
    if (id) {
      const category = categories.find((c) => c.id === id);
      if (category?.parentId) {
        setExpandedCategories((prev) => [
          ...new Set([...prev, category.parentId!]),
        ]);
      }
    }
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedCategory(null);
    setMinPrice("");
    setMaxPrice("");
    setSortBy("date");
    setSortOrder("DESC");
    setOrderStatus("all");
  };

  const activeFiltersCount = [
    selectedCategory,
    debouncedMinPrice,
    debouncedMaxPrice,
    sortBy !== "date",
    orderStatus !== "all",
  ].filter(Boolean).length;

  if (loading && categories.length === 0) {
    return (
      <section className="catalog-container flex min-h-[40vh] items-center justify-center">
        <div className="panel-surface p-8 text-center text-white">
          <p>Загрузка каталога...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="catalog-container">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside
            className={`lg:w-64 flex-shrink-0 space-y-6 ${
              showFilters ? "block" : "hidden lg:block"
            }`}
          >
            <div className="panel-surface p-5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Категории</h3>
                {selectedCategory && (
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className="text-xs text-primary-hover hover:underline"
                  >
                    Сбросить
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full rounded px-3 py-2 text-left text-sm font-medium transition-colors ${
                    selectedCategory === null
                      ? "border border-primary/40 bg-surface text-white"
                      : "text-white hover:bg-white/5 hover:text-white"
                  }`}
                >
                  Все категории
                </button>
                {groupedCategories.map((parent) => (
                  <div key={parent.id} className="space-y-1">
                    <div className="flex items-center">
                      <button
                        onClick={() => handleCategorySelect(parent.id)}
                        className={`flex-1 truncate rounded px-3 py-2 text-left text-sm font-medium transition-colors ${
                          selectedCategory === parent.id
                            ? "border border-primary/40 bg-surface text-white"
                            : "text-white hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        {parent.name}
                      </button>
                      {parent.subcategories.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleCategoryExpand(parent.id);
                          }}
                          className="rounded p-2 text-white-soft transition-colors hover:text-white"
                        >
                          <ChevronDown
                            strokeWidth={1.5}
                            size={16}
                            className={`transition-transform ${
                              expandedCategories.includes(parent.id)
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {expandedCategories.includes(parent.id) &&
                      parent.subcategories.length > 0 && (
                        <div className="pl-4 space-y-1 border-l border-white/10 ml-3">
                          {parent.subcategories.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => handleCategorySelect(sub.id)}
                              className={`w-full truncate rounded px-3 py-1.5 text-left text-sm transition-colors ${
                                selectedCategory === sub.id
                                  ? "border border-primary/40 bg-white/5 font-medium text-primary"
                                  : "text-white-soft hover:bg-white/5 hover:text-white"
                              }`}
                            >
                              {sub.name}
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            </div>

            <div className="panel-surface p-5">
              <h3 className="font-semibold text-white mb-4">Цена (BYN)</h3>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="number"
                    placeholder="От"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="ui-input text-sm"
                  />
                </div>
                <span className="text-white-soft">-</span>
                <div className="relative flex-1">
                  <input
                    type="number"
                    placeholder="До"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="ui-input text-sm"
                  />
                </div>
              </div>
            </div>

            {hasCustomerRole && (
              <div className="panel-surface p-5">
                <h3 className="font-semibold text-white mb-4">Статус заказов</h3>
                <SelectDropdown
                  value={orderStatus}
                  onChange={setOrderStatus}
                  options={[
                    { value: "all", label: "Все статусы" },
                    { value: "open", label: "Открыт" },
                    { value: "in_progress", label: "В работе" },
                    { value: "completed", label: "Завершен" },
                    { value: "cancelled", label: "Отменен" },
                    { value: "dispute", label: "Спор" },
                    { value: "closed", label: "Закрыт" },
                  ]}
                  placeholder="Выберите статус"
                />
              </div>
            )}
          </aside>

          <div className="flex-1">
            <div className="panel-surface mb-6 flex flex-col items-start justify-between gap-4 p-4 md:flex-row md:items-center">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setViewType("all")}
                  className={`catalog-switch-btn ${
                    viewType === "all"
                      ? "border-white/20 bg-white/10 text-white"
                      : "catalog-switch-inactive"
                  }`}
                >
                  Все
                </button>
                <button
                  onClick={() => setViewType("orders")}
                  className={`catalog-switch-btn ${
                    viewType === "orders"
                      ? "border-primary/40 bg-white/5 text-primary"
                      : "catalog-switch-inactive hover:border-primary/35 hover:text-primary"
                  }`}
                >
                  Заказы
                </button>
                <button
                  onClick={() => setViewType("services")}
                  className={`catalog-switch-btn ${
                    viewType === "services"
                      ? "border-primary/40 bg-white/5 text-primary"
                      : "catalog-switch-inactive hover:border-primary/35 hover:text-primary"
                  }`}
                >
                  Услуги
                </button>
                <button
                  onClick={() => setViewType("users")}
                  className={`catalog-switch-btn ${
                    viewType === "users"
                      ? "border-primary/40 bg-white/5 text-primary"
                      : "catalog-switch-inactive hover:border-primary/35 hover:text-primary"
                  }`}
                >
                  Пользователи
                </button>
              </div>

              <div className="flex flex-1 w-full md:w-auto gap-3">
                <div className="relative flex-1 md:max-w-xs">
                  <input
                    type="text"
                    placeholder="Поиск..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="catalog-input w-full pr-10"
                  />
                  <Search
                    strokeWidth={1.5}
                    size={18}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white-soft"
                  />
                </div>

                <div className="flex gap-2">
                  <SortDropdown
                    value={sortBy}
                    onChange={setSortBy}
                    options={[
                      { value: "date", label: "По дате" },
                      { value: "price", label: "По цене" },
                      { value: "title", label: "По названию" },
                    ]}
                    className="w-full md:w-48"
                  />

                  <button
                    onClick={() =>
                      setSortOrder((prev) => (prev === "ASC" ? "DESC" : "ASC"))
                    }
                    className="rounded border border-white/10 bg-transparent px-3 py-2 text-white transition-colors hover:border-primary"
                    title={
                      sortOrder === "ASC" ? "По возрастанию" : "По убыванию"
                    }
                  >
                    <ArrowDownUp
                      strokeWidth={1.5}
                      size={18}
                      className={`transition-transform ${
                        sortOrder === "DESC" ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              <button
                className="flex w-full items-center justify-center gap-2 rounded border border-white/10 bg-surface px-4 py-2 text-white md:w-auto lg:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal strokeWidth={1.5} size={18} />
                Фильтры{" "}
                {activeFiltersCount > 0 && (
                  <span className="rounded border border-primary/35 bg-white/5 px-2 py-0.5 text-xs text-primary">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
            </div>

            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedCategory && (
                  <span className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/90 backdrop-blur-md">
                    Категория:{" "}
                    {categories.find((c) => c.id === selectedCategory)?.name}
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(null)}
                      className="rounded p-0.5 hover:bg-white/10 hover:text-primary"
                      aria-label="Сбросить категорию"
                    >
                      <X strokeWidth={1.5} size={14} />
                    </button>
                  </span>
                )}
                {(debouncedMinPrice || debouncedMaxPrice) && (
                  <span className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/90 backdrop-blur-md">
                    Цена: {debouncedMinPrice || "0"} -{" "}
                    {debouncedMaxPrice || "∞"}
                    <button
                      type="button"
                      onClick={() => {
                        setMinPrice("");
                        setMaxPrice("");
                      }}
                      className="rounded p-0.5 hover:bg-white/10 hover:text-primary"
                      aria-label="Сбросить цену"
                    >
                      <X strokeWidth={1.5} size={14} />
                    </button>
                  </span>
                )}
                {orderStatus !== "all" && (
                  <span className="flex items-center gap-2 rounded border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/90 backdrop-blur-md">
                    Статус:{" "}
                    {orderStatus === "open"
                      ? "Открыт"
                      : orderStatus === "in_progress"
                      ? "В работе"
                      : orderStatus === "completed"
                      ? "Завершен"
                      : orderStatus === "cancelled"
                      ? "Отменен"
                      : orderStatus === "dispute"
                      ? "Спор"
                      : orderStatus === "hidden"
                      ? "Скрыт"
                      : orderStatus === "closed"
                      ? "Закрыт"
                      : orderStatus}
                    <button
                      type="button"
                      onClick={() => setOrderStatus("all")}
                      className="rounded p-0.5 hover:bg-white/10 hover:text-primary"
                      aria-label="Сбросить статус"
                    >
                      <X strokeWidth={1.5} size={14} />
                    </button>
                  </span>
                )}
                <button
                  onClick={resetFilters}
                  className="text-sm text-white-soft hover:text-white underline decoration-dotted"
                >
                  Сбросить все
                </button>
              </div>
            )}

            {users.length > 0 && (viewType === "users" || debouncedSearch) && (
              <div className="mb-8">
                {(viewType === "users" || debouncedSearch) && (
                  <h2 className="text-xl font-bold text-white mb-4 pl-1">
                    {debouncedSearch ? "Найденные пользователи" : "Пользователи"}
                  </h2>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {users.map((user) => (
                    <Link
                      key={user.id}
                      to={`/profile/${user.id}`}
                      className="catalog-card catalog-card--user interactive flex items-center gap-4 group p-4"
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.fullName}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 font-bold text-primary backdrop-blur-md">
                          {user.fullName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className="font-medium text-white transition-colors group-hover:text-primary">
                          {user.fullName}
                        </h3>
                        <p className="text-sm text-white-soft">
                          @{user.username}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {(viewType === "all" || viewType === "orders") &&
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="catalog-card group interactive"
                  >
                    <div className="catalog-card-body">
                      {(() => {
                        const cover = firstAttachmentImageUrl(order.attachments);
                        return cover ? (
                          <div className="mb-3 aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
                            <img
                              src={cover}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                          </div>
                        ) : null;
                      })()}
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                          <span
                            className={`shrink-0 ${getOrderStatusBadgeClass(order.status)}`}
                          >
                            {formatOrderStatusCatalogLabel(order.status)}
                          </span>
                        </div>
                        {order.budget && (
                          <span className="catalog-price mb-0 shrink-0 text-right text-base sm:text-lg">
                            {order.budget} BYN
                          </span>
                        )}
                      </div>

                      <h3 className="catalog-card-title text-white transition-colors group-hover:text-primary">
                        {order.title}
                      </h3>

                      <p className="catalog-card-desc">{order.description}</p>

                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        {order.category && (
                          <span className="catalog-tag">{order.category.name}</span>
                        )}
                        {order.moderatorTrustBadge === true && (
                          <span className={`${BADGE_APPROVED_CLASS} text-[11px] leading-tight`}>
                            <CircleCheck className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} />
                            Одобрено менеджером
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/orders/${order.id}`}
                        className="catalog-button w-full shrink-0"
                      >
                        Подробнее
                      </Link>
                    </div>
                  </div>
                ))}

              {(viewType === "all" || viewType === "services") &&
                services.map((service) => (
                  <div
                    key={service.id}
                    className="catalog-card group interactive"
                  >
                    <div className="catalog-card-body">
                      {(() => {
                        const cover = firstAttachmentImageUrl(service.attachments);
                        return cover ? (
                          <div className="mb-3 aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
                            <img
                              src={cover}
                              alt=""
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                              loading="lazy"
                            />
                          </div>
                        ) : null;
                      })()}
                      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-1 flex-wrap gap-2">
                          <span className="shrink-0 rounded-lg border border-primary/35 bg-transparent px-2.5 py-1 text-xs font-medium text-primary">
                            Услуга
                          </span>
                        </div>
                        {service.price && (
                          <span className="catalog-price mb-0 shrink-0 text-right text-base sm:text-lg">
                            {service.price} BYN
                          </span>
                        )}
                      </div>

                      <h3 className="catalog-card-title text-white transition-colors group-hover:text-primary">
                        {service.title}
                      </h3>

                      <p className="catalog-card-desc">{service.description}</p>

                      <div className="mb-4 flex flex-wrap items-center gap-2">
                        {service.category && (
                          <span className="catalog-tag">{service.category.name}</span>
                        )}
                        {service.isApproved === true && (
                          <span className={`${BADGE_APPROVED_CLASS} text-[11px] leading-tight`}>
                            <CircleCheck className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} />
                            Одобрено менеджером
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/services/${service.id}`}
                        className="catalog-button w-full shrink-0"
                      >
                        Подробнее
                      </Link>
                    </div>
                  </div>
                ))}
            </div>

            {users.length === 0 &&
              orders.length === 0 &&
              services.length === 0 &&
              viewType !== "users" && (
                <div className="catalog-empty flex flex-col items-center justify-center py-20">
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-body">
                    <Search
                      strokeWidth={1.5}
                      size={32}
                      className="text-white-soft"
                    />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Ничего не найдено
                  </h3>
                  <p className="text-white-soft max-w-md mb-6">
                    Попробуйте изменить параметры поиска или сбросить фильтры
                  </p>
                  <button
                    onClick={resetFilters}
                    className="ui-btn-primary px-6"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Catalog;
