module.exports = (sequelize, Sequelize) => {
  const Attachment = sequelize.define(
    "attachments",
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      orderId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "orders",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      serviceId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "services",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      storedPath: {
        type: Sequelize.STRING(1024),
        allowNull: false,
      },
      originalName: {
        type: Sequelize.STRING(512),
        allowNull: false,
      },
      mimeType: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      size: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
    },
    {
      timestamps: true,
    }
  );
  return Attachment;
};
