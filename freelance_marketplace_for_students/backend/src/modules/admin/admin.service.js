const db = require("../../models");
const User = db.user;
const Report = db.report;
const Resume = db.resume;
const Dispute = db.dispute;
const Order = db.order;
const { getOrCreateDirectChat, postSystemMessage } = require("../chat/chat.service");

async function assertManagerOrAdministrator(userId) {
  const actor = await User.findByPk(userId, {
    include: [{ model: db.role, as: "roles", through: { attributes: [] } }],
  });
  if (!actor) {
    const err = new Error("Пользователь не найден");
    err.statusCode = 404;
    throw err;
  }
  const actorRoles = actor.roles.map((r) => r.name);
  if (!actorRoles.includes("administrator") && !actorRoles.includes("manager")) {
    const err = new Error("Только менеджеры и администраторы могут выполнять это действие");
    err.statusCode = 403;
    throw err;
  }
  return actor;
}

async function blockUser(adminUserId, targetUserId, reason) {
  await assertManagerOrAdministrator(adminUserId);

  const user = await User.findByPk(targetUserId);
  if (!user) {
    const err = new Error("Пользователь не найден");
    err.statusCode = 404;
    throw err;
  }

  await user.update({
    isBlocked: true,
    blockReason: reason || "Заблокирован модератором",
    blockedAt: new Date(),
  });
  return user;
}

async function unblockUser(adminUserId, targetUserId) {
  await assertManagerOrAdministrator(adminUserId);

  const user = await User.findByPk(targetUserId);
  if (!user) {
    const err = new Error("Пользователь не найден");
    err.statusCode = 404;
    throw err;
  }

  await user.update({ isBlocked: false, blockReason: null, blockedAt: null });
  return user;
}

async function getAllUsers(adminUserId) {
  await assertManagerOrAdministrator(adminUserId);

  return User.findAll({
    include: [{ model: db.role, as: "roles", through: { attributes: [] } }],
    attributes: ["id", "username", "email", "isBlocked", "blockReason", "blockedAt", "createdAt"],
  });
}

async function getAllReports(actorUserId) {
  await assertManagerOrAdministrator(actorUserId);
  return Report.findAll({
    include: [{ model: User, as: "reporter", attributes: ["id", "username", "email"] }],
    order: [["createdAt", "DESC"]],
  });
}

async function moderateResume(actorUserId, resumeId, payload) {
  await assertManagerOrAdministrator(actorUserId);
  const resume = await Resume.findByPk(resumeId);
  if (!resume) {
    const err = new Error("Резюме не найдено");
    err.statusCode = 404;
    throw err;
  }

  const { action, title, description, aboutMe } = payload || {};
  const patch = {};
  if (title) patch.title = title;
  if (description) patch.description = description;
  if (aboutMe) patch.aboutMe = aboutMe;
  if (action === "approve") patch.isApproved = true;
  if (action === "reject") patch.isActive = false;

  await resume.update(patch);
  return resume;
}

async function resolveDispute(actorUserId, disputeId, payload) {
  await assertManagerOrAdministrator(actorUserId);
  const dispute = await Dispute.findByPk(disputeId);
  if (!dispute) {
    const err = new Error("Спор не найден");
    err.statusCode = 404;
    throw err;
  }

  const { payoutTo, comment } = payload || {};
  const allowed = ["customer", "executer", "split", "refund"];
  if (!allowed.includes(payoutTo)) {
    const err = new Error("payoutTo должен быть customer/executer/split/refund");
    err.statusCode = 400;
    throw err;
  }

  await dispute.update({
    status: "resolved",
    resolution:
      payoutTo === "customer"
        ? "customer_wins"
        : payoutTo === "executer"
        ? "executer_wins"
        : payoutTo,
    resolutionComment: comment || null,
    resolvedByManagerId: actorUserId,
  });

  if (dispute.orderId) {
    const order = await Order.findByPk(dispute.orderId);
    if (order) {
      await order.update({ status: "closed" });
    }
  }

  if (dispute.customerId && dispute.executerId) {
    const chat = await getOrCreateDirectChat(dispute.customerId, dispute.executerId);
    if (chat) {
      await postSystemMessage(
        chat.id,
        `Спор #${dispute.id} разрешен менеджером. Решение: ${payoutTo}.`
      );
    }
  }

  return dispute;
}

module.exports = {
  blockUser,
  unblockUser,
  getAllUsers,
  getAllReports,
  moderateResume,
  resolveDispute,
};
