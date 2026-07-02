const controller = require("./service.controller");
const { authJwt } = require("../../common/middleware");

module.exports = function registerServiceRoutes(app) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.post("/services", [authJwt.getUserFromToken], controller.createService);
  app.get("/services", controller.getServices);
  app.get("/services/:id", controller.getServiceById);
  app.put("/services/:id", [authJwt.getUserFromToken], controller.updateService);
  app.delete("/services/:id", [authJwt.getUserFromToken], controller.deleteService);
  app.get("/services/:id/stats", [authJwt.getUserFromToken], controller.getServiceStats);
};
