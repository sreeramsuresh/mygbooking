// backend/utils/scheduler.js
const cron = require("node-cron");
const bookingService = require("../services/booking.service");
const logger = require("./logger");

/**
 * Initialize the scheduler for automated tasks
 */
function initScheduler() {
  // Run weekly auto-booking every Sunday at midnight
  cron.schedule("0 0 * * 0", async () => {
    logger.info("Running weekly auto-booking job");

    try {
      // Get the date for the next day (Monday)
      const nextMonday = new Date();
      nextMonday.setDate(nextMonday.getDate() + 1);

      // Create auto-bookings for the upcoming week
      const results = await bookingService.createAutoBookings(nextMonday, null);

      logger.info(
        `Auto-booking job completed: ${results.success.length} bookings created, ${results.failed.length} failed`
      );
    } catch (error) {
      logger.error("Auto-booking job failed:", error);
    }
  });

  logger.info("Scheduler initialized successfully");
}

module.exports = {
  initScheduler,
};
