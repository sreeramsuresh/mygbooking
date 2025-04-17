// backend/services/booking.service.js
const db = require("../db/models");
const { Op } = db.Sequelize;
const Booking = db.booking;
const Seat = db.seat;
const User = db.user;
const AuditLog = db.auditLog;

/**
 * Get week number of the year from date
 */
const getWeekNumber = (date) => {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
};

/**
 * Creates a new booking
 */
const createBooking = async (userId, seatId, bookingDate, performedBy) => {
  try {
    // Parse date and get week number
    const date = new Date(bookingDate);
    const weekNumber = getWeekNumber(date);

    // Check if seat is already booked for this date
    const existingBooking = await Booking.findOne({
      where: {
        seatId,
        bookingDate,
        status: { [Op.ne]: "cancelled" },
      },
    });

    if (existingBooking) {
      throw new Error("This seat is already booked for the selected date");
    }

    // Check if user already has a booking for this date
    const userBooking = await Booking.findOne({
      where: {
        userId,
        bookingDate,
        status: { [Op.ne]: "cancelled" },
      },
    });

    if (userBooking) {
      throw new Error("You already have a booking for this date");
    }

    // Create the booking
    const booking = await Booking.create({
      userId,
      seatId,
      bookingDate,
      weekNumber,
      status: "confirmed",
      isAutoBooked: false,
    });

    // Log the action
    await AuditLog.create({
      entityType: "booking",
      entityId: booking.id,
      action: "create",
      performedBy,
      newValues: {
        userId,
        seatId,
        bookingDate,
        status: "confirmed",
      },
    });

    return booking;
  } catch (error) {
    throw error;
  }
};

/**
 * Updates a booking
 */
const updateBooking = async (bookingId, updates, performedBy) => {
  try {
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      throw new Error("Booking not found");
    }

    // Store old values for audit log
    const oldValues = { ...booking.dataValues };

    // Check if changing seat and the new seat is available
    if (updates.seatId && updates.seatId !== booking.seatId) {
      const existingBooking = await Booking.findOne({
        where: {
          seatId: updates.seatId,
          bookingDate: booking.bookingDate,
          status: { [Op.ne]: "cancelled" },
          id: { [Op.ne]: bookingId },
        },
      });

      if (existingBooking) {
        throw new Error("The selected seat is already booked for this date");
      }
    }

    // Update booking
    await booking.update(updates);

    // Log the update
    await AuditLog.create({
      entityType: "booking",
      entityId: booking.id,
      action: "update",
      performedBy,
      oldValues,
      newValues: updates,
    });

    return booking;
  } catch (error) {
    throw error;
  }
};

/**
 * Cancels a booking
 */
const cancelBooking = async (bookingId, reason, performedBy) => {
  try {
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status === "cancelled") {
      throw new Error("Booking already cancelled");
    }

    // Store old values for audit log
    const oldValues = { ...booking.dataValues };

    // Cancel booking
    await booking.update({
      status: "cancelled",
    });

    // Log the cancellation
    await AuditLog.create({
      entityType: "booking",
      entityId: booking.id,
      action: "cancel",
      performedBy,
      oldValues,
      newValues: {
        status: "cancelled",
        reason,
      },
    });

    return booking;
  } catch (error) {
    throw error;
  }
};

/**
 * Gets all bookings for a user
 */
const getUserBookings = async (userId, filters = {}) => {
  try {
    const whereClause = { userId };

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.startDate && filters.endDate) {
      whereClause.bookingDate = {
        [Op.between]: [filters.startDate, filters.endDate],
      };
    } else if (filters.startDate) {
      whereClause.bookingDate = {
        [Op.gte]: filters.startDate,
      };
    } else if (filters.endDate) {
      whereClause.bookingDate = {
        [Op.lte]: filters.endDate,
      };
    }

    if (filters.weekNumber) {
      whereClause.weekNumber = filters.weekNumber;
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      include: [
        {
          model: Seat,
          attributes: ["id", "seatNumber", "description"],
        },
      ],
      order: [["bookingDate", "ASC"]],
    });

    return bookings;
  } catch (error) {
    throw error;
  }
};

/**
 * Gets all bookings for a specific date
 */
const getBookingsByDate = async (date) => {
  try {
    const bookings = await Booking.findAll({
      where: {
        bookingDate: date,
        status: { [Op.ne]: "cancelled" },
      },
      include: [
        {
          model: User,
          attributes: ["id", "username", "fullName", "department"],
        },
        {
          model: Seat,
          attributes: ["id", "seatNumber", "description"],
        },
      ],
    });

    return bookings;
  } catch (error) {
    throw error;
  }
};

/**
 * Gets available seats for a specific date
 */
