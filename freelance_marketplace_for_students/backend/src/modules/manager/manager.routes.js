const controller = require("./manager.controller");
const { authJwt } = require("../../common/middleware");

module.exports = function registerManagerRoutes(app) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // ===== TICKETS =====
  app.post("/manager/tickets", [authJwt.getUserFromToken], controller.createTicket);
  app.get("/manager/tickets", [authJwt.getUserFromToken], controller.getTickets);
  app.get("/manager/tickets/:ticketId", [authJwt.getUserFromToken], controller.getTicketById);
  app.patch("/manager/tickets/:ticketId/status", [authJwt.getUserFromToken], controller.updateTicketStatus);
  app.patch("/manager/tickets/:ticketId/assign", [authJwt.getUserFromToken], controller.assignTicket);

  // ===== DISPUTES =====
  app.post("/manager/disputes", [authJwt.getUserFromToken], controller.createDispute);
  app.get("/manager/disputes", [authJwt.getUserFromToken], controller.getDisputes);
  app.patch("/manager/disputes/:disputeId/resolve", [authJwt.getUserFromToken], controller.resolveDispute);

  // ===== ORDERS =====
  app.get("/manager/orders", [authJwt.getUserFromToken], controller.getOrders);
  app.get("/manager/orders/:orderId", [authJwt.getUserFromToken], controller.getOrder);
  app.patch("/manager/orders/:orderId/hide", [authJwt.getUserFromToken], controller.hideOrder);
  app.patch("/manager/orders/:orderId/close", [authJwt.getUserFromToken], controller.closeOrder);
  app.patch("/manager/orders/:orderId/unhide", [authJwt.getUserFromToken], controller.unhideOrder);
  app.patch("/manager/orders/:orderId/reopen", [authJwt.getUserFromToken], controller.reopenOrder);
  app.patch("/manager/orders/:orderId/trust-badge", [authJwt.getUserFromToken], controller.grantOrderTrustBadge);

  // ===== SERVICES (moderation) =====
  app.get("/manager/services", [authJwt.getUserFromToken], controller.getServices);
  app.get("/manager/services/:serviceId", [authJwt.getUserFromToken], controller.getServiceById);
  app.patch("/manager/services/:serviceId/hide", [authJwt.getUserFromToken], controller.hideService);
  app.patch("/manager/services/:serviceId/unhide", [authJwt.getUserFromToken], controller.unhideService);
  app.patch("/manager/services/:serviceId/close", [authJwt.getUserFromToken], controller.closeService);

  // ===== USERS =====
  app.get("/manager/users", [authJwt.getUserFromToken], controller.getUsersForModeration);
  app.get("/manager/users/search", [authJwt.getUserFromToken], controller.findUserForModerationByUsername);
  app.get("/manager/users/:userId", [authJwt.getUserFromToken], controller.getUserForModeration);
  app.patch("/manager/users/:userId/block", [authJwt.getUserFromToken], controller.blockUser);
  app.patch("/manager/users/:userId/unblock", [authJwt.getUserFromToken], controller.unblockUser);

  // ===== STATISTICS =====
  app.get("/manager/stats", [authJwt.getUserFromToken], controller.getManagerStats);
};
