module.exports = (sequelize, Sequelize) => {
    const Ticket = sequelize.define("tickets", {
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
        subject: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        category: {
            type: Sequelize.ENUM('technical', 'payment', 'dispute', 'abuse', 'other'),
            defaultValue: 'other'
        },
        status: {
            type: Sequelize.ENUM('open', 'in_progress', 'resolved', 'closed'),
            defaultValue: 'open'
        },
        priority: {
            type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
            defaultValue: 'medium'
        },
        assignedManagerId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        }
    }, {
        timestamps: true
    });
    return Ticket;
};
