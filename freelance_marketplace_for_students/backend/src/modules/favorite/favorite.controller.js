const favoriteService = require("./favorite.service");
const { asyncHandler } = require("../../common/middleware");

exports.addFavorite = asyncHandler(async (req, res) => {
  const favorite = await favoriteService.addFavorite(req.user.id, req.body.executerId);
  res.status(201).send(favorite);
});

exports.removeFavorite = asyncHandler(async (req, res) => {
  await favoriteService.removeFavorite(req.user.id, req.params.executerId);
  res.status(200).send({ message: "Исполнитель удален из избранного" });
});

exports.getFavorites = asyncHandler(async (req, res) => {
  const favorites = await favoriteService.listFavorites(req.user.id);
  res.status(200).send(favorites);
});
