// backend/controllers/dashboard.controller.js
const dashboardService = require("../services/dashboard.service");
const apiResponse = require("../utils/apiResponse");
const db = require("../db/models");

/**
 * Get employee dashboard data
 */
exports.getEmployeeDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getEmployeeDashboard(req.userId);
    return apiResponse.success(
      res,
      "Employee dashboard data retrieved successfully",
      data
    );
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get manager dashboard data
 */
exports.getManagerDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getManagerDashboard(req.userId);
    return apiResponse.success(
      res,
      "Manager dashboard data retrieved successfully",
      data
    );
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get today's attendance data
 */
exports.getTodayAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const today = date || new Date().toISOString().split('T')[0];
    
    // Get all bookings for today with user information
    const bookings = await db.booking.findAll({
      where: {
        bookingDate: today,
        status: 'confirmed'
      },
      include: [
        {
          model: db.user,
          attributes: ['id', 'username', 'email', 'fullName', 'department']
        }
      ]
    });
    
    // Get attendance records for today
    const attendanceRecords = await db.attendanceRecord.findAll({
      where: {
        connectionStartTime: {
          [db.Sequelize.Op.gte]: new Date(today)
        },
        connectionStartTime: {
          [db.Sequelize.Op.lt]: new Date(new Date(today).getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: [
        {
          model: db.user,
          attributes: ['id', 'username', 'email', 'fullName', 'department']
        }
      ]
    });
    
    // Create a combined report of bookings and attendance
    const report = bookings.map(booking => {
      // Find attendance record for this user if it exists
      const userAttendance = attendanceRecords.find(
        record => record.userId === booking.userId
      );
      
      // Check if the attendance was from office network
      const isOfficeNetwork = userAttendance ? userAttendance.ssid === 'GIGLABZ_5G' : false;
      
      return {
        id: booking.id,
        userId: booking.userId,
        user: booking.user,
        bookingDate: booking.bookingDate,
        checkInTime: booking.checkInTime,
        checkOutTime: booking.checkOutTime,
        network: userAttendance ? userAttendance.ssid : null,
        isOfficeNetwork: isOfficeNetwork,
        status: booking.checkInTime ? 'checked-in' : 'booked'
      };
    });
    
    // Add any attendance records for users without bookings
    attendanceRecords.forEach(record => {
      const hasBooking = bookings.some(booking => booking.userId === record.userId);
      
      if (!hasBooking) {
        report.push({
          id: `att-${record.id}`,
          userId: record.userId,
          user: record.user,
          bookingDate: today,
          checkInTime: record.connectionStartTime,
          checkOutTime: record.connectionEndTime,
          network: record.ssid,
          isOfficeNetwork: record.ssid === 'GIGLABZ_5G',
          status: 'attendance-only'
        });
      }
    });
    
    return apiResponse.success(
      res,
      'Today\'s attendance retrieved successfully',
      report
    );
  } catch (error) {
    console.error('Error retrieving attendance:', error);
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get weekly attendance report
 */
exports.getWeeklyAttendanceReport = async (req, res) => {
  try {
    const { weekNumber, year } = req.query;
    
    if (!weekNumber || !year) {
      return apiResponse.badRequest(res, 'Week number and year are required');
    }
    
    // Calculate the start and end dates of the week
    const currentYear = parseInt(year);
    const currentWeek = parseInt(weekNumber);
    
    // Find all bookings for this week with check-in status
    const bookings = await db.booking.findAll({
      where: {
        weekNumber: currentWeek,
        status: 'confirmed'
      },
      include: [
        {
          model: db.user,
          attributes: ['id', 'username', 'email', 'fullName', 'department']
        }
      ]
    });
    
    // Get unique users who had bookings this week
    const userIds = [...new Set(bookings.map(booking => booking.userId))];
    
    // Create a summary for each user
    const userSummaries = await Promise.all(userIds.map(async userId => {
      // Get all bookings for this user in the week
      const userBookings = bookings.filter(booking => booking.userId === userId);
      
      // Count checked-in days
      const checkedInDays = userBookings.filter(booking => booking.checkInTime).length;
      
      // Get the user's required days per week
      const user = await db.user.findByPk(userId);
      const requiredDays = user ? user.requiredDaysPerWeek || 2 : 2;
      
      return {
        userId,
        username: userBookings[0].user?.username || 'Unknown',
        fullName: userBookings[0].user?.fullName || 'Unknown',
        department: userBookings[0].user?.department || 'Unknown',
        totalBookings: userBookings.length,
        checkedInDays,
        requiredDays,
        complianceStatus: checkedInDays >= requiredDays ? 'compliant' : 'non-compliant'
      };
    }));
    
    return apiResponse.success(
      res,
      'Weekly attendance report retrieved successfully',
      {
        weekNumber: currentWeek,
        year: currentYear,
        users: userSummaries,
        compliantCount: userSummaries.filter(user => user.complianceStatus === 'compliant').length,
        nonCompliantCount: userSummaries.filter(user => user.complianceStatus === 'non-compliant').length
      }
    );
  } catch (error) {
    console.error('Error retrieving weekly attendance:', error);
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get monthly attendance report
 */
exports.getMonthlyAttendanceReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return apiResponse.badRequest(res, 'Month and year are required');
    }
    
    const currentMonth = parseInt(month);
    const currentYear = parseInt(year);
    
    // Create date range for the entire month
    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);
    
    // Find all bookings for this month
    const bookings = await db.booking.findAll({
      where: {
        bookingDate: {
          [db.Sequelize.Op.between]: [
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
          ]
        },
        status: 'confirmed'
      },
      include: [
        {
          model: db.user,
          attributes: ['id', 'username', 'email', 'fullName', 'department']
        }
      ]
    });
    
    // Get all attendance records for the month
    const attendanceRecords = await db.attendanceRecord.findAll({
      where: {
        connectionStartTime: {
          [db.Sequelize.Op.between]: [startDate, endDate]
        }
      },
      include: [
        {
          model: db.user,
          attributes: ['id', 'username', 'email', 'fullName', 'department']
        }
      ]
    });
    
    // Group by date
    const dateMap = {};
    
    // Process bookings by date
    bookings.forEach(booking => {
      const date = booking.bookingDate;
      if (!dateMap[date]) {
        dateMap[date] = { 
          date, 
          totalBookings: 0,
          checkedIn: 0,
          officeAttendance: 0
        };
      }
      
      dateMap[date].totalBookings++;
      
      if (booking.checkInTime) {
        dateMap[date].checkedIn++;
      }
    });
    
    // Process attendance records by date
    attendanceRecords.forEach(record => {
      const date = record.connectionStartTime.toISOString().split('T')[0];
      if (!dateMap[date]) {
        dateMap[date] = { 
          date, 
          totalBookings: 0,
          checkedIn: 0,
          officeAttendance: 0
        };
      }
      
      // Count office attendance
      if (record.ssid === 'GIGLABZ_5G') {
        dateMap[date].officeAttendance++;
      }
    });
    
    // Convert to array and sort by date
    const dailyReports = Object.values(dateMap).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    // Calculate monthly summary
    const totalBookings = dailyReports.reduce((sum, day) => sum + day.totalBookings, 0);
    const totalCheckedIn = dailyReports.reduce((sum, day) => sum + day.checkedIn, 0);
    const totalOfficeAttendance = dailyReports.reduce((sum, day) => sum + day.officeAttendance, 0);
    
    return apiResponse.success(
      res,
      'Monthly attendance report retrieved successfully',
      {
        month: currentMonth,
        year: currentYear,
        dailyReports,
        summary: {
          totalBookings,
          totalCheckedIn,
          totalOfficeAttendance,
          checkInRate: totalBookings > 0 ? Math.round((totalCheckedIn / totalBookings) * 100) : 0,
          officeRate: totalCheckedIn > 0 ? Math.round((totalOfficeAttendance / totalCheckedIn) * 100) : 0
        }
      }
    );
  } catch (error) {
    console.error('Error retrieving monthly attendance:', error);
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get admin dashboard data
 */
exports.getAdminDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getAdminDashboard();
    return apiResponse.success(
      res,
      "Admin dashboard data retrieved successfully",
      data
    );
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};