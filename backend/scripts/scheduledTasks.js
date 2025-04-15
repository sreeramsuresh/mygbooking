// backend/scripts/scheduledTasks.js
const cron = require("node-cron");
const { scheduleService, bookingService } = require("../services");
const logger = require("../utils/logger");

// Initialize scheduled tasks
const initScheduledTasks = () => {
  // Generate weekly bookings (runs every Sunday at midnight)
  cron.schedule("0 0 * * 0", async () => {
    try {
      logger.info("Running weekly booking generation task");
      const result = await scheduleService.generateWeeklyBookings();
      logger.info("Weekly booking generation completed:", result);
    } catch (error) {
      logger.error("Error in weekly booking generation task:", error);
    }
  });

  // Calculate weekly compliance (runs every Friday at 6pm)
  cron.schedule("0 18 * * 5", async () => {
    try {
      logger.info("Running weekly compliance calculation task");
      const result = await scheduleService.calculateWeeklyCompliance();
      logger.info("Weekly compliance calculation completed:", result);
    } catch (error) {
      logger.error("Error in weekly compliance calculation task:", error);
    }
  });

  // Mark missed bookings (runs daily at 11:59pm)
  cron.schedule("59 23 * * *", async () => {
    try {
      logger.info("Running missed bookings task");
      const result = await bookingService.markMissedBookings();
      logger.info("Missed bookings task completed:", result);
    } catch (error) {
      logger.error("Error in missed bookings task:", error);
    }
  });

  logger.info("Scheduled tasks initialized");
};

module.exports = { initScheduledTasks };
