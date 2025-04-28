// backend/controllers/booking.controller.js
const bookingService = require("../services/booking.service");
const apiResponse = require("../utils/apiResponse");

/**
 * Create a new booking
 */
exports.createBooking = async (req, res) => {
  try {
    const { seatId, bookingDate } = req.body;

    if (!seatId || !bookingDate) {
      return apiResponse.badRequest(
        res,
        "Seat ID and booking date are required"
      );
    }

    const booking = await bookingService.createBooking(
      req.userId,
      seatId,
      bookingDate,
      req.userId
    );

    return apiResponse.created(res, "Booking created successfully", booking);
  } catch (error) {
    if (
      error.message.includes("already booked") ||
      error.message.includes("already have a booking")
    ) {
      return apiResponse.badRequest(res, error.message);
    }
    return apiResponse.serverError(res, error);
  }
};

/**
 * Update an existing booking
 */
exports.updateBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const updates = req.body;

    if (!bookingId) {
      return apiResponse.badRequest(res, "Booking ID is required");
    }

    // Validate updates
    if (!updates.seatId && !updates.bookingDate) {
      return apiResponse.badRequest(
        res,
        "At least one of seatId or bookingDate must be provided"
      );
    }

    const booking = await bookingService.updateBooking(
      bookingId,
      updates,
      req.userId
    );

    return apiResponse.success(res, "Booking updated successfully", booking);
  } catch (error) {
    if (
      error.message.includes("already booked") ||
      error.message.includes("already have a booking") ||
      error.message.includes("not found")
    ) {
      return apiResponse.badRequest(res, error.message);
    }
    return apiResponse.serverError(res, error);
  }
};

/**
 * Cancel a booking
 */
exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    if (!bookingId) {
      return apiResponse.badRequest(res, "Booking ID is required");
    }

    const booking = await bookingService.cancelBooking(
      bookingId,
      reason,
      req.userId
    );

    return apiResponse.success(res, "Booking cancelled successfully", booking);
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("already cancelled")
    ) {
      return apiResponse.badRequest(res, error.message);
    }
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get bookings for the current user
 */
exports.getMyBookings = async (req, res) => {
  try {
    const filters = req.query;

    const bookings = await bookingService.getUserBookings(req.userId, filters);

    return apiResponse.success(
      res,
      "Bookings retrieved successfully",
      bookings
    );
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get all bookings for a specific date (admin/manager only)
 */
exports.getBookingsByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return apiResponse.badRequest(res, "Date is required");
    }

    const bookings = await bookingService.getBookingsByDate(date);

    return apiResponse.success(
      res,
      "Bookings retrieved successfully",
      bookings
    );
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get available seats for a specific date
 */
exports.getAvailableSeats = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return apiResponse.badRequest(res, "Date is required");
    }

    const seats = await bookingService.getAvailableSeats(date);

    return apiResponse.success(
      res,
      "Available seats retrieved successfully",
      seats
    );
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Record check-in for a booking
 */
exports.checkIn = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return apiResponse.badRequest(res, "Booking ID is required");
    }

    const booking = await bookingService.checkIn(bookingId, req.userId);

    return apiResponse.success(res, "Check-in recorded successfully", booking);
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("Already checked in")
    ) {
      return apiResponse.badRequest(res, error.message);
    }
    return apiResponse.serverError(res, error);
  }
};

/**
 * Record check-out for a booking
 */
