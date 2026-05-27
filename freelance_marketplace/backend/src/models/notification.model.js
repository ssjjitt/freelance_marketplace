module.exports = (sequelize, Sequelize) => {
    const Notification = sequelize.define("notifications", {
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
        type: {
            type: Sequelize.ENUM(
                'new_application',
                'application_approved',
                'application_rejected',
                'new_message',
                'new_rating',
                'order_status_changed',
                'service_status_changed',
                'system',
                'admin_notification',
                'resume_approved'
            ),
            allowNull: false
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false
        },
        message: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        relatedId: {
            type: Sequelize.INTEGER,
            allowNull: true
        },
        relatedType: {
            type: Sequelize.ENUM('order', 'service', 'application', 'message', 'rating', 'resume'),
            allowNull: true
        },
        isRead: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        readAt: {
            type: Sequelize.DATE,
            allowNull: true
        }
    }, {
        timestamps: true
    });
    return Notification;
};

