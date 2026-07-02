const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const uploadsRoot = path.join(__dirname, "..", "uploads");

const db = require("./db.config");

function parseCorsOrigins() {
  const fromEnv = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const devDefaults = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5000",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
  ];

  return [...new Set([...fromEnv, ...devDefaults])];
}

const port = parseInt(process.env.PORT || "8080", 10);

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port,
  frontendUrl: process.env.FRONTEND_URL,
  corsOrigins: parseCorsOrigins(),
  bodyParserLimit: process.env.BODY_PARSER_LIMIT || "50mb",
  cookieSession: {
    name: "me0xffff-session",
    keys: [process.env.KEY1, process.env.KEY2].filter(Boolean),
    secret: process.env.SECRET,
  },
  db,
  email: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  apiPublicUrl: process.env.API_PUBLIC_URL || `http://localhost:${port}`,
  uploadsRoot,
};
