import type { APIRequestContext } from "@playwright/test";
import { DEFAULT_PASSWORD, USERS } from "./credentials.js";

const API_BASE = process.env.API_URL || "http://localhost:8080";

export async function signIn(
  request: APIRequestContext,
  username: string,
  password: string = DEFAULT_PASSWORD
): Promise<string> {
  const res = await request.post(`${API_BASE}/auth/signin`, {
    data: { username, password },
  });
  if (!res.ok()) {
    throw new Error(`signin failed (${res.status()}): ${await res.text()}`);
  }
  const body = (await res.json()) as { accessToken?: string };
  if (!body.accessToken) {
    throw new Error("signin: no accessToken in response");
  }
  return body.accessToken;
}

/** Открытый заказ заказчика для сценария отклика исполнителя. */
export async function createOpenOrder(
  request: APIRequestContext,
  title: string,
  description?: string,
  budget = 500,
  categoryId = 6
): Promise<{ id: number; title: string }> {
  const token = await signIn(request, USERS.customer.username, USERS.customer.password);
  const res = await request.post(`${API_BASE}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      title,
      description:
        description ??
        "Заказ размещён заказчиком для поиска исполнителя на платформе.",
      budget,
      categoryId,
    },
  });
  if (!res.ok()) {
    throw new Error(`create order failed (${res.status()}): ${await res.text()}`);
  }
  const order = (await res.json()) as { id: number; title: string };
  return { id: order.id, title };
}

/** Отклик исполнителя на заказ (подготовка сценария одобрения). */
export async function createOrderApplication(
  request: APIRequestContext,
  orderId: number,
  message = "E2E: готов приступить после одобрения.",
  proposedPrice = 490
): Promise<{ id: number }> {
  const token = await signIn(
    request,
    USERS.executer.username,
    USERS.executer.password
  );
  const res = await request.post(`${API_BASE}/applications`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      orderId,
      message,
      proposedPrice,
    },
  });
  if (!res.ok()) {
    throw new Error(
      `create application failed (${res.status()}): ${await res.text()}`
    );
  }
  const app = (await res.json()) as { id: number };
  return { id: app.id };
}

export async function getAuthUserId(
  request: APIRequestContext,
  username: string,
  password: string = DEFAULT_PASSWORD
): Promise<number> {
  const token = await signIn(request, username, password);
  const res = await request.get(`${API_BASE}/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`profile failed (${res.status()}): ${await res.text()}`);
  }
  const body = (await res.json()) as { id: number };
  return body.id;
}

export async function approveApplication(
  request: APIRequestContext,
  applicationId: number
): Promise<void> {
  const token = await signIn(request, USERS.customer.username, USERS.customer.password);
  const res = await request.put(`${API_BASE}/applications/${applicationId}/approve`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`approve application failed (${res.status()}): ${await res.text()}`);
  }
}

export async function rejectApplication(
  request: APIRequestContext,
  applicationId: number
): Promise<void> {
  const token = await signIn(request, USERS.customer.username, USERS.customer.password);
  const res = await request.put(`${API_BASE}/applications/${applicationId}/reject`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`reject application failed (${res.status()}): ${await res.text()}`);
  }
}

export async function createService(
  request: APIRequestContext,
  title: string,
  description?: string,
  price = 800
): Promise<{ id: number; title: string }> {
  const token = await signIn(
    request,
    USERS.executer.username,
    USERS.executer.password
  );
  const res = await request.post(`${API_BASE}/services`, {
    headers: { Authorization: `Bearer ${token}` },
    data: {
      title,
      description:
        description ??
        "Услуга размещена исполнителем для демонстрации каталога и откликов.",
      price,
      categoryId: 6,
    },
  });
  if (!res.ok()) {
    throw new Error(`create service failed (${res.status()}): ${await res.text()}`);
  }
  const service = (await res.json()) as { id: number; title: string };
  return { id: service.id, title };
}

/** Публичный GET услуги — после удаления ожидается 404. */
export async function getServiceStatus(
  request: APIRequestContext,
  serviceId: number
): Promise<number> {
  const res = await request.get(`${API_BASE}/services/${serviceId}`);
  return res.status();
}

function pickCatalogOrder(list: { id: number; title: string }[], token?: string) {
  const clean = list.filter((o) => !JUNK_ORDER_TITLE.test(o.title));
  if (token) {
    const byToken = clean.find((o) =>
      o.title.toLowerCase().includes(token.toLowerCase())
    );
    if (byToken) return byToken;
  }
  return clean[0] ?? null;
}

