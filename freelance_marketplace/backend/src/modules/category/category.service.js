const db = require("../../models");
const Category = db.category;
const User = db.user;

async function assertAdministrator(userId) {
  const user = await User.findByPk(userId, {
    include: [{ model: db.role, as: "roles", through: { attributes: [] } }],
  });
  const userRoles = user.roles.map((r) => r.name);
  if (!userRoles.includes("administrator")) {
    const err = new Error("Только администраторы могут выполнять это действие");
    err.statusCode = 403;
    throw err;
  }
}

async function createCategory(userId, body) {
  await assertAdministrator(userId);
  const { name, description } = body;
  return Category.create({ name, description: description || null });
}

async function listCategories() {
  return Category.findAll({
    order: [["name", "ASC"]],
  });
}

async function deleteCategory(userId, id) {
  await assertAdministrator(userId);
  const category = await Category.findByPk(id);
  if (!category) {
    const err = new Error("Категория не найдена");
    err.statusCode = 404;
    throw err;
  }
  await category.destroy();
}

async function createSubcategory(userId, body) {
  await assertAdministrator(userId);
  const { parentId, name, description } = body;

  const parentCategory = await Category.findByPk(parentId);
  if (!parentCategory) {
    const err = new Error("Родительская категория не найдена");
    err.statusCode = 404;
    throw err;
  }

  return Category.create({
    name,
    description: description || null,
    parentId,
  });
}

module.exports = {
  createCategory,
  listCategories,
  deleteCategory,
  createSubcategory,
};
