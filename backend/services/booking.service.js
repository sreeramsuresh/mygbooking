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
    
    // Get user and check their required days per week
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    // Count existing bookings for this week
    const existingWeeklyBookings = await Booking.count({
      where: {
        userId,
        weekNumber,
        status: { [Op.ne]: "cancelled" },
      },
    });
    
    // Check if user is exceeding their required days per week
    if (existingWeeklyBookings >= user.requiredDaysPerWeek) {
      throw new Error(`You have already booked your required ${user.requiredDaysPerWeek} days for this week. Cancel an existing booking if you want to book a different day.`);
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
    
    // If booking date is changing, check if user already has a booking for the new date
    if (updates.bookingDate && updates.bookingDate !== booking.bookingDate) {
      const userBookingOnNewDate = await Booking.findOne({
        where: {
          userId: booking.userId,
          bookingDate: updates.bookingDate,
          status: { [Op.ne]: "cancelled" },
          id: { [Op.ne]: bookingId },
        },
      });

      if (userBookingOnNewDate) {
        throw new Error("You already have a booking for the selected date");
      }
      
      // If date is changing, recalculate week number
      if (!updates.weekNumber) {
        const newDate = new Date(updates.bookingDate);
        const newWeekNumber = getWeekNumber(newDate);
        updates.weekNumber = newWeekNumber;
        
        // If moving to a different week, check required days
        if (newWeekNumber !== booking.weekNumber) {
          // Get user and check their required days per week
          const user = await User.findByPk(booking.userId);
          if (!user) {
            throw new Error("User not found");
          }
          
          // Count existing bookings for the new week
          const existingWeeklyBookings = await Booking.count({
            where: {
              userId: booking.userId,
              weekNumber: newWeekNumber,
              status: { [Op.ne]: "cancelled" },
              id: { [Op.ne]: bookingId }, // Exclude current booking
            },
          });
          
          // Check if user is exceeding their required days per week
          if (existingWeeklyBookings >= user.requiredDaysPerWeek) {
            throw new Error(`You have already booked your required ${user.requiredDaysPerWeek} days for the selected week. Cancel an existing booking if you want to book a different day.`);
          }
        }
      }
    }

    // Determine which date to use for seat availability check
    const dateToCheck = updates.bookingDate || booking.bookingDate;
    
    // Check if changing seat and the new seat is available
    if (updates.seatId && updates.seatId !== booking.seatId) {
      const existingBooking = await Booking.findOne({
        where: {
          seatId: updates.seatId,
          bookingDate: dateToCheck,
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
    console.log(`Getting available seats for date: ${date}`);
    
    // Get all active seats
    const allSeats = await Seat.findAll({
      where: {
        isActive: true,
      },
    });

    console.log(`Total active seats found: ${allSeats.length}`);
    
    if (allSeats.length === 0) {
      console.log('WARNING: No active seats found in the database!');
      // Return an empty response with proper structure
      return {
        availableSeats: [],
        bookedSeats: [],
        totalSeats: 0,
        bookedCount: 0,
        availableCount: 0
      };
    }

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

    console.log(`Bookings found for date ${date}: ${bookingsWithDetails.length}`);

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
    
    console.log(`Available seats for date ${date}: ${availableSeats.length}`);

    // Return both available and booked seats
    return {
      availableSeats,
      bookedSeats: bookedSeatsWithInfo,
      totalSeats: allSeats.length,
      bookedCount: bookedSeatsWithInfo.length,
      availableCount: availableSeats.length
    };
  } catch (error) {
    console.error(`Error getting available seats: ${error.message}`);
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
        
        // Get user's required days per week
        const requiredDaysPerWeek = user.requiredDaysPerWeek || 2;
        
        // Only use the required number of days from the default work days
        const daysToBook = defaultWorkDays.slice(0, requiredDaysPerWeek);
        
        // Create bookings for each selected work day
        for (const dayOfWeek of daysToBook) {
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

/**
 * Cancels all bookings for a user and creates fresh auto-bookings
 */
const resetAndAutoBookForUser = async (userId, weekStartDate, performedBy) => {
  try {
    // Find all future bookings for the user
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const userBookings = await Booking.findAll({
      where: {
        userId,
        bookingDate: { [Op.gte]: today.toISOString().split('T')[0] },
        status: { [Op.ne]: "cancelled" },
      },
    });
    
    // Cancel all existing bookings
    for (const booking of userBookings) {
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
          reason: "Reset for auto-booking",
        },
      });
    }
    
    // Get the user
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    const weekStart = new Date(weekStartDate);
    const weekNumber = getWeekNumber(weekStart);
    const year = weekStart.getFullYear();
    
    const results = {
      success: [],
      failed: [],
      cancelled: userBookings.length,
    };
    
    // Get user's default work days and required days per week
    const defaultWorkDays = user.defaultWorkDays || [1, 2, 3, 4, 5];
    const requiredDaysPerWeek = user.requiredDaysPerWeek || 2;
    
    // Only use the required number of days
    const daysToBook = defaultWorkDays.slice(0, requiredDaysPerWeek);
    
    // Create bookings for each selected work day
    for (const dayOfWeek of daysToBook) {
      // Calculate the date for this day of the week
      const bookingDate = new Date(weekStart);
      bookingDate.setDate(
        weekStart.getDate() + ((dayOfWeek - weekStart.getDay() + 7) % 7)
      );
      
      // Format date for database (YYYY-MM-DD)
      const formattedDate = bookingDate.toISOString().split("T")[0];
      
      // Find available seats for this date
      const availableSeatsResponse = await getAvailableSeats(formattedDate);
      
      console.log(`Creating booking for user ${userId} on date ${formattedDate}`);
      console.log('Available seats response:', JSON.stringify(availableSeatsResponse));
      
      // Make sure we have available seats and can access them
      if (!availableSeatsResponse || !availableSeatsResponse.availableSeats || availableSeatsResponse.availableSeats.length === 0) {
        // No seats available
        console.log(`No seats available for ${formattedDate}`);
        results.failed.push({
          date: formattedDate,
          reason: "No available seats",
        });
        continue;
      }
      
      // Choose the first available seat
      const seat = availableSeatsResponse.availableSeats[0];
      
      // Create booking
      const booking = await Booking.create({
        userId,
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
          userId,
          seatId: seat.id,
          bookingDate: formattedDate,
          status: "confirmed",
          isAutoBooked: true,
        },
      });
      
      results.success.push({
        date: formattedDate,
        seatNumber: seat.seatNumber,
      });
    }
    
    return results;
  } catch (error) {
    throw error;
  }
};

/**
 * Creates automatic bookings for a specific user
 */
const createAutoBookingsForUser = async (userId, weekStartDate, performedBy) => {
  const logger = require("../utils/logger");
  
  try {
    // Get the user
    const user = await User.findByPk(userId);
    if (!user) {
      logger.error(`User ID ${userId} not found in database`);
      throw new Error("User not found");
    }
    
    const weekStart = new Date(weekStartDate);
    const weekNumber = getWeekNumber(weekStart);
    
    const results = {
      success: [],
      failed: [],
    };
    
    // Get user's default work days and required days
    const defaultWorkDays = user.defaultWorkDays || [1, 2, 3, 4, 5]; // Default to weekdays
    const requiredDaysPerWeek = user.requiredDaysPerWeek || 2;
    
    logger.info(`Creating auto bookings for user ${userId} (${user.username}) with:`);
    logger.info(`- Default work days: ${JSON.stringify(defaultWorkDays)}`);
    logger.info(`- Required days per week: ${requiredDaysPerWeek}`);
    
    // Validate user preferences
    if (!defaultWorkDays || !Array.isArray(defaultWorkDays) || defaultWorkDays.length === 0) {
      logger.error(`Invalid defaultWorkDays for user ${userId}: ${JSON.stringify(defaultWorkDays)}`);
      return {
        success: [],
        failed: [{
          reason: "Invalid or missing defaultWorkDays in user preferences"
        }]
      };
    }
    
    if (!requiredDaysPerWeek || requiredDaysPerWeek <= 0) {
      logger.error(`Invalid requiredDaysPerWeek for user ${userId}: ${requiredDaysPerWeek}`);
      return {
        success: [],
        failed: [{
          reason: "Invalid or missing requiredDaysPerWeek in user preferences"
        }]
      };
    }
    
    // Use only the required number of days from the default days
    const daysToBook = defaultWorkDays.slice(0, requiredDaysPerWeek);
    logger.info(`- Days that will be booked: ${JSON.stringify(daysToBook)}`);
    
    if (daysToBook.length === 0) {
      logger.error(`No days to book for user ${userId} - defaultWorkDays may be empty or invalid`);
      return {
        success: [],
        failed: [{
          reason: "No valid days to book - user preferences may not be set correctly"
        }]
      };
    }
    
    // Skip the first week (week 1) to allow for manual overrides
    // Only auto-book weeks 2, 3, and 4
    
    // Create bookings for weeks 2-4
    for (let weekOffset = 1; weekOffset < 4; weekOffset++) {
      const currentWeekStart = new Date(weekStart);
      currentWeekStart.setDate(currentWeekStart.getDate() + (weekOffset * 7));
      const currentWeekNumber = getWeekNumber(currentWeekStart);
      const year = currentWeekStart.getFullYear();
      
      logger.info(`Processing week ${weekOffset+1} (offset ${weekOffset}) starting ${currentWeekStart.toISOString().split('T')[0]}`);
      
      // Create bookings for each selected work day in this week
      for (const dayOfWeek of daysToBook) {
        // Calculate the date for this day of the week
        const bookingDate = new Date(currentWeekStart);
        bookingDate.setDate(
          currentWeekStart.getDate() + ((dayOfWeek - currentWeekStart.getDay() + 7) % 7)
        );
        
        // Format date for database (YYYY-MM-DD)
        const formattedDate = bookingDate.toISOString().split("T")[0];
        
        logger.info(`Week ${weekOffset+1}: Attempting to book day ${dayOfWeek} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dayOfWeek]}) on ${formattedDate}`);
        
        // Check if user already has a booking for this date
        const existingBooking = await Booking.findOne({
          where: {
            userId,
            bookingDate: formattedDate,
            status: { [Op.ne]: "cancelled" },
          },
        });
        
        // Skip if already booked
        if (existingBooking) {
          logger.info(`User ${userId} already has booking ID ${existingBooking.id} for date ${formattedDate} - skipping`);
          continue;
        }
        
        try {
          // Find an available seat
          logger.info(`Looking for available seats on ${formattedDate}`);
          const availableSeatsData = await getAvailableSeats(formattedDate);
          
          if (!availableSeatsData || !availableSeatsData.availableSeats || availableSeatsData.availableSeats.length === 0) {
            // No seats available
            logger.warn(`No seats available for date ${formattedDate}`);
            results.failed.push({
              date: formattedDate,
              reason: "No available seats",
            });
            continue;
          }
          
          logger.info(`Found ${availableSeatsData.availableSeats.length} available seats for date ${formattedDate}`);
          
          // Choose the first available seat
          const seat = availableSeatsData.availableSeats[0];
          
          // Create booking
          logger.info(`Creating auto-booking for user ${userId}, seat ${seat.id}, date ${formattedDate}`);
          const booking = await Booking.create({
            userId,
            seatId: seat.id,
            bookingDate: formattedDate,
            weekNumber: currentWeekNumber,
            status: "confirmed",
            isAutoBooked: true,
          });
          logger.info(`Auto-booking created successfully with ID ${booking.id}`);
          
          // Log the action
          await AuditLog.create({
            entityType: "booking",
            entityId: booking.id,
            action: "auto-create",
            performedBy,
            newValues: {
              userId,
              seatId: seat.id,
              bookingDate: formattedDate,
              status: "confirmed",
              isAutoBooked: true,
            },
          });
          
          results.success.push({
            date: formattedDate,
            seatNumber: seat.seatNumber,
          });
        } catch (seatError) {
          logger.error(`Error finding seats or creating booking for user ${userId} on date ${formattedDate}:`, seatError);
          results.failed.push({
            date: formattedDate,
            reason: `Error: ${seatError.message}`,
          });
        }
      }
    }
    
    logger.info(`Auto-booking completed for user ${userId}: ${results.success.length} bookings created, ${results.failed.length} failed`);
    return results;
  } catch (error) {
    logger.error(`Unexpected error in createAutoBookingsForUser for user ${userId}:`, error);
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
  resetAndAutoBookForUser,
  createAutoBookingsForUser,
  getWeekNumber,
};
