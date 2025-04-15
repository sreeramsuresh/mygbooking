// backend/services/bookingService.js
const { Booking, Seat, User, Attendance } = require("../models");
const { sequelize } = require("../models");
const dateUtils = require("../utils/dateUtils");

// Get available seats for a specific date
const getAvailableSeats = async (date) => {
  try {
    // Find all seats
    const allSeats = await Seat.findAll({
      order: [["seat_number", "ASC"]],
    });

    // Find booked seats for the given date
    const bookedSeats = await Booking.findAll({
      where: {
        booking_date: date,
        status: { [sequelize.Op.ne]: "cancelled" },
      },
      attributes: ["seat_id"],
    });

    // Create an array of booked seat IDs
    const bookedSeatIds = bookedSeats.map((b) => b.seat_id);

    // Filter available seats
    const availableSeats = allSeats.filter(
      (seat) => !bookedSeatIds.includes(seat.id)
    );

    return availableSeats;
  } catch (error) {
    console.error("Error getting available seats:", error);
    throw error;
  }
};

// Create a new booking
const createBooking = async (userId, seatId, date, removePreviousBooking = false) => {
  const transaction = await sequelize.transaction();

  try {
    // Validate seat availability
    const availableSeats = await getAvailableSeats(date);
    const isSeatAvailable = availableSeats.some((seat) => seat.id === seatId);

    if (!isSeatAvailable) {
      throw new Error("Seat is not available for the selected date");
    }

    // Check if user has existing booking on the same date
    const existingBooking = await Booking.findOne({
      where: {
        user_id: userId,
        booking_date: date,
        status: { [sequelize.Op.ne]: "cancelled" },
      },
      transaction,
    });

    if (existingBooking && !removePreviousBooking) {
      throw new Error("You already have a booking for this date");
    } else if (existingBooking && removePreviousBooking) {
      // Cancel previous booking
      await existingBooking.update(
        { status: "cancelled" },
        { transaction }
      );
    }

    // Create new booking
    const booking = await Booking.create(
      {
        user_id: userId,
        seat_id: seatId,
        booking_date: date,
        status: "booked",
      },
      { transaction }
    );

    await transaction.commit();
    return booking;
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating booking:", error);
    throw error;
  }
};

// Cancel a booking
const cancelBooking = async (bookingId, userId, isAdmin = false) => {
  try {
    // Find the booking
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Check if user owns the booking or is admin
    if (booking.user_id !== userId && !isAdmin) {
      throw new Error("Unauthorized to cancel this booking");
    }

    // Check if booking is already checked in
    if (booking.status === "checked_in") {
      throw new Error("Cannot cancel a booking that has been checked in");
    }

    // Check if booking is in the past
    const bookingDate = new Date(booking.booking_date);
    if (dateUtils.isPastDate(bookingDate)) {
      throw new Error("Cannot cancel a past booking");
    }

    // Cancel the booking
    await booking.update({ status: "cancelled" });

    return { success: true, message: "Booking cancelled successfully" };
  } catch (error) {
    console.error("Error cancelling booking:", error);
    throw error;
  }
};

// Mark bookings as missed if they were not checked in
const markMissedBookings = async () => {
  const transaction = await sequelize.transaction();

  try {
    const today = dateUtils.getToday();

    // Find all bookings for today that are still "booked" (not checked in or cancelled)
    const bookingsToMark = await Booking.findAll({
      where: {
        booking_date: today,
        status: "booked",
      },
      transaction,
    });

    if (bookingsToMark.length === 0) {
      await transaction.commit();
      return { 
        success: true, 
        message: "No missed bookings to mark" 
      };
    }

    // Update all these bookings to "missed"
    for (const booking of bookingsToMark) {
      await booking.update({ status: "missed" }, { transaction });
    }

    await transaction.commit();
    return { 
      success: true, 
      message: `Marked ${bookingsToMark.length} bookings as missed` 
    };
  } catch (error) {
    await transaction.rollback();
    console.error("Error marking missed bookings:", error);
    throw error;
  }
};

// Get user's upcoming bookings
const getUserUpcomingBookings = async (userId) => {
  try {
    const today = dateUtils.getToday();

    const upcomingBookings = await Booking.findAll({
      where: {
        user_id: userId,
        booking_date: {
          [sequelize.Op.gte]: today,
        },
        status: { [sequelize.Op.ne]: "cancelled" },
      },
      include: [
        {
          model: Seat,
          as: "seat",
          attributes: ["id", "seat_number", "location"],
        },
      ],
      order: [["booking_date", "ASC"]],
    });

    return upcomingBookings;
  } catch (error) {
    console.error("Error getting upcoming bookings:", error);
    throw error;
  }
};

// Get all bookings for a specific date (admin/manager function)
const getBookingsByDate = async (date) => {
  try {
    const bookings = await Booking.findAll({
      where: {
        booking_date: date,
        status: { [sequelize.Op.ne]: "cancelled" },
      },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "first_name", "last_name", "email", "department"],
        },
        {
          model: Seat,
          as: "seat",
          attributes: ["id", "seat_number", "location"],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    return bookings;
  } catch (error) {
    console.error("Error getting bookings by date:", error);
    throw error;
  }
};

// Swap seats between two users (admin/manager function)
const swapSeats = async (booking1Id, booking2Id) => {
  const transaction = await sequelize.transaction();

  try {
    // Find both bookings
    const booking1 = await Booking.findByPk(booking1Id, { transaction });
    const booking2 = await Booking.findByPk(booking2Id, { transaction });

    if (!booking1 || !booking2) {
      throw new Error("One or both bookings not found");
    }

    // Ensure they're for the same date
    if (booking1.booking_date.toString() !== booking2.booking_date.toString()) {
      throw new Error("Bookings must be for the same date to swap");
    }

    // Swap seat IDs
    const tempSeatId = booking1.seat_id;
    await booking1.update({ seat_id: booking2.seat_id }, { transaction });
    await booking2.update({ seat_id: tempSeatId }, { transaction });

    await transaction.commit();
    return { 
      success: true, 
      message: "Seats swapped successfully" 
    };
  } catch (error) {
    await transaction.rollback();
    console.error("Error swapping seats:", error);
    throw error;
  }
};

module.exports = {
  getAvailableSeats,
  createBooking,
  cancelBooking,
  markMissedBookings,
  getUserUpcomingBookings,
  getBookingsByDate,
  swapSeats,
};