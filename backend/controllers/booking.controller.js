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
    if (error.message.includes("already booked")) {
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

    const booking = await bookingService.updateBooking(
      bookingId,
      updates,
      req.userId
    );

    return apiResponse.success(res, "Booking updated successfully", booking);
  } catch (error) {
    if (
      error.message.includes("already booked") ||
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
