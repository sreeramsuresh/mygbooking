// backend/app.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// Routes
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/bookings", require("./routes/booking.routes"));
app.use("/api/requests", require("./routes/request.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));
app.use("/api/users", require("./routes/user.routes"));
app.use("/api/desktop", require("./routes/desktop.routes"));

// Serve static files from the React frontend app
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  // Anything that doesn't match the above, send back index.html
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({
    success: false,
    message: "Something broke!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

module.exports = app;
