const serviceService = require("./service.service");
const attachmentService = require("../attachment/attachment.service");
const { asyncHandler } = require("../../common/middleware");

function serviceToJsonWithAttachmentUrls(service) {
  const plain = service.get ? service.get({ plain: true }) : { ...service };
  plain.attachments = attachmentService.mapAttachmentsWithUrl(plain.attachments || []);
  return plain;
}

exports.createService = asyncHandler(async (req, res) => {
  const service = await serviceService.createService(req.user.id, req.body);
  res.status(201).send(serviceToJsonWithAttachmentUrls(service));
});

exports.getServices = asyncHandler(async (req, res) => {
  const services = await serviceService.listServices(req.query);
  const payload = services.map((row) => serviceToJsonWithAttachmentUrls(row));
  res.status(200).send(payload);
});

exports.getServiceById = asyncHandler(async (req, res) => {
  const service = await serviceService.getServiceById(req.params.id);
  res.status(200).send(serviceToJsonWithAttachmentUrls(service));
});

exports.updateService = asyncHandler(async (req, res) => {
  const service = await serviceService.updateService(req.user.id, req.params.id, req.body);
  res.status(200).send(serviceToJsonWithAttachmentUrls(service));
});

exports.deleteService = asyncHandler(async (req, res) => {
  await serviceService.deleteService(req.user.id, req.params.id);
  res.status(200).send({ message: "Услуга удалена" });
});

exports.getServiceStats = asyncHandler(async (req, res) => {
  const stats = await serviceService.getServiceStats(req.user.id, req.params.id);
  res.status(200).send(stats);
});
