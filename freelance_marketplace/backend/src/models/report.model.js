module.exports = (sequelize, Sequelize) => {
    const Report = sequelize.define("reports", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        reporterId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        targetId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        targetType: {
            type: Sequelize.ENUM('user', 'order', 'service'),
            allowNull: false
        },
        reason: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        status: {
            type: Sequelize.ENUM('pending', 'resolved'),
            allowNull: false,
            defaultValue: 'pending'
        }
    }, {
        timestamps: true
    });

    return Report;
};
