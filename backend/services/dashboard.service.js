// backend/services/dashboard.service.js
const db = require("../db/models");
const { Op } = db.Sequelize;
const Booking = db.booking;
const User = db.user;
const Request = db.request;
const Seat = db.seat;
const bookingService = require("./booking.service");

/**
 * Get employee dashboard data
 */
const getEmployeeDashboard = async (userId) => {
  try {
    const today = new Date();
    const currentWeekNumber = bookingService.getWeekNumber(today);
    const currentYear = today.getFullYear();

    // Format today's date for database queries
    const formattedToday = today.toISOString().split("T")[0];

    // Get user information
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get weekly attendance status
    const weeklyStatus = await bookingService.getWeeklyAttendanceStatus(
      userId,
      currentYear,
      currentWeekNumber
    );

    // Get today's booking
    const todayBooking = await Booking.findOne({
      where: {
        userId,
        bookingDate: formattedToday,
        status: "confirmed",
      },
      include: [
        {
          model: Seat,
          attributes: ["id", "seatNumber", "description"],
        },
      ],
    });

    // Get upcoming bookings for the current and next 3 weeks (4 weeks total)
    const startOfWeek = new Date(today);
    startOfWeek.setDate(
      today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)
    ); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfFourWeeks = new Date(startOfWeek);
    endOfFourWeeks.setDate(startOfWeek.getDate() + (6 + 21)); // Current week Sunday + 3 more weeks
    endOfFourWeeks.setHours(23, 59, 59, 999);

    const formattedStartOfWeek = startOfWeek.toISOString().split("T")[0];
    const formattedEndOfFourWeeks = endOfFourWeeks.toISOString().split("T")[0];

    console.log(`Fetching bookings from ${formattedStartOfWeek} to ${formattedEndOfFourWeeks} for user ${userId}`);

    // Get actual bookings
    const upcomingBookings = await Booking.findAll({
      where: {
        userId,
        bookingDate: {
          [Op.between]: [formattedStartOfWeek, formattedEndOfFourWeeks],
        },
        bookingDate: {
          [Op.gt]: formattedToday,
        },
        status: "confirmed",
      },
      include: [
        {
          model: Seat,
          attributes: ["id", "seatNumber", "description"],
        },
      ],
      order: [["bookingDate", "ASC"]],
    });
    
    console.log(`Found ${upcomingBookings.length} upcoming bookings`);
    
    // Get pending requests before any potential early return
    const pendingRequests = await Request.findAll({
      where: {
        userId,
        status: "pending",
      },
      order: [["createdAt", "DESC"]],
      limit: 5,
    });

    // Get remaining office days for the current week
    const requiredDays = user.requiredDaysPerWeek || 2;
    const bookedDays = await Booking.count({
      where: {
        userId,
        bookingDate: {
          [Op.between]: [formattedStartOfWeek, formattedEndOfFourWeeks],
        },
        status: "confirmed",
        [Op.or]: [
          { checkInTime: { [Op.ne]: null } },
          { bookingDate: { [Op.gte]: formattedToday } },
        ],
      },
    });

    const remainingDays = Math.max(0, requiredDays - bookedDays);
    
    // If no bookings found, suggest bookings based on user preferences
    if (upcomingBookings.length === 0) {
      console.log(`No bookings found for user ${userId}. Suggesting slots based on preferences.`);
      
      // Get user preferences
      const defaultWorkDays = user.defaultWorkDays || [1, 2, 3, 4, 5]; // Default to weekdays (1=Monday)
      const requiredDaysPerWeek = user.requiredDaysPerWeek || 2;
      
      // Use only required number of days
      const daysToShow = defaultWorkDays.slice(0, requiredDaysPerWeek);
      
      console.log(`User preferred days: ${JSON.stringify(daysToShow)}`);
      
      // Generate suggested booking dates for 4 weeks
      const suggestedBookings = [];
      
      for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
        const currentWeekStart = new Date(startOfWeek);
        currentWeekStart.setDate(currentWeekStart.getDate() + (weekOffset * 7));
        
        for (const dayOfWeek of daysToShow) {
          const bookingDate = new Date(currentWeekStart);
          bookingDate.setDate(
            currentWeekStart.getDate() + ((dayOfWeek - currentWeekStart.getDay() + 7) % 7)
          );
          
          // Skip dates in the past
          if (bookingDate <= today) continue;
          
          // Format date for display
          const formattedDate = bookingDate.toISOString().split("T")[0];
          
          // Add this as a suggested booking
          suggestedBookings.push({
            suggestedDate: formattedDate,
            dayOfWeek: dayOfWeek,
            isSuggested: true, // Flag to identify suggestions vs. actual bookings
            status: "suggested", // To differentiate in UI
          });
        }
      }
      
      console.log(`Generated ${suggestedBookings.length} suggested booking slots`);
      return {
        user: {
          id: user.id,
          username: user.username,
          fullName: user.fullName,
          department: user.department,
          defaultWorkDays: user.defaultWorkDays,
          requiredDaysPerWeek: user.requiredDaysPerWeek,
        },
        weeklyStatus,
        todayBooking,
        upcomingBookings: [], // Real bookings
        suggestedBookings, // Suggested bookings based on preferences
        pendingRequests,
        remainingDays,
        currentWeek: {
          startDate: formattedStartOfWeek,
          endDate: formattedEndOfFourWeeks,
          weekNumber: currentWeekNumber,
        },
      };
    }


    return {
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        department: user.department,
        defaultWorkDays: user.defaultWorkDays,
        requiredDaysPerWeek: user.requiredDaysPerWeek,
      },
      weeklyStatus,
      todayBooking,
      upcomingBookings,
      pendingRequests,
      remainingDays,
      currentWeek: {
        startDate: formattedStartOfWeek,
        endDate: formattedEndOfFourWeeks,
        weekNumber: currentWeekNumber,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get manager dashboard data
 */
const getManagerDashboard = async (managerId) => {
  try {
    const today = new Date();
    const currentWeekNumber = bookingService.getWeekNumber(today);
    const currentYear = today.getFullYear();

    // Format today's date for database queries
    const formattedToday = today.toISOString().split("T")[0];

    // Get team members (users where this user is the manager)
    const teamMembers = await User.findAll({
      where: {
        managerId,
        isActive: true,
      },
      attributes: [
        "id",
        "username",
        "fullName",
        "department",
        "requiredDaysPerWeek",
        "defaultWorkDays",
      ],
    });

    const teamMemberIds = teamMembers.map((member) => member.id);

    // Get pending requests
    const pendingRequests = await Request.findAll({
      where: {
        managerId,
        status: "pending",
      },
      include: [
        {
          model: User,
          attributes: ["id", "username", "fullName", "department"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    // Get today's attendance
    const todayAttendance = await Booking.findAll({
      where: {
        userId: {
          [Op.in]: teamMemberIds,
        },
        bookingDate: formattedToday,
        status: "confirmed",
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

    // Get attendance compliance for the team
    const startOfWeek = new Date(today);
    startOfWeek.setDate(
      today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)
    ); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Sunday
    endOfWeek.setHours(23, 59, 59, 999);

    const formattedStartOfWeek = startOfWeek.toISOString().split("T")[0];
    const formattedEndOfWeek = endOfWeek.toISOString().split("T")[0];

    // Team attendance compliance
    const teamCompliance = [];

    for (const member of teamMembers) {
      const weeklyStatus = await bookingService.getWeeklyAttendanceStatus(
        member.id,
        currentYear,
        currentWeekNumber
      );

      const memberBookings = await Booking.findAll({
        where: {
          userId: member.id,
          bookingDate: {
            [Op.between]: [formattedStartOfWeek, formattedEndOfWeek],
          },
          status: "confirmed",
        },
        attributes: ["id", "bookingDate", "checkInTime", "checkOutTime"],
      });

      teamCompliance.push({
        user: {
          id: member.id,
          username: member.username,
          fullName: member.fullName,
          department: member.department,
        },
        weeklyStatus,
        bookings: memberBookings,
        requiredDays: member.requiredDaysPerWeek || 2,
        actualDays: memberBookings.filter(
          (booking) => booking.checkInTime && booking.checkOutTime
        ).length,
      });
    }

    // Get seat availability for today
    const availableSeats = await bookingService.getAvailableSeats(
      formattedToday
    );
    const totalSeats = await Seat.count({ where: { isActive: true } });

    return {
      teamSize: teamMembers.length,
      pendingRequests: {
        count: pendingRequests.length,
        items: pendingRequests,
      },
      todayAttendance: {
        count: todayAttendance.length,
        items: todayAttendance,
      },
      teamCompliance,
      seatAvailability: {
        available: availableSeats.length,
        total: totalSeats,
        percentage: Math.round((availableSeats.length / totalSeats) * 100),
      },
      currentWeek: {
        startDate: formattedStartOfWeek,
        endDate: formattedEndOfWeek,
        weekNumber: currentWeekNumber,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get admin dashboard data
 */
const getAdminDashboard = async () => {
  try {
    const today = new Date();

    // Format today's date for database queries
    const formattedToday = today.toISOString().split("T")[0];

    // Get users count by role
    const adminCount = await db.sequelize.query(
      `
      SELECT COUNT(DISTINCT "userId") as count
      FROM user_roles ur
      JOIN roles r ON ur."roleId" = r.id
      WHERE r.name = 'admin'
    `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const managerCount = await db.sequelize.query(
      `
      SELECT COUNT(DISTINCT "userId") as count
      FROM user_roles ur
      JOIN roles r ON ur."roleId" = r.id
      WHERE r.name = 'manager'
    `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    const employeeCount = await db.sequelize.query(
      `
      SELECT COUNT(DISTINCT "userId") as count
      FROM user_roles ur
      JOIN roles r ON ur."roleId" = r.id
      WHERE r.name = 'employee'
    `,
      { type: db.sequelize.QueryTypes.SELECT }
    );

    // Get active users count
    const activeUsersCount = await User.count({ where: { isActive: true } });

    // Get seat utilization
    const totalSeats = await Seat.count({ where: { isActive: true } });
    const bookedSeatsToday = await Booking.count({
      where: {
        bookingDate: formattedToday,
        status: "confirmed",
      },
    });

    // Get pending regularization requests
    const pendingRegularizationCount = await Request.count({
      where: {
        type: "regularization",
        status: "pending",
      },
    });

    // Get pending WFH requests
    const pendingWfhCount = await Request.count({
      where: {
        type: "wfh",
        status: "pending",
      },
    });

    // Get today's attendance
    const todayAttendanceCount = await Booking.count({
      where: {
        bookingDate: formattedToday,
        checkInTime: { [Op.ne]: null },
      },
    });

    // Get weekly trend data
    const startOfWeek = new Date(today);
    startOfWeek.setDate(
      today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)
    ); // Monday
    startOfWeek.setHours(0, 0, 0, 0);

    const weeklyTrend = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      const formattedDate = currentDate.toISOString().split("T")[0];

      const bookingsCount = await Booking.count({
        where: {
          bookingDate: formattedDate,
          status: "confirmed",
        },
      });

      const attendanceCount = await Booking.count({
        where: {
          bookingDate: formattedDate,
          checkInTime: { [Op.ne]: null },
        },
      });

      weeklyTrend.push({
        date: formattedDate,
        day: currentDate.toLocaleDateString("en-US", { weekday: "short" }),
        bookings: bookingsCount,
        attendance: attendanceCount,
      });
    }

    return {
      userCounts: {
        admin: adminCount[0]?.count || 0,
        manager: managerCount[0]?.count || 0,
        employee: employeeCount[0]?.count || 0,
        active: activeUsersCount,
      },
      seatUtilization: {
        total: totalSeats,
        booked: bookedSeatsToday,
        available: totalSeats - bookedSeatsToday,
        utilization:
          totalSeats > 0
            ? Math.round((bookedSeatsToday / totalSeats) * 100)
            : 0,
      },
      pendingRequests: {
        regularization: pendingRegularizationCount,
        wfh: pendingWfhCount,
        total: pendingRegularizationCount + pendingWfhCount,
      },
      todayAttendance: todayAttendanceCount,
      weeklyTrend,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getEmployeeDashboard,
  getManagerDashboard,
  getAdminDashboard,
};