function pickCatalogService(list: { id: number; title: string }[], token?: string) {
  const clean = list.filter((o) => !/E2E |\(\d{2}\.\d{2},/i.test(o.title));
  if (token) {
    const byToken = clean.find((o) =>
      o.title.toLowerCase().includes(token.toLowerCase())
    );
    if (byToken) return byToken;
  }
  return clean[0] ?? null;
}

/** Заказ из каталога: по токену или первый «чистый» без E2E/Бодрость. */
export async function findCatalogOrder(
  request: APIRequestContext,
  ...searchTokens: string[]
): Promise<{ id: number; title: string }> {
  for (const token of searchTokens) {
    const res = await request.get(
      `${API_BASE}/orders?catalogOnly=true&search=${encodeURIComponent(token)}`
    );
    if (!res.ok()) continue;
    const hit = pickCatalogOrder((await res.json()) as { id: number; title: string }[], token);
    if (hit) return hit;
  }

  const all = await request.get(`${API_BASE}/orders?catalogOnly=true`);
  if (!all.ok()) {
    throw new Error(`catalog orders failed (${all.status()})`);
  }
  const hit = pickCatalogOrder((await all.json()) as { id: number; title: string }[]);
  if (!hit) {
    throw new Error("no suitable catalog order (import data.sql or run cleanup)");
  }
  return hit;
}

/** Услуга из каталога: по токену или первая «чистая». */
export async function findCatalogService(
  request: APIRequestContext,
  ...searchTokens: string[]
): Promise<{ id: number; title: string }> {
  for (const token of searchTokens) {
    const res = await request.get(
      `${API_BASE}/services?catalogOnly=true&search=${encodeURIComponent(token)}`
    );
    if (!res.ok()) continue;
    const hit = pickCatalogService((await res.json()) as { id: number; title: string }[], token);
    if (hit) return hit;
  }

  const all = await request.get(`${API_BASE}/services?catalogOnly=true`);
  if (!all.ok()) {
    throw new Error(`catalog services failed (${all.status()})`);
  }
  const hit = pickCatalogService((await all.json()) as { id: number; title: string }[]);
  if (!hit) {
    throw new Error("no suitable catalog service (import data.sql or run cleanup)");
  }
  return hit;
}

export async function createSupportTicket(
  request: APIRequestContext,
  subject: string,
  description: string
): Promise<{ id: number }> {
  const token = await signIn(request, USERS.customer.username, USERS.customer.password);
  const res = await request.post(`${API_BASE}/manager/tickets`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { subject, description, category: "other" },
  });
  if (!res.ok()) {
    throw new Error(`create ticket failed (${res.status()}): ${await res.text()}`);
  }
  const ticket = (await res.json()) as { id: number };
  return { id: ticket.id };
}

export async function createCategoryAsAdmin(
  request: APIRequestContext,
  name: string,
  description?: string
): Promise<number> {
  const token = await signIn(request, USERS.admin.username, USERS.admin.password);
  const res = await request.post(`${API_BASE}/categories`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { name, description },
  });
  if (!res.ok()) {
    throw new Error(`create category failed (${res.status()}): ${await res.text()}`);
  }
  const body = (await res.json()) as { id: number };
  return body.id;
}

export async function createSubcategoryAsAdmin(
  request: APIRequestContext,
  parentId: number,
  name: string,
  description?: string
): Promise<number> {
  const token = await signIn(request, USERS.admin.username, USERS.admin.password);
  const res = await request.post(`${API_BASE}/categories/subcategory`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { parentId, name, description },
  });
  if (!res.ok()) {
    throw new Error(`create subcategory failed (${res.status()}): ${await res.text()}`);
  }
  const body = (await res.json()) as { id: number };
  return body.id;
}

export async function updateTicketStatus(
  request: APIRequestContext,
  ticketId: number,
  status: string
): Promise<void> {
  const token = await signIn(request, USERS.manager.username, USERS.manager.password);
  const res = await request.patch(`${API_BASE}/manager/tickets/${ticketId}/status`, {
    headers: { Authorization: `Bearer ${token}` },
    data: { status },
  });
  if (!res.ok()) {
    throw new Error(`update ticket failed (${res.status()}): ${await res.text()}`);
  }
}

const JUNK_ORDER_TITLE =
  /Бодрость|\(\d{2}\.\d{2},|E2E |— правка$|Заказ для проверки жалобы|Проверка жалобы|Заказ для отзыва|Заказ на удаление|Временный заказ|Вёрстка лендинга под ключ \(|Веб-разработчик — React/i;

const JUNK_CATEGORY_NAME = /^E2E |\(31\.|\(\d{2}\.\d{2},/;

type CategoryRow = { id: number; name: string; parentId?: number | null };

/** Удаляет накопившиеся заказы/категории от старых прогонов E2E (перед demo). */
export async function cleanupDemoArtifacts(
  request: APIRequestContext
): Promise<void> {
  const customerToken = await signIn(
    request,
    USERS.customer.username,
    USERS.customer.password
  );
  const mineRes = await request.get(`${API_BASE}/orders/mine`, {
    headers: { Authorization: `Bearer ${customerToken}` },
  });
  if (mineRes.ok()) {
    const orders = (await mineRes.json()) as { id: number; title: string }[];
    for (const order of orders) {
      if (!JUNK_ORDER_TITLE.test(order.title)) continue;
      await request.delete(`${API_BASE}/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${customerToken}` },
      });
    }
  }

  const adminToken = await signIn(request, USERS.admin.username, USERS.admin.password);
  const catRes = await request.get(`${API_BASE}/categories`);
  if (catRes.ok()) {
    const categories = (await catRes.json()) as CategoryRow[];
    const junk = categories.filter((c) => JUNK_CATEGORY_NAME.test(c.name));
    for (const cat of junk) {
      await request.delete(`${API_BASE}/categories/${cat.id}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
    }
  }
}

export async function findCategoryIdByName(
  request: APIRequestContext,
  name: string
): Promise<number> {
  const res = await request.get(`${API_BASE}/categories`);
  if (!res.ok()) {
    throw new Error(`categories list failed (${res.status()})`);
  }
  const categories = (await res.json()) as CategoryRow[];
  const hit = categories.find((c) => c.name === name);
  if (!hit) {
    throw new Error(`category not found: ${name}`);
  }
  return hit.id;
}

export async function deleteCategoryAsAdmin(
  request: APIRequestContext,
  categoryId: number
): Promise<void> {
  const token = await signIn(request, USERS.admin.username, USERS.admin.password);
  const res = await request.delete(`${API_BASE}/categories/${categoryId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) {
    throw new Error(`delete category failed (${res.status()}): ${await res.text()}`);
  }
}
