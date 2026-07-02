module.exports = (sequelize, Sequelize) => {
    const Message = sequelize.define("messages", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        chatId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'chats',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        senderId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        content: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        isType: {
            type: Sequelize.ENUM('user', 'system'),
            allowNull: false,
            defaultValue: 'user'
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
    return Message;
};

