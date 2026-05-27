const express = require("express");
const cors = require("cors");
const cookieSession = require("cookie-session");
const config = require("./config");
const { errorHandler } = require("./common/middleware");

function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigins,
      credentials: true,
    })
  );

  app.use(express.json({ limit: config.bodyParserLimit }));
  app.use(express.urlencoded({ extended: true, limit: config.bodyParserLimit }));

  app.use(
    cookieSession({
      name: config.cookieSession.name,
      keys: config.cookieSession.keys.length ? config.cookieSession.keys : ["dev-key"],
      secret: config.cookieSession.secret,
      httpOnly: true,
    })
  );

  app.get("/", (req, res) => {
    res.json({ message: "hi" });
  });

  app.use("/uploads", express.static(config.uploadsRoot));

  require("./modules/auth/auth.routes")(app);
  require("./modules/profile/profile.routes")(app);
  require("./modules/order/order.routes")(app);
  require("./modules/service/service.routes")(app);
  require("./modules/application/application.routes")(app);
  require("./modules/rating/rating.routes")(app);
  require("./modules/favorite/favorite.routes")(app);
  require("./modules/category/category.routes")(app);
  require("./modules/resume/resume.routes")(app);
  require("./modules/moderation/moderation.routes")(app);
  require("./modules/manager/manager.routes")(app);
  require("./modules/admin/admin.routes")(app);
  require("./modules/chat/chat.routes")(app);
  require("./modules/notification/notification.routes")(app);
  require("./modules/stats/stats.routes")(app);
  require("./modules/attachment/attachment.routes")(app);
  require("./modules/report/report.routes")(app);
  require("./modules/dispute/dispute.routes")(app);

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
