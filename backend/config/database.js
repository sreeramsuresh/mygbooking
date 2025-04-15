// Database configuration
// backend/config/database.js
require("dotenv").config();

module.exports = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || "office_booking_db",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
};
