module.exports = (sequelize, Sequelize) => {
    const Category = sequelize.define("categories", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        parentId: {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: {
                model: 'categories',
                key: 'id'
            },
            onDelete: 'CASCADE'
        }
    });
    return Category;
};

