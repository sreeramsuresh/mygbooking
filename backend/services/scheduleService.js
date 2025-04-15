// backend/services/scheduleService.js
const { Schedule, User, Booking, Compliance, Seat } = require("../models");
const dateUtils = require("../utils/dateUtils");
const { sequelize } = require("../models");

// Get schedule for specific user
const getUserSchedule = async (userId) => {
  try {
    const schedules = await Schedule.findAll({
      where: { user_id: userId },
      order: [["day_of_week", "ASC"]],
    });

    return schedules;
  } catch (error) {
    console.error("Error fetching user schedule:", error);
    throw error;
  }
};

// Update user schedule (used by admin/manager)
const updateUserSchedule = async (userId, scheduleDays) => {
  const transaction = await sequelize.transaction();

  try {
    // Delete existing schedule for user
    await Schedule.destroy({
      where: { user_id: userId },
      transaction,
    });

    // Create new schedule entries
    const scheduleEntries = scheduleDays.map((day) => ({
      user_id: userId,
      day_of_week: day,
    }));

    await Schedule.bulkCreate(scheduleEntries, { transaction });

    await transaction.commit();
    return { success: true, message: "Schedule updated successfully" };
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating user schedule:", error);
    throw error;
  }
};

// Calculate weekly compliance for all users
const calculateWeeklyCompliance = async () => {
  const transaction = await sequelize.transaction();

  try {
    const currentWeek = dateUtils.getCurrentWeekNumber();
    const currentYear = new Date().getFullYear();

    // Get all users
    const users = await User.findAll({
      include: [
        {
          model: Schedule,
          as: "schedules",
        },
      ],
    });

    for (const user of users) {
      // Count required days
      const requiredDays = user.schedules.length;

      // Count actual days attended
      const attendedBookings = await Booking.count({
        where: {
          user_id: user.id,
          week_number: currentWeek,
          year: currentYear,
          status: "checked_in",
        },
      });

      // Determine compliance status
      let status = "non_compliant";
      if (attendedBookings >= requiredDays) {
        status = "compliant";
      }

      // Update or create compliance record
      await Compliance.upsert(
        {
          user_id: user.id,
          week_number: currentWeek,
          year: currentYear,
          required_days: requiredDays,
          actual_days: attendedBookings,
          status,
        },
        { transaction }
      );
    }

    await transaction.commit();
    return { success: true, message: "Compliance calculated successfully" };
  } catch (error) {
    await transaction.rollback();
    console.error("Error calculating weekly compliance:", error);
    throw error;
  }
};

// Get weekly compliance stats (for manager dashboard)
const getWeeklyComplianceStats = async () => {
  try {
    const currentWeek = dateUtils.getCurrentWeekNumber();
    const currentYear = new Date().getFullYear();

    // Count total employees
    const totalEmployees = await User.count({
      where: { role: "employee" },
    });

    // Count compliant employees
    const compliantEmployees = await Compliance.count({
      where: {
        week_number: currentWeek,
        year: currentYear,
        status: "compliant",
      },
    });

    // Count non-compliant employees
    const nonCompliantEmployees = await Compliance.count({
      where: {
        week_number: currentWeek,
        year: currentYear,
        status: "non_compliant",
      },
    });

    // Calculate pending (those without a compliance record yet)
    const pending = totalEmployees - compliantEmployees - nonCompliantEmployees;

    return {
      totalEmployees,
      compliant: compliantEmployees,
      nonCompliant: nonCompliantEmployees,
      pending,
    };
  } catch (error) {
    console.error("Error fetching compliance stats:", error);
    throw error;
  }
};

// Generate weekly bookings for all users based on their schedule
const generateWeeklyBookings = async () => {
  const transaction = await sequelize.transaction();

  try {
    // Get start and end dates for the upcoming week
    const { startDate, endDate } = dateUtils.getNextWeekDates();
    
    // Get all users with their schedules
    const users = await User.findAll({
      include: [
        {
          model: Schedule,
          as: 'schedules',
          where: { is_active: true },
        },
      ],
    });

    const bookingsCreated = [];

    // For each user
    for (const user of users) {
      // For each scheduled day
      for (const schedule of user.schedules) {
        // Calculate the actual date for this day in the upcoming week
        const dayOfWeek = schedule.day_of_week;
        const bookingDate = dateUtils.getDayInNextWeek(dayOfWeek);
        
        // Skip if the date is outside our range
        if (bookingDate < startDate || bookingDate > endDate) {
          continue;
        }

        // Find an available seat
        const availableSeats = await sequelize.query(
          `SELECT s.id FROM seats s 
           LEFT JOIN bookings b ON s.id = b.seat_id AND b.booking_date = :bookingDate
           WHERE b.id IS NULL
           ORDER BY s.seat_number
           LIMIT 1`,
          {
            replacements: { bookingDate: bookingDate.toISOString().split('T')[0] },
            type: sequelize.QueryTypes.SELECT,
            transaction,
          }
        );

        if (availableSeats.length === 0) {
          console.warn(`No seats available for user ${user.id} on ${bookingDate}`);
          continue;
        }

        const seatId = availableSeats[0].id;

        // Create booking
        const booking = await Booking.create({
          user_id: user.id,
          seat_id: seatId,
          booking_date: bookingDate,
          status: 'booked',
          created_at: new Date(),
          updated_at: new Date(),
        }, { transaction });

        bookingsCreated.push(booking);
      }
    }

    await transaction.commit();
    return { 
      success: true, 
      message: `${bookingsCreated.length} bookings created successfully for next week` 
    };
  } catch (error) {
    await transaction.rollback();
    console.error('Error generating weekly bookings:', error);
    throw error;
  }
};

// Get available days for a user to book based on their schedule
const getAvailableDaysForBooking = async (userId, startDate, endDate) => {
  try {
    // Get user's schedule
    const userSchedule = await Schedule.findAll({
      where: { user_id: userId, is_active: true },
      attributes: ['day_of_week'],
    });
    
    // Convert to array of day numbers
    const scheduledDays = userSchedule.map(s => s.day_of_week);
    
    // Get all dates between start and end dates
    const dateRange = dateUtils.getDatesBetween(startDate, endDate);
    
    // Filter dates that match user's scheduled days
    const availableDates = dateRange.filter(date => {
      const dayOfWeek = date.getDay();
      return scheduledDays.includes(dayOfWeek);
    });
    
    // Check which of these dates already have bookings
    const existingBookings = await Booking.findAll({
      where: {
        user_id: userId,
        booking_date: {
          [sequelize.Op.between]: [startDate, endDate],
        },
      },
      attributes: ['booking_date'],
    });
    
    // Convert to array of date strings for easy comparison
    const bookedDates = existingBookings.map(b => 
      b.booking_date.toISOString().split('T')[0]
    );
    
    // Filter out already booked dates
    const availableDaysForBooking = availableDates.filter(date => 
      !bookedDates.includes(date.toISOString().split('T')[0])
    );
    
    return availableDaysForBooking;
  } catch (error) {
    console.error('Error getting available days for booking:', error);
    throw error;
  }
};

module.exports = {
  getUserSchedule,
  updateUserSchedule,
  calculateWeeklyCompliance,
  getWeeklyComplianceStats,
  generateWeeklyBookings,
  getAvailableDaysForBooking
};