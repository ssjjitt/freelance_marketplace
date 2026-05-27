const controller = require("./profile.controller");
const { authJwt } = require("../../common/middleware");

module.exports = function registerProfileRoutes(app) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.get("/profile", [authJwt.getUserFromToken], controller.getProfile);
  app.get("/profile/work", [authJwt.getUserFromToken], controller.getWorkProfile);
  app.get("/profile/:userId/work", [authJwt.getUserFromToken], controller.getUserWorkProfile);
  app.put("/profile", [authJwt.getUserFromToken], controller.updateProfile);
  app.put("/profile/avatar", [authJwt.getUserFromToken], controller.uploadAvatar);
  app.get("/profile/search", [authJwt.getUserFromToken], controller.searchUsers);
};
