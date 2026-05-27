const db = require("../../models");

const Report = db.report;
const User = db.user;
const Order = db.order;
const Service = db.service;
const Ticket = db.ticket;

async function assertTargetExists(targetType, targetId) {
  if (targetType === "user") {
    return User.findByPk(targetId);
  }
  if (targetType === "order") {
    return Order.findByPk(targetId);
  }
  if (targetType === "service") {
    return Service.findByPk(targetId);
  }
  return null;
}

async function createReport(reporterId, body) {
  const { targetId, targetType, reason } = body;

  if (!targetId || !targetType || !reason?.trim()) {
    const err = new Error("targetId, targetType и reason обязательны");
    err.statusCode = 400;
    throw err;
  }

  const validTypes = ["user", "order", "service"];
  if (!validTypes.includes(targetType)) {
    const err = new Error("Недопустимый targetType");
    err.statusCode = 400;
    throw err;
  }

  if (targetType === "user" && Number(targetId) === Number(reporterId)) {
    const err = new Error("Нельзя пожаловаться на самого себя");
    err.statusCode = 400;
    throw err;
  }

  const target = await assertTargetExists(targetType, targetId);
  if (!target) {
    const err = new Error("Цель жалобы не найдена");
    err.statusCode = 404;
    throw err;
  }

  const report = await Report.create({
    reporterId,
    targetId,
    targetType,
    reason: reason.trim(),
    status: "pending",
  });

  await Ticket.create({
    userId: reporterId,
    subject: `Жалоба на ${targetType} #${targetId}`,
    description: `Поступила жалоба.\nТип цели: ${targetType}\nID цели: ${targetId}\nПричина: ${reason.trim()}`,
    category: "abuse",
    priority: "medium",
    status: "open",
  });

  return report;
}

module.exports = {
  createReport,
};
