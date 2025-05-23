// backend/utils/scheduler.js
const cron = require("node-cron");
const bookingService = require("../services/booking.service");
const refreshTokenService = require("../services/refreshToken.service");
const logger = require("./logger");

/**
 * Initialize the scheduler for automated tasks
 */
// This function processes auto-bookings for all users
async function processAutoBookingsForAllUsers() {
  try {
    const db = require("../db/models");
    const User = db.user;

    logger.info("Starting auto-booking process for all users");

    // First check for admin users to exclude them from auto-booking
    const Role = db.role;
    const adminUserIds = [];

    try {
      // Find admin role
      const adminRole = await Role.findOne({
        where: {
          name: "admin",
        },
      });

      if (adminRole) {
        // Get the junction table that connects users and roles
        const UserRoles =
          db.sequelize.models.user_roles || db.sequelize.models.userRoles;

        // Find admin users
        const adminUserRoles = await UserRoles.findAll({
          where: {
            roleId: adminRole.id,
          },
        });

        // Extract admin user IDs
        adminUserRoles.forEach((ur) => {
          adminUserIds.push(ur.userId);
        });

        logger.info(
          `Found ${adminUserIds.length} admin users to exclude from auto-booking`
        );
      }
    } catch (roleError) {
      logger.error("Error finding admin users:", roleError);
      // Continue with the process even if we can't identify admins
    }

    // Get all active NON-ADMIN users
    const users = await User.findAll({
      where: {
        isActive: true,
        id: {
          [db.Sequelize.Op.notIn]: adminUserIds.length > 0 ? adminUserIds : [0], // Use [0] to avoid empty IN clause
        },
      },
      raw: true, // Get plain objects for easier logging
    });

    logger.info(`Found ${users.length} active users to process`);

    // Get the date for next Monday
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7));
    const formattedDate = nextMonday.toISOString().split("T")[0];

    let successCount = 0;
    let failedCount = 0;
    let noPrefsCount = 0;

    // Process each user - create auto-bookings for weeks 2-4 if they don't exist
    for (const user of users) {
      try {
        // Log user preferences
        logger.info(`Processing user ${user.id} (${user.username})`);
        logger.info(
          `User preferences - defaultWorkDays: ${JSON.stringify(
            user.defaultWorkDays
          )}, requiredDaysPerWeek: ${user.requiredDaysPerWeek}`
        );

        // Skip users with no preferences or invalid preferences
        if (
          !user.defaultWorkDays ||
          !Array.isArray(user.defaultWorkDays) ||
          user.defaultWorkDays.length === 0
        ) {
          logger.warn(
            `User ${user.id} has no defaultWorkDays defined or it's invalid - skipping`
          );
          noPrefsCount++;
          continue;
        }

        if (!user.requiredDaysPerWeek || user.requiredDaysPerWeek <= 0) {
          logger.warn(
            `User ${user.id} has invalid requiredDaysPerWeek (${user.requiredDaysPerWeek}) - skipping`
          );
          noPrefsCount++;
          continue;
        }

        // Check if user already has bookings for weeks 2-4
        const fourWeeksLater = new Date(today);
        fourWeeksLater.setDate(today.getDate() + 28);

        const nextWeekStart = new Date(nextMonday);
        nextWeekStart.setDate(nextMonday.getDate() + 7);

        const startDate = nextWeekStart.toISOString().split("T")[0];
        const endDate = fourWeeksLater.toISOString().split("T")[0];

        logger.info(
          `Checking existing bookings for user ${user.id} from ${startDate} to ${endDate}`
        );

        // Get bookings for weeks 2-4
        const existingBookings = await bookingService.getUserBookings(user.id, {
          startDate: startDate,
          endDate: endDate,
          status: "confirmed",
        });

        // If no bookings for weeks 2-4, create them
        if (existingBookings.length === 0) {
          logger.info(
            `Creating auto-bookings for user ${user.id} (${user.username})`
          );

          try {
            const results = await bookingService.createAutoBookingsForUser(
              user.id,
              formattedDate,
              null // system performed
            );

            if (results.success && results.success.length > 0) {
              successCount++;
              logger.info(
                `Created ${results.success.length} bookings for user ${user.id}`
              );
              // Log the successful bookings
              results.success.forEach((booking) => {
                logger.info(
                  `Created booking for user ${user.id} on ${booking.date}, seat ${booking.seatNumber}`
                );
              });
            } else {
              failedCount++;
              // Log the reason for failure
              if (results.failed && results.failed.length > 0) {
                results.failed.forEach((failure) => {
                  logger.warn(
                    `Failed to create booking for user ${user.id}: ${failure.reason}`
                  );
                });
              } else {
                logger.warn(
                  `No bookings created for user ${user.id} - no success or failure info available`
                );
              }
            }
          } catch (bookingError) {
            failedCount++;
            logger.error(
              `Exception while creating auto-bookings for user ${user.id}:`,
              bookingError
            );
          }
        } else {
          logger.info(
            `User ${user.id} already has ${existingBookings.length} future bookings between ${startDate} and ${endDate} - skipping`
          );
          // Log the existing bookings dates for debugging
          existingBookings.forEach((booking) => {
            logger.info(
              `User ${user.id} has existing booking on ${booking.bookingDate}`
            );
          });
        }
      } catch (userError) {
        failedCount++;
        logger.error(`Error processing user ${user.id}:`, userError);
      }
    }

    logger.info(
      `Auto-booking process complete: ${successCount} users updated, ${failedCount} failed, ${noPrefsCount} with no/invalid preferences`
    );
    return { successCount, failedCount, noPrefsCount };
  } catch (error) {
    logger.error("Auto-booking process failed:", error);
    throw error;
  }
}

