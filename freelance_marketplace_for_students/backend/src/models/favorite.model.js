module.exports = (sequelize, Sequelize) => {
    const Favorite = sequelize.define("favorites", {
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
        executerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    }, {
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['customerId', 'executerId']
            }
        ]
    });
    return Favorite;
};

