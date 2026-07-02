const controller = require("./favorite.controller");
const { authJwt } = require("../../common/middleware");

module.exports = function registerFavoriteRoutes(app) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.post("/favorites", [authJwt.getUserFromToken], controller.addFavorite);
  app.delete("/favorites/:executerId", [authJwt.getUserFromToken], controller.removeFavorite);
  app.get("/favorites", [authJwt.getUserFromToken], controller.getFavorites);
};
