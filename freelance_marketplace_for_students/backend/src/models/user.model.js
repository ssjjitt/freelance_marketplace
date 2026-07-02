// const { PASSWORD } = require("../../../config/db.config");
const { PASSWORD } = require("../../config/db.config");

module.exports = (sequelize, Sequelize) => {
    const User = sequelize.define("users", {
        username: {
            type: Sequelize.STRING
        },
        email: {
            type: Sequelize.STRING
        },
        password: {
            type: Sequelize.STRING
        },
        isBlocked: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        blockReason: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        blockedAt: {
            type: Sequelize.DATE,
            allowNull: true
        },
        lastSeen: {
            type: Sequelize.DATE,
            allowNull: true
        }
    });
    return User;
}