const managerService = require("./manager.service");
const { asyncHandler } = require("../../common/middleware");

// ===== TICKETS =====

exports.createTicket = asyncHandler(async (req, res) => {
  const ticket = await managerService.createTicket(req.user.id, req.body);
  res.status(201).json(ticket);
});

exports.getTickets = asyncHandler(async (req, res) => {
  const tickets = await managerService.getTickets(req.user.id, req.query);
  res.json(tickets);
});

exports.getTicketById = asyncHandler(async (req, res) => {
  const ticket = await managerService.getTicketById(req.user.id, req.params.ticketId);
  res.json(ticket);
});

exports.updateTicketStatus = asyncHandler(async (req, res) => {
  const { status, assignToSelf } = req.body;
  const ticket = await managerService.updateTicketStatus(
    req.user.id,
    req.params.ticketId,
    status,
    assignToSelf
  );
  res.json(ticket);
});

exports.assignTicket = asyncHandler(async (req, res) => {
  const { newManagerId } = req.body;
  const ticket = await managerService.assignTicket(req.user.id, req.params.ticketId, newManagerId);
  res.json(ticket);
});

// ===== DISPUTES =====

exports.createDispute = asyncHandler(async (req, res) => {
  const dispute = await managerService.createDispute(req.user.id, req.body);
  res.status(201).json(dispute);
});

exports.getDisputes = asyncHandler(async (req, res) => {
  const disputes = await managerService.getDisputes(req.user.id, req.query);
  res.json(disputes);
});

exports.resolveDispute = asyncHandler(async (req, res) => {
  const { resolution, comment } = req.body;
  const dispute = await managerService.resolveDispute(
    req.user.id,
    req.params.disputeId,
    resolution,
    comment
  );
  res.json(dispute);
});

// ===== ORDERS =====

exports.getOrders = asyncHandler(async (req, res) => {
  const orders = await managerService.getOrders(req.user.id);
  res.json(orders);
});

exports.getOrder = asyncHandler(async (req, res) => {
  const order = await managerService.getOrder(req.user.id, req.params.orderId);
  res.json(order);
});

exports.hideOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await managerService.hideOrder(req.user.id, req.params.orderId, reason);
  res.json({ message: "Заказ скрыт", order });
});

exports.closeOrder = asyncHandler(async (req, res) => {
  const order = await managerService.closeOrder(req.user.id, req.params.orderId);
  res.json({ message: "Заказ закрыт", order });
});

exports.unhideOrder = asyncHandler(async (req, res) => {
  const order = await managerService.unhideOrder(req.user.id, req.params.orderId);
  res.json({ message: "Заказ снова отображается в каталоге", order });
});

exports.reopenOrder = asyncHandler(async (req, res) => {
  const order = await managerService.reopenOrder(req.user.id, req.params.orderId);
  res.json({ message: "Заказ открыт", order });
});

exports.grantOrderTrustBadge = asyncHandler(async (req, res) => {
  const order = await managerService.grantOrderTrustBadge(req.user.id, req.params.orderId);
  res.json({ message: "Заказ одобрен для каталога", order });
});

// ===== SERVICES (moderation) =====

exports.getServices = asyncHandler(async (req, res) => {
  const services = await managerService.getServices(req.user.id);
  res.json(services);
});

exports.getServiceById = asyncHandler(async (req, res) => {
  const service = await managerService.getServiceById(req.user.id, req.params.serviceId);
  res.json(service);
});

exports.hideService = asyncHandler(async (req, res) => {
  const service = await managerService.hideService(req.user.id, req.params.serviceId);
  res.json({ message: "Услуга скрыта", service });
});

exports.unhideService = asyncHandler(async (req, res) => {
  const service = await managerService.unhideService(req.user.id, req.params.serviceId);
  res.json({ message: "Услуга снова активна", service });
});

exports.closeService = asyncHandler(async (req, res) => {
  const service = await managerService.closeService(req.user.id, req.params.serviceId);
  res.json({ message: "Услуга закрыта", service });
});

// ===== USERS =====

exports.getUsersForModeration = asyncHandler(async (req, res) => {
  const users = await managerService.getUsersForModeration(req.user.id, req.query);
  res.json(users);
});

exports.getUserForModeration = asyncHandler(async (req, res) => {
  const user = await managerService.getUserForModeration(req.user.id, req.params.userId);
  res.json(user);
});

exports.findUserForModerationByUsername = asyncHandler(async (req, res) => {
  const user = await managerService.findUserForModerationByUsername(
    req.user.id,
    req.query.username
  );
  res.json(user);
});

exports.blockUser = asyncHandler(async (req, res) => {
  const user = await managerService.blockUser(req.user.id, req.params.userId);
  res.json({ message: "Пользователь заблокирован", user });
});

exports.unblockUser = asyncHandler(async (req, res) => {
  const user = await managerService.unblockUser(req.user.id, req.params.userId);
  res.json({ message: "Пользователь разблокирован", user });
});

// ===== STATISTICS =====

exports.getManagerStats = asyncHandler(async (req, res) => {
  const stats = await managerService.getManagerStats(req.user.id);
  res.json(stats);
});
