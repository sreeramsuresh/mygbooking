// backend/services/scheduleService.js
const { Schedule, User, Booking, Compliance } = require("../models");
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

module.exports = {
  getUserSchedule,
  updateUserSchedule,
  calculateWeeklyCompliance,
  getWeeklyComplianceStats,
};
