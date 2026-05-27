import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Briefcase,
  CheckCircle2,
  Plus,
  Search,
  CircleCheck,
  X,
} from "lucide-react";
import { useHomeDashboard } from "../../../hooks/home.hook";
import SelectDropdown  from "../../../components/ui/SelectDropdown";
import { firstAttachmentImageUrl } from "../../../utils/display-utils";
const PLACEHOLDER_FREELANCER_NAMES = [
  "Александр В.",
  "Мария К.",
  "Дмитрий С.",
  "Елена М.",
  "Иван П.",
  "Ольга Р.",
];

function looksLikeEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function formatB2BDisplayName(fullName: string, index: number): string {
  const t = fullName.trim();
  if (!t) {
    return PLACEHOLDER_FREELANCER_NAMES[index % PLACEHOLDER_FREELANCER_NAMES.length];
  }
  if (looksLikeEmail(t)) {
    return PLACEHOLDER_FREELANCER_NAMES[index % PLACEHOLDER_FREELANCER_NAMES.length];
  }
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0];
    const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
    return `${first} ${lastInitial}.`;
  }
  return t;
}

function initialsFromDisplayName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }
  return (name.slice(0, 2) || "?").toUpperCase();
}

const Home: React.FC = () => {
  const {
    hasCustomerRole,
    hasExecuterRole,
    isAdmin,
    animatedStats,
    popularCategories,
    newCategories,
    allCategories,
    recentOrders,
    recentServices,
    bestFreelancers,
    bestCustomers,
    activityFeed,
    loading,
    searchQuery,
    setSearchQuery,
    monthlyStats,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    selectedStatType,
    setSelectedStatType,
    pendingResumes,
    newCategoryName,
    setNewCategoryName,
    newCategoryDesc,
    setNewCategoryDesc,
    notificationTitle,
    setNotificationTitle,
    notificationMessage,
    setNotificationMessage,
    subcategoryParentId,
    setSubcategoryParentId,
    subcategoryName,
    setSubcategoryName,
    subcategoryDesc,
    setSubcategoryDesc,
    adminMessage,
    setAdminMessage,
    handleSearch,
    formatPrice,
    formatDate,
    formatTimeAgo,
    handleCreateCategory,
    handleCreateSubcategory,
    handleApproveResume,
    handleSendNotificationToAll,
    getMaxCount,
  } = useHomeDashboard();

  if (loading) {
    return (
      <div className="relative isolate min-h-screen bg-transparent font-sans text-white">
        <section className="relative z-10 min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-xl border border-white/10 bg-surface p-6 py-20 text-center backdrop-blur-xl md:p-8">
              <p className="text-white">Загрузка...</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="relative isolate min-h-screen bg-transparent font-sans text-white">
      <section className="relative z-10 min-h-screen pt-28 pb-14 px-4 sm:px-6 lg:px-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {isAdmin && (
          <>
            {animatedStats && (
              <div className="form-panel">
                <h2 className="text-2xl font-semibold mb-6 text-center">
                  Статистика платформы
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="group rounded-xl border border-white/10 bg-surface p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-primary/40">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-primary/10">
                      <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {animatedStats.totalUsers}
                    </div>
                    <div className="text-sm text-white font-medium">
                      Пользователей
                    </div>
                  </div>
                  <div className="group rounded-xl border border-white/10 bg-surface p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-primary/40">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-primary/10">
                      <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {animatedStats.totalOrders}
                    </div>
                    <div className="text-sm text-white font-medium">
                      Заказов
                    </div>
                  </div>
                  <div className="group rounded-xl border border-white/10 bg-surface p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-primary/40">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-primary/10">
                      <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {animatedStats.totalServices}
                    </div>
                    <div className="text-sm text-white font-medium">
                      Услуг
                    </div>
                  </div>
                  <div className="group rounded-xl border border-white/10 bg-surface p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-primary/40">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-primary/10">
                      <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {animatedStats.activeOrders}
                    </div>
                    <div className="text-sm text-white font-medium">
                      Активных заказов
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="form-panel">
              <h2 className="text-2xl font-semibold mb-6">
                Статистика за месяц
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Тип статистики
                  </label>
                  <SelectDropdown
                    value={selectedStatType}
                    onChange={setSelectedStatType}
                    options={[
                      { value: "orders", label: "Заказы" },
                      { value: "services", label: "Услуги" },
                      { value: "completed", label: "Выполненные заказы" },
                      { value: "registrations", label: "Новые регистрации" }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Месяц
                  </label>
                  <SelectDropdown
                    value={selectedMonth.toString()}
                    onChange={(value) => setSelectedMonth(Number(value))}
                    options={[
                      { value: "1", label: "Январь" },
                      { value: "2", label: "Февраль" },
                      { value: "3", label: "Март" },
                      { value: "4", label: "Апрель" },
                      { value: "5", label: "Май" },
                      { value: "6", label: "Июнь" },
                      { value: "7", label: "Июль" },
                      { value: "8", label: "Август" },
                      { value: "9", label: "Сентябрь" },
                      { value: "10", label: "Октябрь" },
                      { value: "11", label: "Ноябрь" },
                      { value: "12", label: "Декабрь" }
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Год</label>
                  <input
                    type="number"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="ui-input"
                    min="2020"
                    max={new Date().getFullYear()}
                  />
                </div>
              </div>

              <div className="panel-surface p-6">
                <div className="grid grid-cols-7 gap-2 mb-4">
                  {["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-semibold text-white-soft py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                {monthlyStats.length === 0 ? (
                  <div className="text-center py-8 text-white-soft">
                    Загрузка данных...
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-7 gap-2">
                      {(() => {
                        const firstDay = new Date(
                          selectedYear,
                          selectedMonth - 1,
                          1
                        );
                        const firstDayOfWeek =
                          firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;
                        const daysInMonth = new Date(
                          selectedYear,
                          selectedMonth,
                          0
                        ).getDate();
                        const cells = [];

                        const statsMap = new Map();
                        monthlyStats.forEach((stat) => {
                          statsMap.set(stat.day, stat.count);
                        });

                        for (let i = 0; i < firstDayOfWeek; i++) {
                          cells.push(
                            <div key={`empty-${i}`} className="h-36"></div>
                          );
                        }

                        const maxCount = getMaxCount();

                        for (let day = 1; day <= daysInMonth; day++) {
                          const count = statsMap.get(day) || 0;
                          const heightPercent =
                            maxCount > 0 ? (count / maxCount) * 100 : 0;
                          const hasData = count > 0;

                          cells.push(
                            <div
                              key={day}
                              className={`relative flex flex-col items-center justify-between group h-36 p-1 ${
                                hasData
                                  ? "rounded-xl border-2 border-primary/40 bg-white/5"
                                  : "border border-white/10 rounded"
                              }`}
                            >
                              <div className="w-full flex flex-col items-center justify-end flex-1 mb-2 min-h-[80px]">
                                {hasData && (
                                  <div
                                    className="w-full cursor-pointer rounded-t-xl border border-primary/45 bg-gradient-to-t from-primary/55 via-primary/35 to-primary/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] transition-all duration-300 hover:from-primary/70 hover:via-primary/45 hover:to-primary/30 hover:border-primary/60"
                                    style={{
                                      height: `${Math.max(heightPercent, 10)}%`,
                                      minHeight: "12px",
                                      maxHeight: "100%",
                                    }}
                                    title={`${day} число: ${count} ${
                                      selectedStatType === "orders"
                                        ? "заказов"
                                        : selectedStatType === "services"
                                        ? "услуг"
                                        : selectedStatType === "completed"
                                        ? "выполнено"
                                        : "регистраций"
                                    }`}
                                  ></div>
                                )}
                              </div>
                              <div className="flex flex-col items-center w-full">
                                <div
                                  className={`text-sm font-bold ${
                                    hasData ? "text-white" : "text-white-soft"
                                  }`}
                                >
                                  {day}
                                </div>
                                {hasData && (
                                  <div className="text-xs font-bold text-primary mt-0.5">
                                    {count}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }

                        return cells;
                      })()}
                    </div>
                    <div className="mt-4 text-center text-sm text-white-soft">
                      Максимум: {getMaxCount()}{" "}
                      {selectedStatType === "orders"
                        ? "заказов"
                        : selectedStatType === "services"
                        ? "услуг"
                        : selectedStatType === "completed"
                        ? "выполнено"
                        : "регистраций"}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="form-panel">
              <h2 className="text-2xl font-semibold mb-6">Быстрые действия</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="panel-surface p-5">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Plus
                      strokeWidth={1.5}
                      size={20}
                      className="text-primary"
                    />
                    Создать категорию
                  </h3>
                  <form onSubmit={handleCreateCategory} className="space-y-3">
                    <input
                      type="text"
                      placeholder="Название категории"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="ui-input"
                      required
                    />
                    <textarea
                      placeholder="Описание (необязательно)"
                      value={newCategoryDesc}
                      onChange={(e) => setNewCategoryDesc(e.target.value)}
                      className="ui-input min-h-[72px] resize-none"
                      rows={2}
                    />
                    <button
                      type="submit"
                      className="ui-btn-primary w-full"
                    >
                      Создать
                    </button>
                  </form>
                </div>

                <div className="panel-surface p-5">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <CheckCircle2
                      strokeWidth={1.5}
                      size={20}
                      className="text-primary"
                    />
                    Одобрить резюме
                  </h3>
                  {pendingResumes.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {pendingResumes.slice(0, 5).map((resume: any) => (
                        <div
                          key={resume.id}
                          className="flex items-center justify-between rounded-xl border border-white/10 bg-surface p-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {resume.title}
                            </p>
                            <p className="text-xs text-white-soft truncate">
                              {resume.executer?.username}
                            </p>
                          </div>
                          <button
                            onClick={() => handleApproveResume(resume.id)}
                            className="ui-btn-primary ml-2 px-3 py-1 text-xs"
                          >
                            Одобрить
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white-soft">
                      Нет резюме на одобрение
                    </p>
                  )}
                </div>

                <div className="panel-surface p-5">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Bell strokeWidth={1.5} size={20} className="text-primary" />
                    Уведомление всем
                  </h3>
                  <form
                    onSubmit={handleSendNotificationToAll}
                    className="space-y-3"
                  >
                    <input
                      type="text"
                      placeholder="Заголовок"
                      value={notificationTitle}
                      onChange={(e) => setNotificationTitle(e.target.value)}
                      className="ui-input"
                      required
                    />
                    <textarea
                      placeholder="Сообщение"
                      value={notificationMessage}
                      onChange={(e) => setNotificationMessage(e.target.value)}
                      className="ui-input min-h-[88px] resize-none"
                      rows={3}
                      required
                    />
                    <button
                      type="submit"
                      className="ui-btn-primary w-full"
                    >
                      Отправить
                    </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="form-panel mx-auto max-w-3xl">
              <h2 className="text-2xl font-semibold mb-6 text-center">
                Создать подкатегорию
              </h2>
              <form
                onSubmit={handleCreateSubcategory}
                className="max-w-2xl mx-auto space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Родительская категория
                  </label>
                  <SelectDropdown
                    value={subcategoryParentId ? subcategoryParentId.toString() : ""}
                    onChange={(val) => setSubcategoryParentId(val ? Number(val) : null)}
                    options={[
                      { value: "", label: "Выберите категорию" },
                      ...allCategories.map((cat) => ({
                        value: cat.id.toString(),
                        label: cat.name
                      }))
                    ]}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Название подкатегории
                  </label>
                  <input
                    type="text"
                    placeholder="Название подкатегории"
                    value={subcategoryName}
                    onChange={(e) => setSubcategoryName(e.target.value)}
                    className="ui-input py-2.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Описание (необязательно)
                  </label>
                  <textarea
                    placeholder="Описание подкатегории"
                    value={subcategoryDesc}
                    onChange={(e) => setSubcategoryDesc(e.target.value)}
                    className="ui-textarea py-2.5"
                    rows={4}
                  />
                </div>
                <div className="flex justify-center pt-2">
                  <button
                    type="submit"
                    className="ui-btn-primary px-8 py-2.5"
                  >
                    Создать подкатегорию
                  </button>
                </div>
              </form>
            </div>

            {adminMessage && (
              <div
                className={`rounded-xl p-4 ${
                  adminMessage.includes("успешн") ||
                  adminMessage.includes("отправлено")
                    ? "bg-success/20 text-success"
                    : "bg-error/20 text-error"
                }`}
              >
                {adminMessage}
                <button
                  type="button"
                  onClick={() => setAdminMessage("")}
                  className="ml-4 inline-flex align-middle text-white-soft hover:text-white"
                  aria-label="Закрыть"
                >
                  <X strokeWidth={1.5} size={18} />
                </button>
              </div>
            )}
          </>
        )}

        {!isAdmin && (
          <>
            <div className="px-4 pt-2 pb-2 text-center md:px-8">
              <h1 className="mb-3 text-3xl font-bold tracking-tight text-white md:text-4xl">
                Freelance Маркетплейс
              </h1>
              <p className="mx-auto max-w-2xl text-base leading-relaxed text-white-soft md:text-lg">
                Платформа для размещения и поиска фриланс-заказов — заказчики
                находят исполнителей, специалисты — новые проекты
              </p>
            </div>

            <div className="p-6 md:p-8">
              <form onSubmit={handleSearch} className="max-w-2xl mx-auto text-left">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Поиск заказов, услуг и пользователей..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-surface py-3 pl-11 pr-3 text-white placeholder:text-placeholder backdrop-blur-xl transition-colors focus:border-primary/50 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white-soft transition-colors hover:text-primary"
                  >
                    <Search strokeWidth={1.5} size={18} />
                  </button>
                </div>
              </form>
            </div>

            <div
              className={`grid gap-6 ${
                hasExecuterRole && hasCustomerRole
                  ? "grid-cols-1 md:grid-cols-2"
                  : "grid-cols-1 max-w-2xl mx-auto"
              }`}
            >
              {hasCustomerRole && (
                <Link
                  to="/orders/new"
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-surface p-8 backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:bg-surface md:p-10"
                >
                  <span
                    className="absolute bottom-6 left-0 top-6 w-px rounded-full bg-primary/40"
                    aria-hidden
                  />
                  <div className="relative z-10 pl-5 text-left">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-surface">
                      <Plus
                        strokeWidth={1.5}
                        size={20}
                        className="text-primary"
                      />
                    </div>
                    <h2 className="mb-2 text-2xl font-semibold tracking-tight text-white">
                      Разместить заказ
                    </h2>
                    <p className="mb-6 text-base leading-relaxed text-white-soft">
                      Опубликуйте свой заказ и найдите исполнителя
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-white transition-colors group-hover:text-white">
                      Создать заказ
                      <ArrowRight
                        strokeWidth={1.5}
                        size={16}
                        className="text-primary"
                      />
                    </span>
                  </div>
                </Link>
              )}

              {hasExecuterRole && (
                <Link
                  to="/services/new"
                  className="group relative overflow-hidden rounded-xl border border-white/10 bg-surface p-8 backdrop-blur-xl transition-all duration-300 hover:border-white/10 hover:bg-surface md:p-10"
                >
                  <span
                    className="absolute bottom-6 left-0 top-6 w-px rounded-full bg-primary/40"
                    aria-hidden
                  />
                  <div className="relative z-10 pl-5 text-left">
                    <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-surface">
                      <Briefcase
                        strokeWidth={1.5}
                        size={20}
                        className="text-primary"
                      />
                    </div>
                    <h2 className="mb-2 text-2xl font-semibold tracking-tight text-white">
                      Разместить услугу
                    </h2>
                    <p className="mb-6 text-base leading-relaxed text-white-soft">
                      Предложите свои услуги и найдите клиентов
                    </p>
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-white transition-colors group-hover:text-white">
                      Создать услугу
                      <ArrowRight
                        strokeWidth={1.5}
                        size={16}
                        className="text-primary"
                      />
                    </span>
                  </div>
                </Link>
              )}
            </div>

            {popularCategories.length > 0 && (
              <div className="form-panel">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">
                    Популярные категории
                  </h2>
                  <Link
                    to="/catalog"
                    className="text-primary hover:text-primary-hover transition-colors"
                  >
                    Все категории →
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {popularCategories.map((category) => {
                    const totalItems =
                      (category.orderCount || 0) + (category.serviceCount || 0);
                    return (
                      <Link
                        key={category.id}
                        to={`/catalog?categoryId=${category.id}`}
                        className="panel-surface interactive group relative block p-5 hover:scale-102 hover:border-primary/40 hover:bg-white/5"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 group-hover:border-primary/30 group-hover:bg-white/10 transition-colors">
                            <svg
                              className="w-5 h-5 text-primary"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                          </div>
                          <h3 className="font-bold text-lg flex-1 group-hover:text-primary transition-colors">
                            {category.name}
                          </h3>
                        </div>
                        {category.description && (
                          <p className="text-sm text-white mb-3 line-clamp-2 leading-relaxed">
                            {category.description}
                          </p>
                        )}
                        <div className="h-px bg-white/10 mb-3 group-hover:bg-primary/15 transition-colors"></div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-white-soft">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            <span>
                              {totalItems}{" "}
                              {totalItems === 1 ? "предложение" : "предложений"}
                            </span>
                          </div>
                        </div>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg
                            className="w-5 h-5 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {bestFreelancers.length > 0 && (
              <div className="form-panel">
                <h2 className="mb-6 text-left text-2xl font-semibold text-white">
                  Лучшие фрилансеры недели
                </h2>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {bestFreelancers.map((freelancer, idx) => {
                    const displayName = formatB2BDisplayName(
                      freelancer.fullName,
                      idx
                    );
                    const initials = initialsFromDisplayName(displayName);
                    return (
                    <Link
                      key={freelancer.id}
                      to={`/profile/${freelancer.id}`}
                      className="panel-surface interactive group relative block p-5 text-left hover:scale-102 hover:border-primary/30"
                    >
                      <div className="mb-4 flex items-center gap-4">
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-surface ring-1 ring-white/10"
                          aria-hidden
                        >
                          <span className="text-sm font-semibold tracking-tight text-white">
                            {initials}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="mb-1 truncate text-lg font-semibold text-white transition-colors group-hover:text-white">
                            {displayName}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm">
                            <span className="inline-flex items-center gap-1 font-medium text-primary">
                              <svg
                                className="h-4 w-4 shrink-0"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {freelancer.rating.toFixed(1)}
                            </span>
                            {(freelancer.completedOrdersThisWeek ?? 0) > 0 && (
                              <span className="text-white-soft">
                                • {freelancer.completedOrdersThisWeek} за неделю
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {(freelancer.totalCompleted ?? 0) > 0 && (
                        <>
                          <div className="mb-3 h-px bg-white/10 transition-colors group-hover:bg-primary/10" />
                          <div className="flex items-center gap-2 text-xs text-white-soft">
                            <svg
                              className="h-3.5 w-3.5 shrink-0 text-white-soft"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                            <span>
                              {freelancer.totalCompleted} завершенных проектов
                            </span>
                          </div>
                        </>
                      )}
                      <div className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100">
                        <svg
                          className="h-5 w-5 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                    </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {bestCustomers.length > 0 && (
              <div className="form-panel">
                <h2 className="text-2xl font-semibold mb-6">
                  Лучшие заказчики недели
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bestCustomers.map((customer) => (
                    <Link
                      key={customer.id}
                      to={`/profile/${customer.id}`}
                      className="panel-surface interactive group relative block p-5 hover:scale-102 hover:border-primary/40 hover:bg-white/5"
                    >
                      <div className="flex items-center gap-4 mb-4">
                        {customer.avatar ? (
                          <img
                            src={customer.avatar}
                            alt={customer.fullName}
                            className="w-16 h-16 rounded-full object-cover ring-2 ring-white/20 group-hover:ring-primary/40 transition-all"
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl font-bold text-primary ring-2 ring-white/20 transition-all group-hover:border-primary/35 group-hover:ring-primary/40">
                            {customer.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">
                            {customer.fullName}
                          </h3>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="inline-flex items-center gap-1 text-primary font-semibold">
                              <svg
                                className="w-4 h-4"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {customer.rating.toFixed(1)}
                            </span>
                            {(customer.ordersThisWeek ?? 0) > 0 && (
                              <span className="text-white-soft">
                                • {customer.ordersThisWeek} заказов за неделю
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {(customer.totalOrders ?? 0) > 0 && (
                        <>
                          <div className="h-px bg-white/10 mb-3 group-hover:bg-primary/15 transition-colors"></div>
                          <div className="flex items-center gap-2 text-xs text-white-soft">
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                              />
                            </svg>
                            <span>{customer.totalOrders} всего заказов</span>
                          </div>
                        </>
                      )}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg
                          className="w-5 h-5 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {hasExecuterRole && recentOrders.length > 0 && (
              <div className="form-panel">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Свежие заказы</h2>
                  <Link
                    to="/catalog?type=orders"
                    className="text-primary hover:text-primary-hover transition-colors"
                  >
                    Все заказы →
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentOrders.map((order) => (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="panel-surface interactive group relative block p-5 hover:scale-102 hover:border-primary/40 hover:bg-white/5"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-white/5 px-2.5 py-1 text-xs font-medium text-primary">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                          {order.category?.name || "Без категории"}
                        </span>
                      </div>

                      <h3 className="font-bold text-lg mb-3 line-clamp-2 text-white group-hover:text-primary transition-colors">
                        {order.title}
                      </h3>

                      <p className="text-sm text-white mb-4 line-clamp-3 leading-relaxed">
                        {order.description}
                      </p>

                      <div className="h-px bg-white/10 mb-4 group-hover:bg-primary/15 transition-colors"></div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-primary font-bold text-base">
                            {formatPrice(order.budget)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white-soft text-xs">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </div>

                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg
                          className="w-5 h-5 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {hasCustomerRole && recentServices.length > 0 && (
              <div className="form-panel">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Свежие услуги</h2>
                  <Link
                    to="/catalog?type=services"
                    className="text-primary hover:text-primary-hover transition-colors"
                  >
                    Все услуги →
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentServices.map((service) => (
                    <Link
                      key={service.id}
                      to={`/services/${service.id}`}
                      className="panel-surface interactive group relative block border-white/5 p-5 hover:scale-102 hover:border-primary/25"
                    >
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
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-white/5 px-2.5 py-1 text-xs font-medium text-primary backdrop-blur-sm">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                          {service.category?.name || "Без категории"}
                        </span>
                        {service.isApproved === true && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-[11px] font-medium text-emerald-200">
                            <CircleCheck className="h-3.5 w-3.5 shrink-0 opacity-90" strokeWidth={2} />
                            Одобрено менеджером
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-lg mb-3 line-clamp-2 text-white group-hover:text-primary-hover transition-colors">
                        {service.title}
                      </h3>

                      <p className="text-sm text-white mb-4 line-clamp-3 leading-relaxed">
                        {service.description}
                      </p>

                      <div className="mb-4 h-px bg-white/10 transition-colors group-hover:bg-primary/25"></div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg
                            className="h-4 w-4 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="text-primary font-bold text-base">
                            {formatPrice(service.price)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white-soft text-xs">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>{formatDate(service.createdAt)}</span>
                        </div>
                      </div>

                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg
                          className="w-5 h-5 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {newCategories.length > 0 && (
              <div className="form-panel">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold">Новые категории</h2>
                  <Link
                    to="/catalog"
                    className="text-primary hover:text-primary-hover transition-colors"
                  >
                    Все категории →
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {newCategories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/catalog?categoryId=${category.id}`}
                      className="panel-surface interactive group relative block p-5 hover:scale-102 hover:border-primary/40 hover:bg-white/5"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 group-hover:border-primary/30 group-hover:bg-white/10 transition-colors">
                          <svg
                            className="w-5 h-5 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                            />
                          </svg>
                        </div>
                        <h3 className="font-bold text-lg flex-1 group-hover:text-primary transition-colors">
                          {category.name}
                        </h3>
                      </div>
                      {category.description && (
                        <p className="text-sm text-white mb-3 line-clamp-2 leading-relaxed">
                          {category.description}
                        </p>
                      )}
                      <div className="h-px bg-white/10 mb-3 group-hover:bg-primary/15 transition-colors"></div>
                      <div className="flex items-center gap-1.5 text-xs text-white-soft">
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span>
                          Добавлена {formatDate(category.createdAt || "")}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg
                          className="w-5 h-5 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {animatedStats && (
              <div className="form-panel">
                <h2 className="text-2xl font-semibold mb-6 text-center">
                  Статистика платформы
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="group rounded-xl border border-white/10 bg-surface p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-primary/40">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-primary/10">
                      <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {animatedStats.totalUsers}
                    </div>
                    <div className="text-sm text-white font-medium">
                      Пользователей
                    </div>
                  </div>
                  <div className="group rounded-xl border border-white/10 bg-surface p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-primary/40">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-primary/10">
                      <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {animatedStats.totalOrders}
                    </div>
                    <div className="text-sm text-white font-medium">
                      Заказов
                    </div>
                  </div>
                  <div className="group rounded-xl border border-white/10 bg-surface p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-primary/40">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-primary/10">
                      <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {animatedStats.totalServices}
                    </div>
                    <div className="text-sm text-white font-medium">
                      Услуг
                    </div>
                  </div>
                  <div className="group rounded-xl border border-white/10 bg-surface p-6 text-center backdrop-blur-sm transition-all duration-300 hover:border-primary/40">
                    <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 transition-colors group-hover:bg-primary/10">
                      <svg
                        className="w-6 h-6 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div className="text-4xl font-bold text-primary mb-2">
                      {animatedStats.activeOrders}
                    </div>
                    <div className="text-sm text-white font-medium">
                      Активных заказов
                    </div>
                  </div>
                </div>
              </div>
            )}

            {allCategories.length > 0 && (
              <div className="form-panel">
                <h2 className="text-2xl font-semibold mb-6">Все категории</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allCategories.map((category) => (
                    <Link
                      key={category.id}
                      to={`/catalog?categoryId=${category.id}`}
                      className="panel-surface interactive group relative block p-5 text-center hover:scale-102 hover:border-primary/40"
                    >
                      <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-colors group-hover:border-primary/35 group-hover:bg-primary/10">
                        <svg
                          className="w-6 h-6 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                      </div>
                      <h3 className="font-bold text-base group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg
                          className="w-4 h-4 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="form-panel">
              <h2 className="text-2xl font-semibold mb-6 text-center">
                Как это работает
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-primary/35 bg-white/5 text-2xl font-bold text-primary">
                    1
                  </div>
                  <h3 className="font-semibold mb-2">Зарегистрируйся</h3>
                  <p className="text-sm text-white-soft">
                    Создай аккаунт и заполни профиль
                  </p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-primary/35 bg-white/5 text-2xl font-bold text-primary">
                    2
                  </div>
                  <h3 className="font-semibold mb-2">Найди услугу/заказ</h3>
                  <p className="text-sm text-white-soft">
                    Просматривай каталог и выбирай подходящие предложения
                  </p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-primary/35 bg-white/5 text-2xl font-bold text-primary">
                    3
                  </div>
                  <h3 className="font-semibold mb-2">Откликнись</h3>
                  <p className="text-sm text-white-soft">
                    Отправь заявку на интересующий заказ или услугу
                  </p>
                </div>
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-primary/35 bg-white/5 text-2xl font-bold text-primary">
                    4
                  </div>
                  <h3 className="font-semibold mb-2">Получи результат</h3>
                  <p className="text-sm text-white-soft">
                    Работай над проектом и получай оплату
                  </p>
                </div>
              </div>
            </div>

            {activityFeed.length > 0 && (
              <div className="form-panel">
                <h2 className="text-2xl font-semibold mb-6">
                  Лента активности
                </h2>
                <div className="space-y-4">
                  {activityFeed.map((activity, index) => (
                    <div
                      key={index}
                      className="panel-surface interactive group flex items-center gap-4 p-5 hover:border-primary/40 hover:bg-white/5"
                    >
                      {activity.userAvatar ? (
                        <img
                          src={activity.userAvatar}
                          alt={activity.username}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-white/20 group-hover:ring-primary/40 transition-all"
                        />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-lg font-bold text-primary ring-2 ring-white/20 transition-all group-hover:border-primary/35 group-hover:ring-primary/40">
                          {activity.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {activity.type === "order_taken" && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-white/5 px-2 py-0.5 text-xs font-medium text-primary">
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Взят
                            </span>
                          )}
                          {activity.type === "order_completed" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-success/20 text-success text-xs font-medium rounded-full border border-success/30">
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                              Завершен
                            </span>
                          )}
                        </div>
                        <p className="text-white font-medium group-hover:text-primary transition-colors">
                          {activity.message}
                        </p>
                        <div className="flex items-center gap-1.5 text-xs text-white-soft mt-2">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>{formatTimeAgo(activity.timestamp)}</span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg
                          className="w-5 h-5 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      </section>
    </div>
  );
};

export default Home;
