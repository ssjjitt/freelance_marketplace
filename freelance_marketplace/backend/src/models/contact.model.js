module.exports = (sequelize, Sequelize) => {
    const Contact = sequelize.define("contacts", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        profileId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'profiles',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        type: {
            type: Sequelize.ENUM('messenger', 'social', 'other'),
            allowNull: false,
        },
        platform: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        username: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        url: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        phone: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        email: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        isPublic: {
            type: Sequelize.BOOLEAN,
            defaultValue: true,
        },
        order: {
            type: Sequelize.INTEGER,
            defaultValue: 0,
        }
    }, {
        tableName: 'contacts',
        timestamps: true,
        indexes: [
            {
                fields: ['profileId']
            },
            {
                fields: ['type']
            },
            {
                fields: ['platform']
            }
        ]
    });

    return Contact;
};
