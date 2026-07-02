const { verifySignUp } = require("../../common/middleware");
const controller = require("./auth.controller");

module.exports = function registerAuthRoutes(app) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.post("/auth/signup", [verifySignUp.checkDuplicateUsernameOrEmail, verifySignUp.checkRolesExisted], controller.signup);
  app.post("/auth/signin", controller.signin);
  app.post("/auth/signout", controller.signout);

  app.post("/auth/send-verification", controller.sendVerification);
  app.post("/auth/verify-email-code", controller.verifyEmailCode);
};
