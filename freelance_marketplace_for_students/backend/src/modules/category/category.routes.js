const controller = require("./category.controller");
const { authJwt } = require("../../common/middleware");

module.exports = function registerCategoryRoutes(app) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.post("/categories", [authJwt.getUserFromToken], controller.createCategory);
  app.get("/categories", controller.getCategories);
  app.delete("/categories/:id", [authJwt.getUserFromToken], controller.deleteCategory);
  app.post("/categories/subcategory", [authJwt.getUserFromToken], controller.createSubcategory);
};
