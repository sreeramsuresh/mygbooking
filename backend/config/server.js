// Server configuration
// backend/config/server.js
require("dotenv").config();

module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || "dev_secret_key",
  jwtExpiry: process.env.JWT_EXPIRY || "24h",
};
