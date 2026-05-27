const controller = require("./order.controller");
const { authJwt } = require("../../common/middleware");

module.exports = function registerOrderRoutes(app) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.post("/orders", [authJwt.getUserFromToken], controller.createOrder);
  app.get("/orders/mine", [authJwt.getUserFromToken], controller.getMyOrders);
  app.get("/orders", controller.getOrders);
  app.get("/orders/:id", controller.getOrderById);
  app.put("/orders/:id", [authJwt.getUserFromToken], controller.updateOrder);
  app.delete("/orders/:id", [authJwt.getUserFromToken], controller.deleteOrder);
  app.get("/orders/:id/stats", [authJwt.getUserFromToken], controller.getOrderStats);
};
