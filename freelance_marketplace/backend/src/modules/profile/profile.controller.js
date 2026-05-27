const profileService = require("./profile.service");
const { asyncHandler } = require("../../common/middleware");

exports.getProfile = asyncHandler(async (req, res) => {
  const payload = await profileService.getProfile(req.user.id);
  res.status(200).send(payload);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const payload = await profileService.updateProfile(req.user.id, req.body);
  res.status(200).send(payload);
});

exports.getWorkProfile = asyncHandler(async (req, res) => {
  const payload = await profileService.getWorkProfile(req.user.id);
  res.status(200).send(payload);
});

exports.getUserWorkProfile = asyncHandler(async (req, res) => {
  const payload = await profileService.getUserWorkProfile(req.user.id, req.params.userId);
  res.status(200).send(payload);
});

exports.uploadAvatar = asyncHandler(async (req, res) => {
  const payload = await profileService.uploadAvatar(req.user.id, req.body.avatar);
  res.status(200).send(payload);
});

exports.searchUsers = asyncHandler(async (req, res) => {
  const users = await profileService.searchUsers(req.user.id, req.query.search);
  res.status(200).send(users);
});
