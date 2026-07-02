const db = require("../../models");
const { getOrCreateDirectChat, postSystemMessage } = require("../chat/chat.service");

const Dispute = db.dispute;
const Order = db.order;
const Application = db.application;

async function resolveOrderExecuterId(orderId) {
  const approved = await Application.findOne({
    where: { orderId, status: "approved" },
    order: [["createdAt", "DESC"]],
  });
  if (approved) return approved.userId;

  const anyApplication = await Application.findOne({
    where: { orderId },
    order: [["createdAt", "DESC"]],
  });
  return anyApplication ? anyApplication.userId : null;
}

async function openDispute(initiatorId, body) {
  const { orderId, reason } = body;
  if (!orderId || !reason?.trim()) {
    const err = new Error("orderId и reason обязательны");
    err.statusCode = 400;
    throw err;
  }

  const order = await Order.findByPk(orderId);
  if (!order) {
    const err = new Error("Заказ не найден");
    err.statusCode = 404;
    throw err;
  }

  const executerId = await resolveOrderExecuterId(orderId);
  if (initiatorId !== order.customerId && (!executerId || initiatorId !== executerId)) {
    const err = new Error("Только участник заказа может открыть спор");
    err.statusCode = 403;
    throw err;
  }

  const existing = await Dispute.findOne({
    where: {
      orderId,
      status: ["open", "in_review"],
    },
    order: [["createdAt", "DESC"]],
  });
  if (existing) {
    const err = new Error("По этому заказу уже открыт спор");
    err.statusCode = 409;
    throw err;
  }

  const dispute = await Dispute.create({
    orderId,
    reason: reason.trim(),
    initiatorId,
    customerId: order.customerId,
    executerId,
    status: "open",
  });

  await order.update({ status: "dispute" });

  if (executerId) {
    const chat = await getOrCreateDirectChat(order.customerId, executerId);
    if (chat) {
      await postSystemMessage(
        chat.id,
        `Открыт спор по заказу #${order.id}. Причина: ${reason.trim()}`
      );
    }
  }

  return dispute;
}

module.exports = {
  openDispute,
};
