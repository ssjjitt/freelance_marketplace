module.exports = (sequelize, Sequelize) => {
    const Application = sequelize.define("applications", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        userId: {
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
            onDelete: 'CASCADE'
        },
        serviceId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'services',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        message: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        proposedPrice: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true
        },
        status: {
            type: Sequelize.ENUM('pending', 'approved', 'rejected'),
            defaultValue: 'pending'
        }
    }, {
        timestamps: true
    });
    return Application;
};

