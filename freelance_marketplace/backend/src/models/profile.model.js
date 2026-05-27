// const { PASSWORD } = require("../../../config/db.config");
const { PASSWORD } = require("../../config/db.config");

module.exports = (sequelize, Sequelize) => {
    const Profile = sequelize.define("profiles", {
       userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
       },
       lastname:{
            type: Sequelize.STRING
       },
       name: {
        type: Sequelize.STRING
       },
       birthday: {
        type: Sequelize.DATE
       },
       gender: {
        type: Sequelize.STRING
       },
       country: {
        type: Sequelize.STRING
       },
       city: {
        type: Sequelize.STRING
       },
       education: {
          type: Sequelize.STRING
       },
       website: {
        type: Sequelize.STRING
       },
       phone: {
        type: Sequelize.STRING,
       },
       email: {
        type: Sequelize.STRING,
       },
       about: {
        type: Sequelize.TEXT
       },
       availability: {
        type: Sequelize.STRING
       },
       completedProjects: {
        type: Sequelize.INTEGER,
        defaultValue: 0
       },
       inProgress: {
        type: Sequelize.INTEGER,
        defaultValue: 0
       },
       rating: {
        type: Sequelize.FLOAT,
        defaultValue: 0
       },
       responseTimeHours: {
        type: Sequelize.INTEGER,
        defaultValue: 0
       },
       avatar: {
        type: Sequelize.TEXT('long') 
       },
       profileViews: {
        type: Sequelize.INTEGER,
        defaultValue: 0
       }
    });
    return Profile;
}