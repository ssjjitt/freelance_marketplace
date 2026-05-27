module.exports = (sequilize, Sequelize) => {
    const Role = sequilize.define("roles", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING
        }
    });
    return Role;
}