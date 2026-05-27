const controller = require("./attachment.controller");
const { authJwt } = require("../../common/middleware");
const { uploadOrderFiles, uploadServiceFiles, ensureUploadsRootExists } = require("./upload.middleware");

module.exports = function registerAttachmentRoutes(app) {
  ensureUploadsRootExists();

  app.post(
    "/orders/:orderId/attachments",
    [authJwt.getUserFromToken, uploadOrderFiles],
    controller.uploadOrderAttachments
  );
  app.get("/orders/:orderId/attachments", controller.listOrderAttachments);

  app.post(
    "/services/:serviceId/attachments",
    [authJwt.getUserFromToken, uploadServiceFiles],
    controller.uploadServiceAttachments
  );
  app.get("/services/:serviceId/attachments", controller.listServiceAttachments);
  app.delete(
    "/attachments/:attachmentId",
    [authJwt.getUserFromToken],
    controller.deleteAttachment
  );
};
