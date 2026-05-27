const config = require("../config/db.config");
const Sequelize = require("sequelize");

const sequelize = new Sequelize(config.DB, config.USER, config.PASSWORD, {
  host: config.HOST,
  dialect: config.dialect,
  logging: false,
  pool: {
    max: config.pool.max,
    min: config.pool.min,
    acquire: config.pool.acquire,
    idle: config.pool.idle,
  },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.user = require("./user.model")(sequelize, Sequelize);
db.role = require("./role.model")(sequelize, Sequelize);
db.profile = require("./profile.model")(sequelize, Sequelize);
db.skill = require("./skill.model")(sequelize, Sequelize);
db.contact = require("./contact.model")(sequelize, Sequelize);
db.category = require("./category.model")(sequelize, Sequelize);
db.order = require("./order.model")(sequelize, Sequelize);
db.service = require("./service.model")(sequelize, Sequelize);
db.application = require("./application.model")(sequelize, Sequelize);
db.rating = require("./rating.model")(sequelize, Sequelize);
db.favorite = require("./favorite.model")(sequelize, Sequelize);
db.resume = require("./resume.model")(sequelize, Sequelize);
db.chat = require("./chat.model")(sequelize, Sequelize);
db.message = require("./message.model")(sequelize, Sequelize);
db.notification = require("./notification.model")(sequelize, Sequelize);
db.attachment = require("./attachment.model")(sequelize, Sequelize);
db.ticket = require("./ticket.model")(sequelize, Sequelize);
db.dispute = require("./dispute.model")(sequelize, Sequelize);
db.report = require("./report.model")(sequelize, Sequelize);

db.role.belongsToMany(db.user, {
  through: "user_roles",
});

db.user.belongsToMany(db.role, {
  through: "user_roles",
});

db.profile.belongsToMany(db.skill, { through: "profile_skills" });
db.skill.belongsToMany(db.profile, { through: "profile_skills" });

db.user.hasOne(db.profile, { foreignKey: "userId", as: "profile", onDelete: "CASCADE" });
db.profile.belongsTo(db.user, { foreignKey: "userId" });

db.profile.hasMany(db.contact, { foreignKey: "profileId", as: "contacts" });
db.contact.belongsTo(db.profile, { foreignKey: "profileId", as: "profile" });

db.category.hasMany(db.category, { foreignKey: "parentId", as: "subcategories" });
db.category.belongsTo(db.category, { foreignKey: "parentId", as: "parent" });

db.category.hasMany(db.order, { foreignKey: "categoryId", as: "orders" });
db.order.belongsTo(db.category, { foreignKey: "categoryId", as: "category" });
db.category.hasMany(db.service, { foreignKey: "categoryId", as: "services" });
db.service.belongsTo(db.category, { foreignKey: "categoryId", as: "category" });

db.user.hasMany(db.order, { foreignKey: "customerId", as: "orders" });
db.order.belongsTo(db.user, { foreignKey: "customerId", as: "customer" });

db.user.hasMany(db.service, { foreignKey: "executerId", as: "services" });
db.service.belongsTo(db.user, { foreignKey: "executerId", as: "executer" });

db.user.hasMany(db.application, { foreignKey: "userId", as: "applications" });
db.application.belongsTo(db.user, { foreignKey: "userId", as: "user" });

db.order.hasMany(db.application, { foreignKey: "orderId", as: "applications" });
db.application.belongsTo(db.order, { foreignKey: "orderId", as: "order" });

db.service.hasMany(db.application, { foreignKey: "serviceId", as: "applications" });
db.application.belongsTo(db.service, { foreignKey: "serviceId", as: "service" });

db.user.hasMany(db.rating, { foreignKey: "fromUserId", as: "ratingsGiven" });
db.user.hasMany(db.rating, { foreignKey: "toUserId", as: "ratingsReceived" });

db.rating.belongsTo(db.user, { foreignKey: "fromUserId", as: "fromUser" });
db.rating.belongsTo(db.user, { foreignKey: "toUserId", as: "toUser" });

db.order.hasMany(db.rating, { foreignKey: "orderId", as: "ratings" });
db.rating.belongsTo(db.order, { foreignKey: "orderId", as: "order" });

db.service.hasMany(db.rating, { foreignKey: "serviceId", as: "ratings" });
db.rating.belongsTo(db.service, { foreignKey: "serviceId", as: "service" });

db.user.hasMany(db.favorite, { foreignKey: "customerId", as: "favorites" });
db.user.hasMany(db.favorite, { foreignKey: "executerId", as: "favoritedBy" });

db.favorite.belongsTo(db.user, { foreignKey: "customerId", as: "customer" });
db.favorite.belongsTo(db.user, { foreignKey: "executerId", as: "executer" });

db.user.hasMany(db.resume, { foreignKey: "executerId", as: "resumes" });
db.resume.belongsTo(db.user, { foreignKey: "executerId", as: "executer" });

db.user.hasMany(db.chat, { foreignKey: "user1Id", as: "chatsAsUser1" });
db.user.hasMany(db.chat, { foreignKey: "user2Id", as: "chatsAsUser2" });

db.chat.belongsTo(db.user, { foreignKey: "user1Id", as: "user1" });
db.chat.belongsTo(db.user, { foreignKey: "user2Id", as: "user2" });

db.chat.hasMany(db.message, { foreignKey: "chatId", as: "messages" });
db.message.belongsTo(db.chat, { foreignKey: "chatId", as: "chat" });

db.user.hasMany(db.message, { foreignKey: "senderId", as: "sentMessages" });
db.message.belongsTo(db.user, { foreignKey: "senderId", as: "sender" });

db.user.hasMany(db.notification, { foreignKey: "userId", as: "notifications" });
db.notification.belongsTo(db.user, { foreignKey: "userId", as: "user" });

db.order.hasMany(db.attachment, { foreignKey: "orderId", as: "attachments", onDelete: "CASCADE" });
db.attachment.belongsTo(db.order, { foreignKey: "orderId", as: "order" });

db.service.hasMany(db.attachment, { foreignKey: "serviceId", as: "attachments", onDelete: "CASCADE" });
db.attachment.belongsTo(db.service, { foreignKey: "serviceId", as: "service" });

// Tickets
db.user.hasMany(db.ticket, { foreignKey: "userId", as: "ticketsCreated" });
db.ticket.belongsTo(db.user, { foreignKey: "userId", as: "user" });

db.user.hasMany(db.ticket, { foreignKey: "assignedManagerId", as: "assignedTickets" });
db.ticket.belongsTo(db.user, { foreignKey: "assignedManagerId", as: "manager" });

// Disputes
db.order.hasMany(db.dispute, { foreignKey: "orderId", as: "disputes" });
db.dispute.belongsTo(db.order, { foreignKey: "orderId", as: "order" });

db.application.hasMany(db.dispute, { foreignKey: "applicationId", as: "disputes" });
db.dispute.belongsTo(db.application, { foreignKey: "applicationId", as: "application" });

db.user.hasMany(db.dispute, { foreignKey: "customerId", as: "disputesAsCustomer" });
db.dispute.belongsTo(db.user, {
  foreignKey: "customerId",
  as: "customer",
  onDelete: "CASCADE",
});

db.user.hasMany(db.dispute, { foreignKey: "executerId", as: "disputesAsExecuter" });
db.dispute.belongsTo(db.user, {
  foreignKey: "executerId",
  as: "executer",
  onDelete: "CASCADE",
});

db.user.hasMany(db.dispute, { foreignKey: "resolvedByManagerId", as: "resolvedDisputes" });
db.dispute.belongsTo(db.user, { foreignKey: "resolvedByManagerId", as: "resolvedByManager" });

db.user.hasMany(db.dispute, { foreignKey: "initiatorId", as: "initiatedDisputes" });
db.dispute.belongsTo(db.user, { foreignKey: "initiatorId", as: "initiator" });

db.user.hasMany(db.report, { foreignKey: "reporterId", as: "reportsCreated" });
db.report.belongsTo(db.user, { foreignKey: "reporterId", as: "reporter" });

db.ROLES = ["executer", "customer", "manager", "administrator"];

module.exports = db;
