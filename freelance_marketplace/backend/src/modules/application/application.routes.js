const controller = require("./application.controller");
const { authJwt } = require("../../common/middleware");

module.exports = function registerApplicationRoutes(app) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.post("/applications", [authJwt.getUserFromToken], controller.createApplication);
  app.delete("/applications/:id", [authJwt.getUserFromToken], controller.cancelApplication);
  app.put("/applications/:id/approve", [authJwt.getUserFromToken], controller.approveApplication);
  app.put("/applications/:id/reject", [authJwt.getUserFromToken], controller.rejectApplication);
  app.post(
    "/applications/:id/disputes",
    [authJwt.getUserFromToken],
    controller.openDisputeForRejectedApplication
  );
  app.get("/applications/my", [authJwt.getUserFromToken], controller.getMyApplications);
  app.get("/applications/for-my-items", [authJwt.getUserFromToken], controller.getApplicationsForMyItems);
  app.get("/applications/order/:orderId", controller.getApplicationsByOrderId);
  app.get("/applications/service/:serviceId", controller.getApplicationsByServiceId);
};
