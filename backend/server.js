// backend/server.js
const app = require("./app");
const db = require("./db/models");
const dbSync = require("./utils/dbSync");
const scheduler = require("./utils/scheduler");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    // Initialize database
    await dbSync.initDatabase();

    // Initialize scheduler
    scheduler.initScheduler();

    // Start the Express server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
