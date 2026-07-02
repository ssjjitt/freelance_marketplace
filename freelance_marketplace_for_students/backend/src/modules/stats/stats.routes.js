const controller = require("./stats.controller");
const { getUserFromToken, isAdministrator } = require("../../common/middleware/authJwt");

module.exports = function registerStatsRoutes(app) {
  app.get("/api/stats/platform", controller.getPlatformStats);
  app.get("/api/stats/categories/popular", controller.getPopularCategories);
  app.get("/api/stats/categories/new", controller.getNewCategories);
  app.get("/api/stats/freelancers/best", controller.getBestFreelancers);
  app.get("/api/stats/customers/best", controller.getBestCustomers);
  app.get("/api/stats/activity", controller.getActivityFeed);
  app.get("/api/stats/monthly", [getUserFromToken, isAdministrator], controller.getMonthlyStats);
};