exports.checkOut = async (req, res) => {
  try {
    const { bookingId } = req.params;

    if (!bookingId) {
      return apiResponse.badRequest(res, "Booking ID is required");
    }

    const booking = await bookingService.checkOut(bookingId, req.userId);

    return apiResponse.success(res, "Check-out recorded successfully", booking);
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("without checking in") ||
      error.message.includes("Already checked out")
    ) {
      return apiResponse.badRequest(res, error.message);
    }
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get weekly attendance status for the current user
 */
exports.getMyWeeklyStatus = async (req, res) => {
  try {
    const { year, weekNumber } = req.query;

    if (!year || !weekNumber) {
      return apiResponse.badRequest(res, "Year and week number are required");
    }

    const status = await bookingService.getWeeklyAttendanceStatus(
      req.userId,
      parseInt(year),
      parseInt(weekNumber)
    );

    return apiResponse.success(
      res,
      "Weekly status retrieved successfully",
      status
    );
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Create automatic bookings for all users (admin only)
 */
exports.createAutoBookings = async (req, res) => {
  try {
    const { weekStartDate } = req.body;

    if (!weekStartDate) {
      return apiResponse.badRequest(res, "Week start date is required");
    }

    const results = await bookingService.createAutoBookings(
      weekStartDate,
      req.userId
    );

    return apiResponse.success(
      res,
      "Auto-bookings created successfully",
      results
    );
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Ensures a user has auto-bookings for their preferred days
 * This can be called on login or dashboard load
 */
exports.ensureUserAutoBookings = async (req, res) => {
  try {
    // Get the current user's ID from the request
    const userId = req.userId;

    // Get today's date and find next Monday
    const today = new Date();
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7));
    const weekStartDate = nextMonday.toISOString().split("T")[0];

    console.log(
      `Ensuring auto-bookings for user ${userId} starting from ${weekStartDate}`
    );

    // Check if bookings already exist for the next few weeks
    const nextFewWeeks = new Date(today);
    nextFewWeeks.setDate(today.getDate() + 28); // 4 weeks ahead

    const existingBookings = await bookingService.getUserBookings(userId, {
      startDate: today.toISOString().split("T")[0],
      endDate: nextFewWeeks.toISOString().split("T")[0],
      status: "confirmed",
    });

    // If no bookings found for the user, create them automatically
    if (existingBookings.length === 0) {
      console.log(
        `No bookings found for user ${userId} - creating auto-bookings`
      );

      // Create auto-bookings for this user based on their preferences
      const results = await bookingService.createAutoBookingsForUser(
        userId,
        weekStartDate,
        userId // self-performed
      );

      return apiResponse.success(
        res,
        "Auto-bookings created based on user preferences",
        results
      );
    }

    // Check if they have bookings for week 2, 3, 4 (allow overrides for the upcoming week)
    const hasBookingsForFutureWeeks = existingBookings.some((booking) => {
      const bookingDate = new Date(booking.bookingDate);
      return (
        bookingDate > new Date(nextMonday.getTime() + 7 * 24 * 60 * 60 * 1000)
      ); // after next week
    });

    if (hasBookingsForFutureWeeks) {
      console.log(
        `User ${userId} already has bookings for future weeks - not creating auto-bookings`
      );
      return apiResponse.success(
        res,
        "User already has future bookings - not creating auto-bookings",
        { bookingsExist: true }
      );
    }

    // Create auto-bookings for this user based on their preferences
    const results = await bookingService.createAutoBookingsForUser(
      userId,
      weekStartDate,
      userId // self-performed
    );

    return apiResponse.success(
      res,
      "Auto-bookings created based on user preferences",
      results
    );
  } catch (error) {
    console.error("Error in ensureUserAutoBookings controller:", error);
    return apiResponse.serverError(res, error);
  }
};

/**
 * Reset all bookings for a user and create fresh auto-bookings
 * Admin only operation
 */
exports.resetAndAutoBook = async (req, res) => {
  try {
    const { weekStartDate, userId } = req.body;

    if (!weekStartDate) {
      return apiResponse.badRequest(res, "Week start date is required");
    }

    if (!userId) {
      return apiResponse.badRequest(res, "User ID is required");
    }

    // This is now an admin-only operation
    if (!req.userRoles.includes("ROLE_ADMIN")) {
      return apiResponse.forbidden(
        res,
        "Only administrators can perform auto-booking operations"
      );
    }

    console.log(
      `Resetting and auto-booking for user ${userId} starting from ${weekStartDate}`
    );
    const results = await bookingService.resetAndAutoBookForUser(
      userId,
      weekStartDate,
      req.userId
    );

    return apiResponse.success(
      res,
      "All bookings reset and auto-bookings created successfully",
      results
    );
  } catch (error) {
    console.error("Error in resetAndAutoBook controller:", error);
    return apiResponse.serverError(res, error);
  }
};

/**
 * Debug auto-booking preferences for all users (admin only)
 * This helps diagnose issues with auto-booking
 */
exports.debugAutoBookingPrefs = async (req, res) => {
  try {
    // This is an admin-only operation
    if (
      !req.userRoles.includes("ROLE_ADMIN") &&
      !req.userRoles.includes("admin")
    ) {
      return apiResponse.forbidden(
        res,
        "Only administrators can access debugging information"
      );
    }

    const db = require("../db/models");
    const User = db.user;
    const logger = require("../utils/logger");

    // Get all users with their preferences
    const users = await User.findAll({
      attributes: [
        "id",
        "username",
        "fullName",
        "isActive",
        "defaultWorkDays",
        "requiredDaysPerWeek",
      ],
      raw: true,
    });

    logger.info(`Found ${users.length} total users in the system`);

    // Analyze each user's auto-booking preferences
    const results = users.map((user) => {
      // Check if user has valid preferences for auto-booking
      const hasDefaultWorkDays =
        user.defaultWorkDays &&
        Array.isArray(user.defaultWorkDays) &&
        user.defaultWorkDays.length > 0;

      const hasRequiredDays =
        user.requiredDaysPerWeek && user.requiredDaysPerWeek > 0;

      const daysToBook = hasDefaultWorkDays
        ? user.defaultWorkDays.slice(0, user.requiredDaysPerWeek || 2)
        : [];

      return {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        isActive: user.isActive,
        defaultWorkDays: user.defaultWorkDays,
        requiredDaysPerWeek: user.requiredDaysPerWeek,
        preferences: {
          hasValidDefaultWorkDays: hasDefaultWorkDays,
          hasValidRequiredDays: hasRequiredDays,
          daysToBook: daysToBook,
          isEligibleForAutoBooking:
            hasDefaultWorkDays &&
            hasRequiredDays &&
            daysToBook.length > 0 &&
            user.isActive,
        },
      };
    });

    // Count users eligible for auto-booking
    const eligibleCount = results.filter(
      (r) => r.preferences.isEligibleForAutoBooking
    ).length;

    logger.info(
      `Found ${eligibleCount} users eligible for auto-booking out of ${users.length} total users`
    );

    return apiResponse.success(
      res,
      "User auto-booking preferences retrieved successfully",
      {
        totalUsers: users.length,
        eligibleForAutoBooking: eligibleCount,
        userPreferences: results,
      }
    );
  } catch (error) {
    console.error("Error in debugAutoBookingPrefs controller:", error);
    return apiResponse.serverError(res, error);
  }
};

/**
 * Force auto-booking for all users (admin only)
 * This immediately runs the auto-booking process for all users
 */
exports.forceAutoBookingForAll = async (req, res) => {
  try {
    // This is an admin-only operation
    if (
      !req.userRoles.includes("ROLE_ADMIN") &&
      !req.userRoles.includes("admin")
    ) {
      return apiResponse.forbidden(
        res,
        "Only administrators can force auto-booking"
      );
    }

    const scheduler = require("../utils/scheduler");
    const logger = require("../utils/logger");

    logger.info("Starting forced auto-booking process for all users");

    // Use the centralized function that handles auto-booking for all users
    const result = await scheduler.processAutoBookingsForAllUsers();

    logger.info(
      `Force auto-booking complete with result: ${JSON.stringify(result)}`
    );

    // Convert the result to the expected format
    const formattedResult = {
      successful: result.successCount || 0,
      failed: result.failedCount || 0,
      skipped: result.noPrefsCount || 0,
      details: {
        success: [],
        failed: [],
        skipped: [],
      },
    };

    return apiResponse.success(
      res,
      "Force auto-booking process completed",
      formattedResult
    );
  } catch (error) {
    console.error("Error in forceAutoBookingForAll controller:", error);
    return apiResponse.serverError(res, error);
  }
};

/**
 * Change an auto-booked workday to another day
 * This allows users to change from one default workday to another
 */
exports.changeWorkDay = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { newDate, seatId } = req.body;

    if (!bookingId) {
      return apiResponse.badRequest(res, "Booking ID is required");
    }

    if (!newDate) {
      return apiResponse.badRequest(res, "New date is required");
    }

    // Pass the seatId if provided
    const result = await bookingService.changeWorkDay(
      bookingId,
      newDate,
      req.userId,
      seatId
    );

    return apiResponse.success(
      res, 
      "Workday changed successfully", 
      result
    );
  } catch (error) {
    console.error("Error in changeWorkDay controller:", error);
    if (
      error.message.includes("already have a booking") ||
      error.message.includes("not found") ||
      error.message.includes("cancelled") ||
      error.message.includes("required")
    ) {
      return apiResponse.badRequest(res, error.message);
    }
    return apiResponse.serverError(res, error);
  }
};
