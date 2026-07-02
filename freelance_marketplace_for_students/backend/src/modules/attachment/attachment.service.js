const fs = require("fs");
const path = require("path");
const db = require("../../models");
const config = require("../../config");

const Order = db.order;
const Service = db.service;
const Attachment = db.attachment;

/**
 * Полный публичный URL файла: API_PUBLIC_URL (или config.apiPublicUrl) + /uploads/ + storedPath.
 * Для корректных картинок на фронте задайте API_PUBLIC_URL (например http://localhost:8080).
 */
function publicFileUrl(storedPath) {
  const base = String(process.env.API_PUBLIC_URL || config.apiPublicUrl || "")
    .trim()
    .replace(/\/+$/, "");
  const rel = String(storedPath || "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
  if (!rel) return base || "";
  const pathEncoded = rel
    .split("/")
    .map((seg) => encodeURIComponent(seg))
    .join("/");
  if (!base) {
    return `/uploads/${pathEncoded}`;
  }
  return `${base}/uploads/${pathEncoded}`;
}

function mapAttachmentsWithUrl(attachments) {
  if (!attachments?.length) return [];
  return attachments.map((item) => {
    const plain = item && typeof item.get === "function" ? item.get({ plain: true }) : { ...item };
    return {
      ...plain,
      url: publicFileUrl(plain.storedPath),
    };
  });
}

function mapRow(row) {
  const plain = row.get ? row.get({ plain: true }) : row;
  return {
    id: plain.id,
    orderId: plain.orderId,
    serviceId: plain.serviceId,
    storedPath: plain.storedPath,
    originalName: plain.originalName,
    mimeType: plain.mimeType,
    size: plain.size,
    url: publicFileUrl(plain.storedPath),
    createdAt: plain.createdAt,
  };
}

async function saveOrderFilesFromMulter(userId, orderId, files) {
  if (!files || !files.length) {
    const err = new Error("Нет файлов для загрузки");
    err.statusCode = 400;
    throw err;
  }
  const order = await Order.findByPk(orderId);
  if (!order) {
    const err = new Error("Заказ не найден");
    err.statusCode = 404;
    throw err;
  }
  if (order.customerId !== userId) {
    const err = new Error("Можно прикреплять файлы только к своим заказам");
    err.statusCode = 403;
    throw err;
  }

  const created = [];
  for (const file of files) {
    const relative = path.join("orders", String(orderId), file.filename).replace(/\\/g, "/");
    const row = await Attachment.create({
      orderId,
      serviceId: null,
      storedPath: relative,
      originalName: file.originalname || file.filename,
      mimeType: file.mimetype || null,
      size: file.size || null,
    });
    created.push(row);
  }
  return created.map(mapRow);
}

async function listOrderFiles(orderId) {
  const order = await Order.findByPk(orderId);
  if (!order) {
    const err = new Error("Заказ не найден");
    err.statusCode = 404;
    throw err;
  }
  const rows = await Attachment.findAll({
    where: { orderId, serviceId: null },
    order: [["createdAt", "ASC"]],
  });
  return rows.map(mapRow);
}

async function saveServiceFilesFromMulter(userId, serviceId, files) {
  if (!files || !files.length) {
    const err = new Error("Нет файлов для загрузки");
    err.statusCode = 400;
    throw err;
  }
  const service = await Service.findByPk(serviceId);
  if (!service) {
    const err = new Error("Услуга не найдена");
    err.statusCode = 404;
    throw err;
  }
  if (service.executerId !== userId) {
    const err = new Error("Можно прикреплять файлы только к своим услугам");
    err.statusCode = 403;
    throw err;
  }

  const created = [];
  for (const file of files) {
    const relative = path.join("services", String(serviceId), file.filename).replace(/\\/g, "/");
    const row = await Attachment.create({
      orderId: null,
      serviceId,
      storedPath: relative,
      originalName: file.originalname || file.filename,
      mimeType: file.mimetype || null,
      size: file.size || null,
    });
    created.push(row);
  }
  return created.map(mapRow);
}

async function listServiceFiles(serviceId) {
  const service = await Service.findByPk(serviceId);
  if (!service) {
    const err = new Error("Услуга не найдена");
    err.statusCode = 404;
    throw err;
  }
  const rows = await Attachment.findAll({
    where: { serviceId, orderId: null },
    order: [["createdAt", "ASC"]],
  });
  return rows.map(mapRow);
}

module.exports = {
  saveOrderFilesFromMulter,
  listOrderFiles,
  saveServiceFilesFromMulter,
  listServiceFiles,
  async deleteAttachmentById(userId, attachmentId) {
    const row = await Attachment.findByPk(attachmentId);
    if (!row) {
      const err = new Error("Вложение не найдено");
      err.statusCode = 404;
      throw err;
    }

    if (row.orderId) {
      const order = await Order.findByPk(row.orderId);
      if (!order || order.customerId !== userId) {
        const err = new Error("Можно удалять вложения только из своих заказов");
        err.statusCode = 403;
        throw err;
      }
    } else if (row.serviceId) {
      const service = await Service.findByPk(row.serviceId);
      if (!service || service.executerId !== userId) {
        const err = new Error("Можно удалять вложения только из своих услуг");
        err.statusCode = 403;
        throw err;
      }
    } else {
      const err = new Error("Невалидное вложение");
      err.statusCode = 400;
      throw err;
    }

    const filePath = path.join(config.uploadsRoot, String(row.storedPath || ""));
    await row.destroy();

    fs.promises.unlink(filePath).catch(() => {
      /* Файл мог быть удален ранее — не критично. */
    });
  },
  publicFileUrl,
  mapAttachmentsWithUrl,
};
