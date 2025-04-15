// backend/controllers/attendanceController.js
const { Attendance, Booking } = require("../models");
const ipValidator = require("../utils/ipValidator");

// Check in user when they connect to office network
const checkInUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const networkSsid = req.body.ssid;

    // Validate if IP is from office network (192.168.1.x)
    if (!ipValidator.isOfficeNetwork(ipAddress)) {
      return res.status(400).json({
        success: false,
        message: "Not connected to office network",
      });
    }

    // Validate if SSID matches office network
    if (networkSsid !== "GigLabz") {
      return res.status(400).json({
        success: false,
        message: "Not connected to office WiFi",
      });
    }

    // Find active booking for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const booking = await Booking.findOne({
      where: {
        user_id: userId,
        booking_date: today,
        status: "booked",
      },
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "No booking found for today",
      });
    }

    // Create attendance record
    const attendance = await Attendance.create({
      user_id: userId,
      booking_id: booking.id,
      check_in_time: new Date(),
      ip_address: ipAddress,
      network_ssid: networkSsid,
    });

    // Update booking status
    await booking.update({ status: "checked_in", checked_in_at: new Date() });

    return res.status(200).json({
      success: true,
      message: "Check-in successful",
      data: attendance,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during check-in",
      error: error.message,
    });
  }
};

module.exports = {
  checkInUser,
};
