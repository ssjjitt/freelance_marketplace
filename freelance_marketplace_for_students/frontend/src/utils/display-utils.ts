/** Подпись статуса заказа для карточек каталога (полностью на русском). */
export function formatOrderStatusCatalogLabel(status: string): string {
  const map: Record<string, string> = {
    open: "Заказ открыт",
    in_progress: "Заказ в работе",
    completed: "Заказ завершён",
    cancelled: "Заказ отменён",
    dispute: "Спор по заказу",
    hidden: "Заказ скрыт",
    closed: "Заказ закрыт",
  };
  return map[status] ?? `Заказ (${status})`;
}

/** Короткая подпись статуса заказа (страница заказа, «Мои заказы»). */
export function formatOrderStatusShortLabel(status: string): string {
  const map: Record<string, string> = {
    open: "Открыт",
    in_progress: "В работе",
    completed: "Завершён",
    cancelled: "Отменён",
    dispute: "Спор",
    hidden: "Скрыт",
    closed: "Закрыт",
  };
  return map[status] ?? status;
}

/** Класс бейджа статуса заказа (адаптирован под светлую и тёмную тему). */
export function getOrderStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    open: "badge badge-open",
    in_progress: "badge badge-info",
    completed: "badge badge-success",
    cancelled: "badge badge-neutral",
    dispute: "badge badge-warning",
    hidden: "badge badge-danger",
    closed: "badge badge-neutral",
  };
  return map[status] ?? "badge badge-neutral";
}

/** Класс бейджа статуса услуги. */
export function getServiceStatusBadgeClass(status: string): string {
  return status === "active" ? "badge badge-success" : "badge badge-neutral";
}

export const BADGE_APPROVED_CLASS = "badge badge-approved";

/**
 * Safely display user information with proper fallback
 */
export const displayUserInfo = (
  username?: string | null,
  userId?: number | null
): string => {
  if (username && username.trim()) {
    return username;
  }
  if (userId) {
    return `Пользователь #${userId}`;
  }
  return "Неизвестный пользователь";
};

/**
 * Safely display role in user-friendly format
 */
export const displayRole = (role?: string | null): string => {
  if (!role) return "Администратор";
  
  const roleMap: { [key: string]: string } = {
    executer: "Исполнитель",
    customer: "Заказчик",
    manager: "Менеджер",
    administrator: "Администратор",
  };
  
  return roleMap[role.toLowerCase()] || "Администратор";
};

export type AttachmentLike = {
  url?: string;
  mimeType?: string | null;
  originalName?: string;
};

/** URL первого вложения-картинки (для превью в карточках). */
export function firstAttachmentImageUrl(
  attachments: AttachmentLike[] | null | undefined
): string | null {
  if (!Array.isArray(attachments)) return null;
  for (const a of attachments) {
    if (!a?.url) continue;
    const mime = (a.mimeType || "").toLowerCase();
    const name = (a.originalName || "").toLowerCase();
    if (mime.startsWith("image/") || /\.(jpe?g|png|gif|webp|bmp|svg)$/i.test(name)) {
      return a.url;
    }
  }
  return null;
}
