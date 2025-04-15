// Entry point for the application
// backend/index.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const { initializeDatabase } = require("./scripts/initDb");
const { initScheduledTasks } = require("./scripts/scheduledTasks");
const routes = require("./routes");
const logger = require("./utils/logger");
const config = require("./config/server");

// Initialize Express app
const app = express();

// Apply middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  })
);

// API routes
app.use("/api", routes);

// Serve static files from the React app in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/build")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);

  res.status(500).json({
    success: false,
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Start server
const PORT = process.env.PORT || config.port;

(async () => {
  try {
    // Initialize database
    await initializeDatabase();

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);

      // Initialize scheduled tasks
      initScheduledTasks();
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
})();

module.exports = app; // For testing
