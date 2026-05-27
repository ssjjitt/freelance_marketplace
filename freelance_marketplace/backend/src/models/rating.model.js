module.exports = (sequelize, Sequelize) => {
    const Rating = sequelize.define("ratings", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        fromUserId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        toUserId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        orderId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'orders',
                key: 'id'
            },
            onDelete: 'SET NULL'
        },
        serviceId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'services',
                key: 'id'
            },
            onDelete: 'SET NULL'
        },
        rating: {
            type: Sequelize.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        },
        comment: {
            type: Sequelize.TEXT,
            allowNull: true
        }
    }, {
        timestamps: true
    });
    return Rating;
};

