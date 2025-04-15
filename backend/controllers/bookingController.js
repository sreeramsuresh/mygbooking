// backend/controllers/bookingController.js
const { Booking, Seat, User } = require("../models");
const { Op } = require("sequelize");
const dateUtils = require("../utils/dateUtils");

// Get available seats for a specific date
const getAvailableSeats = async (req, res) => {
  try {
    const { date } = req.params;

    // Validate date format
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }

    // Get all active seats
    const allSeats = await Seat.findAll({
      where: { is_active: true },
      order: [["seat_number", "ASC"]],
    });

    // Get booked seats for the date
    const bookedSeats = await Booking.findAll({
      where: {
        booking_date: date,
        status: { [Op.in]: ["booked", "checked_in"] },
      },
      include: [
        {
          model: User,
          attributes: ["id", "username", "first_name", "last_name"],
        },
      ],
    });

    // Create a map of booked seat IDs to quickly check availability
    const bookedSeatMap = bookedSeats.reduce((map, booking) => {
      map[booking.seat_id] = booking;
      return map;
    }, {});

    // Mark seats as available or booked with booking details
    const seatsWithAvailability = allSeats.map((seat) => {
      const booking = bookedSeatMap[seat.id];

      return {
        id: seat.id,
        seat_number: seat.seat_number,
        location: seat.location,
        is_available: !booking,
        booking: booking
          ? {
              id: booking.id,
              user: booking.User
                ? {
                    id: booking.User.id,
                    name: `${booking.User.first_name} ${booking.User.last_name}`,
                  }
                : null,
              status: booking.status,
              is_current_user: booking.user_id === req.user.id,
            }
          : null,
      };
    });

    return res.status(200).json({
      success: true,
      data: seatsWithAvailability,
    });
  } catch (error) {
    console.error("Error getting available seats:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting available seats",
    });
  }
};

// Create a new booking
const createBooking = async (req, res) => {
  try {
    const { seat_id, booking_date } = req.body;
    const user_id = req.user.id;

    // Validate required fields
    if (!seat_id || !booking_date) {
      return res.status(400).json({
        success: false,
        message: "Seat ID and booking date are required",
      });
    }

    // Check if seat exists and is active
    const seat = await Seat.findOne({
      where: { id: seat_id, is_active: true },
    });

    if (!seat) {
      return res.status(404).json({
        success: false,
        message: "Seat not found or inactive",
      });
    }

    // Check if seat is already booked for the date
    const existingBooking = await Booking.findOne({
      where: {
        seat_id,
        booking_date,
        status: { [Op.in]: ["booked", "checked_in"] },
      },
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: "Seat already booked for this date",
      });
    }

    // Check if user already has a booking for the date
    const userBooking = await Booking.findOne({
      where: {
        user_id,
        booking_date,
        status: { [Op.in]: ["booked", "checked_in"] },
      },
    });

    // If user has existing booking, cancel it
    if (userBooking) {
      await userBooking.update({ status: "cancelled" });
    }

    // Get week number and year for the booking date
    const bookingDateObj = new Date(booking_date);
    const week_number = dateUtils.getWeekNumber(bookingDateObj);
    const year = bookingDateObj.getFullYear();

    // Create new booking
    const newBooking = await Booking.create({
      user_id,
      seat_id,
      booking_date,
      week_number,
      year,
      status: "booked",
    });

    return res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: newBooking,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating booking",
    });
  }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    // Find booking
    const booking = await Booking.findByPk(id);

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Check if user owns the booking or is admin/manager
    if (
      booking.user_id !== user_id &&
      !["admin", "manager"].includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this booking",
      });
    }

    // Check if booking can be cancelled (not already checked in)
    if (booking.status === "checked_in") {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel a booking that has been checked in",
      });
    }

    // Update booking status
    await booking.update({ status: "cancelled" });

    return res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    console.error("Error cancelling booking:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while cancelling booking",
    });
  }
};

// Mark missed bookings (for scheduled task)
const markMissedBookings = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all bookings for today that haven't been checked in
    const bookings = await Booking.findAll({
      where: {
        booking_date: today,
        status: "booked",
      },
    });

    // Mark each booking as missed
    for (const booking of bookings) {
      await booking.update({ status: "missed" });
    }

    return {
      success: true,
      message: `Marked ${bookings.length} bookings as missed`,
    };
  } catch (error) {
    console.error("Error marking missed bookings:", error);
    throw error;
  }
};

module.exports = {
  getAvailableSeats,
  createBooking,
  cancelBooking,
  markMissedBookings,
};
