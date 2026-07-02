const adminService = require("./admin.service");
const { asyncHandler } = require("../../common/middleware");

exports.blockUser = asyncHandler(async (req, res) => {
  const targetUserId = req.params.id || req.params.userId;
  const user = await adminService.blockUser(req.user.id, targetUserId, req.body.reason);
  res.status(200).send({ message: "Пользователь заблокирован", user });
});

exports.unblockUser = asyncHandler(async (req, res) => {
  const user = await adminService.unblockUser(req.user.id, req.params.userId);
  res.status(200).send({ message: "Пользователь разблокирован", user });
});

exports.getAllUsers = asyncHandler(async (req, res) => {
  const users = await adminService.getAllUsers(req.user.id);
  res.status(200).send(users);
});

exports.getAllReports = asyncHandler(async (req, res) => {
  const reports = await adminService.getAllReports(req.user.id);
  res.status(200).send(reports);
});

exports.moderateResume = asyncHandler(async (req, res) => {
  const resume = await adminService.moderateResume(req.user.id, req.params.id, req.body);
  res.status(200).send({ message: "Резюме модерировано", resume });
});

exports.resolveDispute = asyncHandler(async (req, res) => {
  const dispute = await adminService.resolveDispute(req.user.id, req.params.id, req.body);
  res.status(200).send({ message: "Спор закрыт", dispute });
});
