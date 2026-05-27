const categoryService = require("./category.service");
const { asyncHandler } = require("../../common/middleware");

exports.createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.user.id, req.body);
  res.status(201).send(category);
});

exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.listCategories();
  res.status(200).send(categories);
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.user.id, req.params.id);
  res.status(200).send({ message: "Категория удалена" });
});

exports.createSubcategory = asyncHandler(async (req, res) => {
  const subcategory = await categoryService.createSubcategory(req.user.id, req.body);
  res.status(201).send(subcategory);
});
