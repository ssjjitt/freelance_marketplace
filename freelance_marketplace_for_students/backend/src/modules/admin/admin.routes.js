const controller = require("./admin.controller");
const { authJwt } = require("../../common/middleware");

module.exports = function registerAdminRoutes(app) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.post("/admin/users/:id/block", [authJwt.getUserFromToken], controller.blockUser);
  app.put("/admin/users/:userId/block", [authJwt.getUserFromToken], controller.blockUser);
  app.put("/admin/users/:userId/unblock", [authJwt.getUserFromToken], controller.unblockUser);
  app.get("/admin/users", [authJwt.getUserFromToken], controller.getAllUsers);
  app.get("/admin/reports", [authJwt.getUserFromToken], controller.getAllReports);
  app.patch("/admin/resumes/:id/moderate", [authJwt.getUserFromToken], controller.moderateResume);
  app.patch("/admin/disputes/:id/resolve", [authJwt.getUserFromToken], controller.resolveDispute);
};
