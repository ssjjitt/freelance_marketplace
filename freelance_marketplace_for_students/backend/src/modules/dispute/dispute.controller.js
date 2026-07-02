const disputeService = require("./dispute.service");
const { asyncHandler } = require("../../common/middleware");

exports.openDispute = asyncHandler(async (req, res) => {
  const dispute = await disputeService.openDispute(req.user.id, req.body);
  res.status(201).json(dispute);
});