const getAvailableSeats = async (date) => {
  try {
    // Get all active seats
    const allSeats = await Seat.findAll({
      where: {
        isActive: true,
      },
    });

    // Get booked seats for the date with user information
    const bookingsWithDetails = await Booking.findAll({
      where: {
        bookingDate: date,
        status: { [Op.ne]: "cancelled" },
      },
      include: [
        {
          model: Seat,
          attributes: ["id", "seatNumber", "description", "isActive"],
        },
        {
          model: User,
          attributes: ["id", "fullName", "department"],
        },
      ],
    });

    // Create a map of booked seat IDs
    const bookedSeatIds = new Set(bookingsWithDetails.map((booking) => booking.seatId));
    
    // Format booked seats with user information
    const bookedSeatsWithInfo = bookingsWithDetails.map((booking) => ({
      id: booking.seat.id,
      seatNumber: booking.seat.seatNumber,
      description: booking.seat.description,
      isActive: booking.seat.isActive,
      bookedBy: booking.user ? booking.user.fullName : "Unknown",
      department: booking.user ? booking.user.department : null,
      bookingId: booking.id,
    }));

    // Filter to only include available seats
    const availableSeats = allSeats.filter(seat => !bookedSeatIds.has(seat.id));

    // Return both available and booked seats
    return {
      availableSeats,
      bookedSeats: bookedSeatsWithInfo,
      totalSeats: allSeats.length,
      bookedCount: bookedSeatsWithInfo.length,
      availableCount: availableSeats.length
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Record check-in for a booking
 */
const checkIn = async (bookingId, performedBy) => {
  try {
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (booking.status !== "confirmed") {
      throw new Error("Cannot check in for a booking that is not confirmed");
    }

    if (booking.checkInTime) {
      throw new Error("Already checked in");
    }

    // Store old values for audit log
    const oldValues = { ...booking.dataValues };

    // Record check-in time
    const now = new Date();
    await booking.update({
      checkInTime: now,
    });

    // Log check-in
    await AuditLog.create({
      entityType: "booking",
      entityId: booking.id,
      action: "check-in",
      performedBy,
      oldValues,
      newValues: {
        checkInTime: now,
      },
    });

    return booking;
  } catch (error) {
    throw error;
  }
};

/**
 * Record check-out for a booking
 */
const checkOut = async (bookingId, performedBy) => {
  try {
    const booking = await Booking.findByPk(bookingId);

    if (!booking) {
      throw new Error("Booking not found");
    }

    if (!booking.checkInTime) {
      throw new Error("Cannot check out without checking in first");
    }

    if (booking.checkOutTime) {
      throw new Error("Already checked out");
    }

    // Store old values for audit log
    const oldValues = { ...booking.dataValues };

    // Record check-out time
    const now = new Date();
    await booking.update({
      checkOutTime: now,
    });

    // Log check-out
    await AuditLog.create({
      entityType: "booking",
      entityId: booking.id,
      action: "check-out",
      performedBy,
      oldValues,
      newValues: {
        checkOutTime: now,
      },
    });

    return booking;
  } catch (error) {
    throw error;
  }
};

/**
 * Gets weekly attendance status for a user
 */
const getWeeklyAttendanceStatus = async (userId, year, weekNumber) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error("User not found");
    }

    // Get user bookings for the week
    const bookings = await Booking.findAll({
      where: {
        userId,
        weekNumber,
        status: "confirmed",
      },
    });

    // Count valid attendances (with check-in and check-out)
    const validAttendances = bookings.filter(
      (booking) => booking.checkInTime && booking.checkOutTime
    ).length;

    // Get user's required days per week
    const requiredDays = user.requiredDaysPerWeek || 2;

    // Determine status (red or green)
    const status = validAttendances >= requiredDays ? "green" : "red";

    return {
      userId,
      weekNumber,
      year,
      requiredDays,
      actualDays: validAttendances,
      status,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Creates automatic bookings for users based on their default work days
 */
const createAutoBookings = async (weekStartDate, performedBy) => {
  try {
    // Get all active users
    const users = await User.findAll({
      where: {
        isActive: true,
      },
    });

    const weekStart = new Date(weekStartDate);
    const weekNumber = getWeekNumber(weekStart);
    const year = weekStart.getFullYear();

    const results = {
      success: [],
      failed: [],
    };

    // Process each user
    for (const user of users) {
      try {
        // Get user's default work days (0 = Sunday, 1 = Monday, etc.)
        const defaultWorkDays = user.defaultWorkDays || [1, 2, 3, 4, 5]; // Default to weekdays

        // Create bookings for each work day
        for (const dayOfWeek of defaultWorkDays) {
          // Calculate the date for this day of the week
          const bookingDate = new Date(weekStart);
          bookingDate.setDate(
            weekStart.getDate() + ((dayOfWeek - weekStart.getDay() + 7) % 7)
          );

          // Format date for database (YYYY-MM-DD)
          const formattedDate = bookingDate.toISOString().split("T")[0];

          // Check if user already has a booking for this date
          const existingBooking = await Booking.findOne({
            where: {
              userId: user.id,
              bookingDate: formattedDate,
              status: { [Op.ne]: "cancelled" },
            },
          });

          // Skip if already booked
          if (existingBooking) {
            continue;
          }

          // Find an available seat
          const availableSeats = await getAvailableSeats(formattedDate);

          if (availableSeats.length === 0) {
            // No seats available
            results.failed.push({
              userId: user.id,
              username: user.username,
              date: formattedDate,
              reason: "No available seats",
            });
            continue;
          }

          // Choose the first available seat
          const seat = availableSeats[0];

          // Create booking
          const booking = await Booking.create({
            userId: user.id,
            seatId: seat.id,
            bookingDate: formattedDate,
            weekNumber,
            status: "confirmed",
            isAutoBooked: true,
          });

          // Log the action
          await AuditLog.create({
            entityType: "booking",
            entityId: booking.id,
            action: "auto-create",
            performedBy,
            newValues: {
              userId: user.id,
              seatId: seat.id,
              bookingDate: formattedDate,
              status: "confirmed",
              isAutoBooked: true,
            },
          });

          results.success.push({
            userId: user.id,
            username: user.username,
            date: formattedDate,
            seatNumber: seat.seatNumber,
          });
        }
      } catch (error) {
        results.failed.push({
          userId: user.id,
          username: user.username,
          reason: error.message,
        });
      }
    }

    return results;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createBooking,
  updateBooking,
  cancelBooking,
  getUserBookings,
  getBookingsByDate,
  getAvailableSeats,
  checkIn,
  checkOut,
  getWeeklyAttendanceStatus,
  createAutoBookings,
  getWeekNumber,
};
