const controller = require("./dispute.controller");
const { authJwt } = require("../../common/middleware");

module.exports = function registerDisputeRoutes(app) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.post("/disputes", [authJwt.getUserFromToken], controller.openDispute);
};
