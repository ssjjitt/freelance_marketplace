const applicationService = require("./application.service");
const { asyncHandler } = require("../../common/middleware");

exports.createApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.createApplication(req.user, req.body);
  res.status(201).send(application);
});

exports.cancelApplication = asyncHandler(async (req, res) => {
  await applicationService.cancelApplication(req.user.id, req.params.id);
  res.status(200).send({ message: "Отклик отменен" });
});

exports.approveApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.approveApplication(req.user.id, req.params.id);
  res.status(200).send(application);
});

exports.rejectApplication = asyncHandler(async (req, res) => {
  const application = await applicationService.rejectApplication(req.user.id, req.params.id);
  res.status(200).send(application);
});

exports.openDisputeForRejectedApplication = asyncHandler(async (req, res) => {
  const dispute = await applicationService.openDisputeForRejectedApplication(
    req.user.id,
    req.params.id,
    req.body
  );
  res.status(201).send(dispute);
});

exports.getMyApplications = asyncHandler(async (req, res) => {
  const applications = await applicationService.getMyApplications(req.user.id);
  res.status(200).send(applications);
});

exports.getApplicationsForMyItems = asyncHandler(async (req, res) => {
  const applications = await applicationService.getApplicationsForMyItems(req.user.id);
  res.status(200).send(applications);
});

exports.getApplicationsByOrderId = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  const applications = await applicationService.getApplicationsByOrderId(orderId);
  res.status(200).send(applications);
});

exports.getApplicationsByServiceId = asyncHandler(async (req, res) => {
  const { serviceId } = req.params;
  const applications = await applicationService.getApplicationsByServiceId(serviceId);
  res.status(200).send(applications);
});
