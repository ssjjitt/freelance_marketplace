const attachmentService = require("./attachment.service");
const { asyncHandler } = require("../../common/middleware");

exports.uploadOrderAttachments = asyncHandler(async (req, res) => {
  const rows = await attachmentService.saveOrderFilesFromMulter(
    req.user.id,
    Number(req.params.orderId),
    req.files
  );
  res.status(201).json(rows);
});

exports.listOrderAttachments = asyncHandler(async (req, res) => {
  const rows = await attachmentService.listOrderFiles(Number(req.params.orderId));
  res.status(200).json(rows);
});

exports.uploadServiceAttachments = asyncHandler(async (req, res) => {
  const rows = await attachmentService.saveServiceFilesFromMulter(
    req.user.id,
    Number(req.params.serviceId),
    req.files
  );
  res.status(201).json(rows);
});

exports.listServiceAttachments = asyncHandler(async (req, res) => {
  const rows = await attachmentService.listServiceFiles(Number(req.params.serviceId));
  res.status(200).json(rows);
});

exports.deleteAttachment = asyncHandler(async (req, res) => {
  await attachmentService.deleteAttachmentById(req.user.id, Number(req.params.attachmentId));
  res.status(200).json({ message: "Вложение удалено" });
});
