module.exports = (sequelize, Sequelize) => {
    const Order = sequelize.define("orders", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        customerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        categoryId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'categories',
                key: 'id'
            }
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        budget: {
            type: Sequelize.DECIMAL(10, 2),
            allowNull: true
        },
        deadline: {
            type: Sequelize.DATE,
            allowNull: true
        },
        status: {
            type: Sequelize.ENUM('open', 'in_progress', 'completed', 'cancelled', 'hidden', 'closed', 'dispute'),
            defaultValue: 'open'
        },
        isModerated: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        moderationReason: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        /** Знак одобрения менеджера для показа в каталоге; выдаётся вручную или при возврате из скрытия */
        moderatorTrustBadge: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    }, {
        timestamps: true
    });
    return Order;
};

