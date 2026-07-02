const controller = require("./resume.controller");
const { authJwt } = require("../../common/middleware");

module.exports = function registerResumeRoutes(app) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  app.post("/resumes", [authJwt.getUserFromToken], controller.createResume);
  app.get("/resumes", controller.getResumes);
  app.get("/resumes/pending", [authJwt.getUserFromToken], controller.getPendingResumes);
  app.get("/resumes/:id", controller.getResumeById);
  app.put("/resumes/:id", [authJwt.getUserFromToken], controller.updateResume);
  app.post("/resumes/:id/approve", [authJwt.getUserFromToken], controller.approveResume);
  app.delete("/resumes/:id", [authJwt.getUserFromToken], controller.deleteResume);
};
