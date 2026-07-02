const {
  getPendingResumes,
  approveResumeHandler,
  rejectResumeHandler,
  getPendingServices,
  approveServiceHandler,
  rejectServiceHandler,
  deleteServiceHandler,
  getModerationStatsHandler,
} = require("./moderation.controller");
const { authJwt } = require("../../common/middleware");

module.exports = function registerModerationRoutes(app) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept");
    next();
  });

  // ===== RESUME MODERATION =====

  // GET /api/moderation/resumes/pending - Get all pending resumes
  app.get(
    "/moderation/resumes/pending",
    [authJwt.getUserFromToken],
    getPendingResumes
  );

  // PATCH /api/moderation/resumes/:resumeId/approve - Approve resume
  app.patch(
    "/moderation/resumes/:resumeId/approve",
    [authJwt.getUserFromToken],
    approveResumeHandler
  );

  // PATCH /api/moderation/resumes/:resumeId/reject - Reject resume
  app.patch(
    "/moderation/resumes/:resumeId/reject",
    [authJwt.getUserFromToken],
    rejectResumeHandler
  );

  // ===== SERVICE MODERATION =====

  // GET /api/moderation/services/pending - Get all pending services
  app.get(
    "/moderation/services/pending",
    [authJwt.getUserFromToken],
    getPendingServices
  );

  // PATCH /api/moderation/services/:serviceId/approve - Approve service
  app.patch(
    "/moderation/services/:serviceId/approve",
    [authJwt.getUserFromToken],
    approveServiceHandler
  );

  // PATCH /api/moderation/services/:serviceId/reject - Reject service
  app.patch(
    "/moderation/services/:serviceId/reject",
    [authJwt.getUserFromToken],
    rejectServiceHandler
  );
  app.delete(
    "/moderation/services/:serviceId",
    [authJwt.getUserFromToken],
    deleteServiceHandler
  );

  // ===== STATS =====

  // GET /api/moderation/stats - Get moderation statistics
  app.get(
    "/moderation/stats",
    [authJwt.getUserFromToken],
    getModerationStatsHandler
  );
};

