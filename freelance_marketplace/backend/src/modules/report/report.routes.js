const controller = require("./report.controller");
const { authJwt } = require("../../common/middleware");

module.exports = function registerReportRoutes(app) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.post("/reports", [authJwt.getUserFromToken], controller.createReport);
};
