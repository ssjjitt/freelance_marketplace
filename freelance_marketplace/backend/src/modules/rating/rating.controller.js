const ratingService = require("./rating.service");
const { asyncHandler } = require("../../common/middleware");

exports.createRating = asyncHandler(async (req, res) => {
  const rating = await ratingService.createRating(req.user.id, req.body);
  res.status(201).send(rating);
});

exports.getRatings = asyncHandler(async (req, res) => {
  const ratings = await ratingService.listRatings(req.query);
  res.status(200).send(ratings);
});
