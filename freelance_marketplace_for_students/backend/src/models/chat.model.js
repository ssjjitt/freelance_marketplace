module.exports = (sequelize, Sequelize) => {
    const Chat = sequelize.define("chat", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },

        user1Id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE'
        },

        user2Id: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE'
        },

        lastMessageAt: {
            type: Sequelize.DATE,
            defaultValue: Sequelize.NOW
        }
    }, {
        timestamps: true,
        indexes: [
            { fields: ['user1Id'] },
            { fields: ['user2Id'] },
            { fields: ['lastMessageAt'] },
            {
                unique: true,
                fields: ['user1Id', 'user2Id']
            }
        ]
    });

    return Chat;
};
