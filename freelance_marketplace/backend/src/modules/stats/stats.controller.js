const statsService = require("./stats.service");
const { asyncHandler } = require("../../common/middleware");

exports.getPlatformStats = asyncHandler(async (req, res) => {
  const stats = await statsService.getPlatformStats();
  res.status(200).send(stats);
});

exports.getPopularCategories = asyncHandler(async (req, res) => {
  const data = await statsService.getPopularCategories(req.query);
  res.status(200).send(data);
});

exports.getBestFreelancers = asyncHandler(async (req, res) => {
  const data = await statsService.getBestFreelancers(req.query);
  res.status(200).send(data);
});

exports.getBestCustomers = asyncHandler(async (req, res) => {
  const data = await statsService.getBestCustomers(req.query);
  res.status(200).send(data);
});

exports.getNewCategories = asyncHandler(async (req, res) => {
  const data = await statsService.getNewCategories(req.query);
  res.status(200).send(data);
});

exports.getActivityFeed = asyncHandler(async (req, res) => {
  const data = await statsService.getActivityFeed(req.query);
  res.status(200).send(data);
});

exports.getMonthlyStats = asyncHandler(async (req, res) => {
  const data = await statsService.getMonthlyStats(req.query);
  res.status(200).send(data);
});
