module.exports = (sequelize, Sequelize) => {
    const Resume = sequelize.define("resumes", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        executerId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            references: {
                model: 'users',
                key: 'id'
            },
            onDelete: 'CASCADE'
        },
        title: {
            type: Sequelize.STRING,
            allowNull: false
        },
        description: {
            type: Sequelize.TEXT,
            allowNull: false
        },
        experience: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        education: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        skills: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        portfolio: {
            type: Sequelize.STRING,
            allowNull: true
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            defaultValue: true
        },
        isApproved: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        }
    }, {
        timestamps: true
    });
    return Resume;
};

