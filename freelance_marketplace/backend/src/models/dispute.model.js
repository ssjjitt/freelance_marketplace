module.exports = (sequelize, Sequelize) => {
    const Dispute = sequelize.define("disputes", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
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
        applicationId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'applications',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        customerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        executerId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        initiatorId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        reason: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        status: {
            type: Sequelize.ENUM('open', 'in_review', 'resolved', 'closed'),
            defaultValue: 'open'
        },
        resolution: {
            type: Sequelize.ENUM('customer_wins', 'executer_wins', 'split', 'refund'),
            allowNull: true
        },
        resolutionComment: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        resolvedByManagerId: {
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
    return Dispute;
};