function initScheduler() {
  // Cancel bookings for users who haven't checked in by 10:30 AM
  cron.schedule("30 10 * * 1-5", async () => {
    logger.info(
      "Running booking cancellation for users who haven't checked in"
    );

    try {
      // Get current date in YYYY-MM-DD format
      const today = new Date().toISOString().split("T")[0];

      // Find all bookings for today that haven't been checked in
      const db = require("../db/models");
      const Booking = db.booking;
      const User = db.user;
      const Seat = db.seat;

      const uncheckedBookings = await Booking.findAll({
        where: {
          bookingDate: today,
          status: "confirmed",
          checkInTime: null,
        },
        include: [
          {
            model: User,
            attributes: ["id", "username", "email", "fullName"],
          },
          {
            model: Seat,
            attributes: ["id", "seatNumber"],
          },
        ],
      });

      logger.info(
        `Found ${uncheckedBookings.length} bookings without check-in by 10:30 AM`
      );

      // Cancel these bookings
      let cancelledCount = 0;
      for (const booking of uncheckedBookings) {
        try {
          await booking.update({
            status: "cancelled",
          });

          // Log the cancellation
          await db.auditLog.create({
            entityType: "booking",
            entityId: booking.id,
            action: "cancel",
            performedBy: null, // System performed
            oldValues: { status: "confirmed" },
            newValues: {
              status: "cancelled",
              reason: "No check-in by 10:30 AM",
            },
          });

          cancelledCount++;
          logger.info(
            `Cancelled booking #${booking.id} for user ${
              booking.user?.username || booking.userId
            } (Seat ${booking.seat?.seatNumber || booking.seatId})`
          );
        } catch (cancelError) {
          logger.error(`Error cancelling booking #${booking.id}:`, cancelError);
        }
      }

      logger.info(
        `Successfully cancelled ${cancelledCount} bookings due to no check-in by 10:30 AM`
      );
    } catch (error) {
      logger.error("Booking cancellation job failed:", error);
    }
  });

  logger.info("Scheduler initialized successfully");

  // Run auto-booking process at startup
  setTimeout(async () => {
    logger.info("Running initial auto-booking process at startup");
    try {
      await processAutoBookingsForAllUsers();
      logger.info("Initial auto-booking process completed successfully");
    } catch (error) {
      logger.error("Initial auto-booking process failed:", error);
    }
  }, 10000); // Wait 10 seconds after startup to allow database connections to stabilize
}

module.exports = {
  initScheduler,
  processAutoBookingsForAllUsers,
};
