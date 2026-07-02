const controller = require("./rating.controller");
const { authJwt } = require("../../common/middleware");

module.exports = function registerRatingRoutes(app) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.post("/ratings", [authJwt.getUserFromToken], controller.createRating);
  app.get("/ratings", controller.getRatings);
};
