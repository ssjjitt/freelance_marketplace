const reportService = require("./report.service");
const { asyncHandler } = require("../../common/middleware");

exports.createReport = asyncHandler(async (req, res) => {
  const report = await reportService.createReport(req.user.id, req.body);
  res.status(201).json(report);
});
