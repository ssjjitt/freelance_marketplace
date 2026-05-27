const http = require("http");
const { createApp } = require("./app");
const db = require("./models");
const { initializeSocket } = require("./websocket/socket");
const config = require("./config");

const app = createApp();
const server = http.createServer(app);

const Role = db.role;

async function seedRoles() {
  const roles = [
    { id: 1, name: "executer" },
    { id: 2, name: "customer" },
    { id: 3, name: "manager" },
    { id: 4, name: "administrator" }
  ];

  try {
    await Role.bulkCreate(roles, { 
      updateOnDuplicate: ["name"] 
    });
    console.log("roles seeded successfully");
  } catch (error) {
    console.error("error seeding roles:", error);
  }
}

db.sequelize.sync({ alter: true }).then(async () => {
  await seedRoles();
  console.log("database synced");
});

const io = initializeSocket(server);
global.io = io;

const PORT = config.port;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
