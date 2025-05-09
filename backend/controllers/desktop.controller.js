// backend/controllers/desktop.controller.js
const db = require("../db/models");
const config = require("../config/auth.config");
const User = db.user;
const DesktopSession = db.desktopSession; // We'll need to create this model
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const apiResponse = require("../utils/apiResponse");

// Utility function to format dates in Indian Standard Time
function formatDateTimeIST(date) {
  if (!date) return null;
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .format(date)
    .replace(/\//g, "-");
}

/**
 * Handle desktop application login
 */
exports.desktopLogin = async (req, res) => {
  try {
    const { email, password, macAddress, ssid } = req.body;

    // Validate required fields
    if (!email || !password || !macAddress || !ssid) {
      return apiResponse.badRequest(
        res,
        "Email, password, MAC address, and SSID are required"
      );
    }

    // Check if the network is GIGLABZ_5G for attendance tracking purposes
    const isOfficeNetwork = ssid === "GIGLABZ_5G";

    // We'll record attendance for office network connections only
    // but allow connections from any network
    console.log(
      `Login from SSID: ${ssid} - Office network: ${
        isOfficeNetwork ? "Yes" : "No"
      }`
    );

    // Find user by email
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return apiResponse.unauthorized(res, "User not found");
    }

    // Check if user is active
    if (!user.isActive) {
      return apiResponse.unauthorized(res, "Account is inactive");
    }

    // Verify password
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return apiResponse.unauthorized(res, "Invalid password");
    }

    // Check if user already has a desktop session with a different MAC address
    const existingSession = await DesktopSession.findOne({
      where: { userId: user.id, isActive: true },
    });

    if (existingSession && existingSession.macAddress !== macAddress) {
      return apiResponse.badRequest(
        res,
        "User already registered with a different device"
      );
    }

    // Generate non-expiring JWT token
    const token = jwt.sign(
      { id: user.id, isDesktopClient: true },
      config.secret
      // No expiresIn parameter, so token won't expire
    );

    // Create or update desktop session
    if (existingSession) {
      await existingSession.update({
        token,
        lastActivityAt: new Date(),
      });
    } else {
      await DesktopSession.create({
        userId: user.id,
        macAddress,
        ssid,
        token,
        isActive: true,
        lastActivityAt: new Date(),
      });
    }

    // Return user information and token
    return apiResponse.success(res, "Login successful", {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      accessToken: token,
    });
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Handle desktop application logout
 */
exports.desktopLogout = async (req, res) => {
  try {
    // Find active session for this user
    const activeSession = await DesktopSession.findOne({
      where: { userId: req.userId, isActive: true },
    });

    if (activeSession) {
      // Mark the desktop session as inactive
      await activeSession.update({ isActive: false });

      // Also check if there's an active attendance record for this user and mark it as closed
      const AttendanceRecord = db.attendanceRecord;
      const activeRecord = await AttendanceRecord.findOne({
        where: {
          userId: req.userId,
          macAddress: activeSession.macAddress,
          isActive: true,
        },
      });

      if (activeRecord) {
        // Calculate duration and close the attendance record
        const now = new Date();
        const duration =
          (now.getTime() - activeRecord.connectionStartTime.getTime()) / 1000;

        await activeRecord.update({
          connectionEndTime: now,
          connectionDuration: duration,
          isActive: false,
        });

        console.log(
          `Closed attendance record ${activeRecord.id} with duration ${duration} seconds`
        );
      }
    }

    return apiResponse.success(res, "Logout successful");
  } catch (error) {
    console.error("Error during logout:", error);
    return apiResponse.serverError(res, error);
  }
};

// Add to desktop.controller.js

/**
 * Track desktop connection/disconnection events
 */
exports.trackConnection = async (req, res) => {
  try {
    const {
      event_type,
      ssid,
      email,
      ip_address,
      mac_address,
      computer_name,
      timestamp,
      connection_duration,
      connection_duration_formatted,
      connection_start_time,
      connection_start_time_formatted,
    } = req.body;

    // Validate required fields
    if (!event_type || !ssid || !email || !mac_address) {
      return apiResponse.badRequest(
        res,
        "Event type, SSID, email, and MAC address are required"
      );
    }

    // Find user by email
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return apiResponse.unauthorized(res, "User not found");
    }

    // Find desktop session for this user
    const desktopSession = await DesktopSession.findOne({
      where: {
        userId: user.id,
        macAddress: mac_address,
        isActive: true,
      },
    });

    if (!desktopSession) {
      return apiResponse.badRequest(
        res,
        "No active session found for this device"
      );
    }

    // Create attendance record
    const AttendanceRecord = db.attendanceRecord; // Need to create this model

    // Create or update attendance record
    let record;

    if (event_type === "connect") {
      // Create a new connection record
      record = await AttendanceRecord.create({
        userId: user.id,
        ssid,
        ipAddress: ip_address,
        macAddress: mac_address,
        computerName: computer_name,
        connectionStartTime: new Date(connection_start_time * 1000),
        isActive: true,
      });

      // Check if this is a connection from the office network and correct IP range
      const isOfficeNetwork = ssid === "GIGLABZ_5G";
      const isOfficeIPRange =
        ip_address && ip_address.startsWith("192.168.100.");
      const isValidOfficeConnection = isOfficeNetwork && isOfficeIPRange;

      console.log(
        `Login from SSID: ${ssid}, IP: ${ip_address} - Valid office connection: ${
          isValidOfficeConnection ? "Yes" : "No"
        }`
      );

      if (isValidOfficeConnection) {
        // Get today's date in YYYY-MM-DD format
        const todayDate = new Date().toISOString().split("T")[0];

        // Find user's booking for today
        const Booking = db.booking;
        const todayBooking = await Booking.findOne({
          where: {
            userId: user.id,
            bookingDate: todayDate,
            status: "confirmed",
            checkInTime: null, // Not already checked in
          },
        });

        // If booking exists, mark as checked in
        if (todayBooking) {
          await todayBooking.update({
            checkInTime: new Date(),
          });

          // Log the attendance
          await db.auditLog.create({
            entityType: "booking",
            entityId: todayBooking.id,
            action: "check-in",
            performedBy: null, // System performed
            oldValues: { checkInTime: null },
            newValues: { checkInTime: new Date() },
          });

          console.log(
            `Auto check-in recorded for user ${user.email}, booking ID ${todayBooking.id} (Office IP: ${ip_address})`
          );
        } else {
          console.log(
            `No active booking found for user ${user.email} on ${todayDate}`
          );
        }
      } else {
        console.log(
          `Connection from non-office network or IP range: ${ssid}, ${ip_address}`
        );
      }

      // Update the session with the IP address
      await desktopSession.update({
        lastActivityAt: new Date(),
      });
    } else if (event_type === "heartbeat") {
      // Handle heartbeat event - just update the lastActivityAt timestamp
      console.log(
        `Received heartbeat from ${user.email} at ${new Date().toISOString()}`
      );

      // Update the desktop session with the current time
      await desktopSession.update({
        lastActivityAt: new Date(),
      });

      // Find the active connection record
      record = await AttendanceRecord.findOne({
        where: {
          userId: user.id,
          macAddress: mac_address,
          isActive: true,
        },
        order: [["connectionStartTime", "DESC"]],
      });

      if (!record) {
        // No active connection found, create a new one
        console.log(
          `No active connection found for ${user.email}, creating new record`
        );
        record = await AttendanceRecord.create({
          userId: user.id,
          ssid,
          ipAddress: ip_address,
          macAddress: mac_address,
          computerName: computer_name,
          connectionStartTime: new Date(),
          isActive: true,
        });
      }

      return apiResponse.success(res, "Heartbeat recorded successfully");

      // Also update or create any other active session records
      const activeRecords = await AttendanceRecord.findAll({
        where: {
          userId: user.id,
          macAddress: mac_address,
          isActive: true,
          id: { [db.Sequelize.Op.ne]: record.id },
        },
      });

      // Close any other active records for this user/device
      if (activeRecords.length > 0) {
        console.log(
          `Found ${activeRecords.length} other active records for this user/device`
        );
        for (const oldRecord of activeRecords) {
          // Calculate duration
          const now = new Date();
          const duration =
            (now.getTime() - oldRecord.connectionStartTime.getTime()) / 1000;

          // Update the record
          await oldRecord.update({
            connectionEndTime: now,
            connectionDuration: duration,
            isActive: false,
          });

          console.log(
            `Closed old attendance record ${oldRecord.id} with duration ${duration} seconds`
          );
        }
      }

      return apiResponse.success(res, "Connection recorded successfully", {
        recordId: record.id,
      });
    } else if (event_type === "disconnect") {
      // Find the active connection record
      record = await AttendanceRecord.findOne({
        where: {
          userId: user.id,
          macAddress: mac_address,
          isActive: true,
        },
        order: [["connectionStartTime", "DESC"]],
      });

      if (!record) {
        return apiResponse.badRequest(
          res,
          "No active connection found to disconnect"
        );
      }

      // Update the record with disconnect information
      await record.update({
        connectionEndTime: new Date(),
        connectionDuration: connection_duration,
        isActive: false,
      });

      return apiResponse.success(res, "Disconnection recorded successfully", {
        recordId: record.id,
        duration: connection_duration_formatted,
      });
    } else {
      return apiResponse.badRequest(res, "Invalid event type");
    }
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

// Add this to desktop.controller.js

/**
 * Reset the MAC address for a specific user
 * This allows the user to register with a new device
 */
exports.resetMacAddress = async (req, res) => {
  try {
    const { userId, email } = req.body;

    // Check if user has admin permission to perform this action
    if (
      !req.userRoles.includes("ROLE_ADMIN") &&
      !req.userRoles.includes("admin")
    ) {
      return apiResponse.forbidden(
        res,
        "Only administrators can reset MAC addresses"
      );
    }

    // Find the user either by ID or email
    let whereClause = {};
    if (userId) {
      whereClause.id = userId;
    } else if (email) {
      whereClause.email = email;
    } else {
      return apiResponse.badRequest(
        res,
        "Either userId or email must be provided"
      );
    }

    const user = await User.findOne({ where: whereClause });

    if (!user) {
      return apiResponse.notFound(res, "User not found");
    }

    // Find all desktop sessions for this user
    const sessions = await DesktopSession.findAll({
      where: { userId: user.id },
    });

    if (sessions.length === 0) {
      return apiResponse.notFound(
        res,
        "No desktop sessions found for this user"
      );
    }

    // Deactivate all sessions for this user
    await DesktopSession.update(
      { isActive: false },
      { where: { userId: user.id } }
    );

    // Log the action
    const AuditLog = db.auditLog;
    await AuditLog.create({
      entityType: "user",
      entityId: user.id,
      action: "reset_mac_address",
      performedBy: req.userId,
      oldValues: {
        sessions: sessions.map((s) => ({
          id: s.id,
          macAddress: s.macAddress,
          isActive: s.isActive,
        })),
      },
      newValues: {
        message: "All desktop sessions deactivated",
      },
    });

    return apiResponse.success(
      res,
      "MAC address reset successful. User can now log in with a new device.",
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        sessionsDeactivated: sessions.length,
      }
    );
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get all active desktop sessions (for admin)
 */
exports.getActiveSessions = async (req, res) => {
  try {
    // Check if user has admin permission to perform this action
    if (
      !req.userRoles.includes("ROLE_ADMIN") &&
      !req.userRoles.includes("admin")
    ) {
      return apiResponse.forbidden(
        res,
        "Only administrators can view active desktop sessions"
      );
    }

    // First run the auto cleanup to remove any stale sessions
    // Use a shorter timeout (5 minutes instead of 10) to clean up stale sessions more aggressively
    const cleanedCount = await autoCleanupInactiveSessions(5);

    // Get all active desktop sessions with user details
    const activeSessions = await DesktopSession.findAll({
      where: { isActive: true },
      include: [
        {
          model: User,
          attributes: ["id", "username", "email", "fullName", "department"],
        },
      ],
      order: [["lastActivityAt", "DESC"]],
    });

    console.log(
      `Found ${activeSessions.length} active desktop sessions${
        cleanedCount > 0 ? ` (cleaned up ${cleanedCount} stale sessions)` : ""
      }`
    );

    // Get attendance records for these sessions
    const sessionDetails = await Promise.all(
      activeSessions.map(async (session) => {
        try {
          // Find the latest attendance record for this session
          const AttendanceRecord = db.attendanceRecord;
          const latestRecord = await AttendanceRecord.findOne({
            where: {
              userId: session.userId,
              macAddress: session.macAddress,
              isActive: true,
            },
            order: [["connectionStartTime", "DESC"]],
          });

          // Calculate connection duration if available
          let connectionDuration = null;
          let connectionDurationFormatted = null;
          let connectionStartTime = null;
          let connectionStartTimeFormatted = null;

          if (latestRecord) {
            connectionStartTime = Math.floor(
              latestRecord.connectionStartTime.getTime() / 1000
            );
            connectionStartTimeFormatted = formatDateTimeIST(
              latestRecord.connectionStartTime
            );

            if (latestRecord.connectionDuration) {
              connectionDuration = latestRecord.connectionDuration;

              // Format duration as HH:MM:SS
              const hours = Math.floor(connectionDuration / 3600);
              const minutes = Math.floor((connectionDuration % 3600) / 60);
              const seconds = Math.floor(connectionDuration % 60);
              connectionDurationFormatted = `${hours
                .toString()
                .padStart(2, "0")}:${minutes
                .toString()
                .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
            } else {
              // Calculate duration from start time until now
              const now = new Date();
              connectionDuration =
                (now.getTime() - latestRecord.connectionStartTime.getTime()) /
                1000;

              // Format duration as HH:MM:SS
              const hours = Math.floor(connectionDuration / 3600);
              const minutes = Math.floor((connectionDuration % 3600) / 60);
              const seconds = Math.floor(connectionDuration % 60);
              connectionDurationFormatted = `${hours
                .toString()
                .padStart(2, "0")}:${minutes
                .toString()
                .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
            }
          }

          // If no latestRecord found, look for any recent record for this user/device
          let ipAddress = null;
          let computerName = null;

          if (!latestRecord) {
            try {
              // Try to find any record for this user/device
              const anyRecord = await AttendanceRecord.findOne({
                where: {
                  userId: session.userId,
                  macAddress: session.macAddress,
                },
                order: [["connectionStartTime", "DESC"]],
              });

              if (anyRecord) {
                ipAddress = anyRecord.ipAddress;
                computerName = anyRecord.computerName;
                console.log(
                  `Found historical record for session ${session.id} with IP ${ipAddress}`
                );
              }
            } catch (err) {
              console.error(
                `Error finding historical record for session ${session.id}:`,
                err
              );
            }
          }

          return {
            id: session.id,
            event_type: latestRecord ? "connect" : "unknown",
            ssid: session.ssid,
            email: session.user ? session.user.email : null,
            ip_address: latestRecord ? latestRecord.ipAddress : ipAddress, // Use historical record if no active one
            mac_address: session.macAddress,
            computer_name: latestRecord
              ? latestRecord.computerName
              : computerName, // Use historical record if no active one
            timestamp: Math.floor(session.lastActivityAt.getTime() / 1000),
            connection_duration: connectionDuration,
            connection_duration_formatted: connectionDurationFormatted,
            connection_start_time: connectionStartTime,
            connection_start_time_formatted: connectionStartTimeFormatted,
            user: session.user
              ? {
                  id: session.user.id,
                  username: session.user.username,
                  email: session.user.email,
                  fullName: session.user.fullName,
                  department: session.user.department,
                }
              : null,
            lastActivityAt: session.lastActivityAt,
            lastActivityAtFormatted: formatDateTimeIST(session.lastActivityAt),
          };
        } catch (err) {
          console.error("Error processing session details:", err);
          return {
            id: session.id,
            ssid: session.ssid,
            mac_address: session.macAddress,
            event_type: "unknown",
            error: "Failed to process session details",
          };
        }
      })
    );

    return apiResponse.success(
      res,
      "Active desktop sessions retrieved successfully",
      sessionDetails
    );
  } catch (error) {
    console.error("Error in getActiveSessions:", error);
    return apiResponse.serverError(res, error);
  }
};

/**
 * Check and clean up inactive sessions
 * This function marks sessions as inactive if they haven't sent a heartbeat in 5+ minutes
 */
exports.cleanupInactiveSessions = async (req, res) => {
  try {
    // Check if user has admin permission to perform this action
    if (
      !req.userRoles ||
      (!req.userRoles.includes("ROLE_ADMIN") &&
        !req.userRoles.includes("admin"))
    ) {
      return apiResponse.forbidden(
        res,
        "Only administrators can manually clean up inactive sessions"
      );
    }

    // Calculate cutoff time (5 minutes ago - using a shorter timeout for quicker cleanup)
    const fiveMinutesAgo = new Date();
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

    // Find active sessions that haven't been updated in the last 5 minutes
    const outdatedSessions = await DesktopSession.findAll({
      where: {
        isActive: true,
        lastActivityAt: {
          [db.Sequelize.Op.lt]: fiveMinutesAgo,
        },
      },
      include: [
        {
          model: db.user,
          attributes: ["id", "username", "email"],
        },
      ],
    });

    console.log(
      `Found ${outdatedSessions.length} inactive sessions older than 5 minutes`
    );

    // Process each outdated session
    const processedSessions = [];

    for (const session of outdatedSessions) {
      try {
        // Find active attendance records for this session
        const activeRecords = await db.attendanceRecord.findAll({
          where: {
            userId: session.userId,
            macAddress: session.macAddress,
            isActive: true,
          },
        });

        // Mark attendance records as inactive
        for (const record of activeRecords) {
          const now = new Date();
          const duration =
            (now.getTime() - record.connectionStartTime.getTime()) / 1000;

          await record.update({
            connectionEndTime: now,
            connectionDuration: duration,
            isActive: false,
          });

          console.log(
            `Marked attendance record ${record.id} for user ${
              session.user?.email || session.userId
            } as inactive (duration: ${duration}s)`
          );
        }

        // Mark the session as inactive
        await session.update({
          isActive: false,
        });

        processedSessions.push({
          id: session.id,
          userId: session.userId,
          email: session.user?.email || "Unknown",
          lastActivity: session.lastActivityAt,
          lastActivityFormatted: formatDateTimeIST(session.lastActivityAt),
          recordsUpdated: activeRecords.length,
        });
      } catch (err) {
        console.error(`Error processing session ${session.id}:`, err);
      }
    }

    return apiResponse.success(
      res,
      `Successfully cleaned up ${processedSessions.length} inactive sessions`,
      {
        processedSessions,
        totalFound: outdatedSessions.length,
      }
    );
  } catch (error) {
    console.error("Error cleaning up inactive sessions:", error);
    return apiResponse.serverError(res, error);
  }
};

/**
 * This function runs automatically during getActiveSessions to clean up stale sessions
 * @param {number} timeoutMinutes - Number of minutes without activity before a session is considered inactive (default: 10)
 */
const autoCleanupInactiveSessions = async (timeoutMinutes = 10) => {
  try {
    // Calculate cutoff time based on provided timeout (default 10 minutes)
    const cutoffTime = new Date();
    cutoffTime.setMinutes(cutoffTime.getMinutes() - timeoutMinutes);

    // Find active sessions that haven't been updated in the specified time
    const outdatedSessions = await DesktopSession.findAll({
      where: {
        isActive: true,
        lastActivityAt: {
          [db.Sequelize.Op.lt]: cutoffTime,
        },
      },
    });

    console.log(
      `Auto cleanup: Found ${outdatedSessions.length} inactive sessions older than ${timeoutMinutes} minutes`
    );

    // Process each outdated session
    for (const session of outdatedSessions) {
      try {
        // Find active attendance records for this session
        const activeRecords = await db.attendanceRecord.findAll({
          where: {
            userId: session.userId,
            macAddress: session.macAddress,
            isActive: true,
          },
        });

        // Mark attendance records as inactive
        for (const record of activeRecords) {
          const now = new Date();
          const duration =
            (now.getTime() - record.connectionStartTime.getTime()) / 1000;

          await record.update({
            connectionEndTime: now,
            connectionDuration: duration,
            isActive: false,
          });

          console.log(
            `Auto cleanup: Marked attendance record ${record.id} for user ${session.userId} as inactive (duration: ${duration}s)`
          );
        }

        // Mark the session as inactive
        await session.update({
          isActive: false,
        });
      } catch (err) {
        console.error(
          `Auto cleanup: Error processing session ${session.id}:`,
          err
        );
      }
    }

    return outdatedSessions.length;
  } catch (error) {
    console.error("Auto cleanup: Error cleaning up inactive sessions:", error);
    return 0;
  }
};

/**
 * Get attendance history (for admin)
 */
exports.getAttendanceHistory = async (req, res) => {
  try {
    // Check if user has admin permission to perform this action
    if (
      !req.userRoles.includes("ROLE_ADMIN") &&
      !req.userRoles.includes("admin")
    ) {
      return apiResponse.forbidden(
        res,
        "Only administrators can view attendance history"
      );
    }

    // Get query parameters
    const { startDate, endDate, userId, limit = 100, offset = 0 } = req.query;

    // Build where clause
    const whereClause = {};

    // Add date range if provided
    if (startDate && endDate) {
      whereClause.connectionStartTime = {
        [db.Sequelize.Op.between]: [new Date(startDate), new Date(endDate)],
      };
    } else if (startDate) {
      whereClause.connectionStartTime = {
        [db.Sequelize.Op.gte]: new Date(startDate),
      };
    } else if (endDate) {
      whereClause.connectionStartTime = {
        [db.Sequelize.Op.lte]: new Date(endDate),
      };
    }

    // Add user filter if provided
    if (userId) {
      whereClause.userId = userId;
    }

    // Get attendance records with user details
    const AttendanceRecord = db.attendanceRecord;
    const attendance = await AttendanceRecord.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ["id", "username", "email", "fullName", "department"],
        },
      ],
      order: [["connectionStartTime", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    // Format the attendance records
    const formattedRecords = attendance.rows.map((record) => {
      // Format duration as HH:MM:SS if available
      let durationFormatted = "N/A";

      if (record.connectionDuration) {
        const hours = Math.floor(record.connectionDuration / 3600);
        const minutes = Math.floor((record.connectionDuration % 3600) / 60);
        const seconds = Math.floor(record.connectionDuration % 60);
        durationFormatted = `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      } else if (record.connectionStartTime && record.connectionEndTime) {
        // Calculate duration if not stored directly
        const duration =
          (record.connectionEndTime.getTime() -
            record.connectionStartTime.getTime()) /
          1000;
        const hours = Math.floor(duration / 3600);
        const minutes = Math.floor((duration % 3600) / 60);
        const seconds = Math.floor(duration % 60);
        durationFormatted = `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
      }

      return {
        id: record.id,
        user: record.user
          ? {
              id: record.user.id,
              username: record.user.username,
              email: record.user.email,
              fullName: record.user.fullName,
              department: record.user.department,
            }
          : null,
        ssid: record.ssid,
        ipAddress: record.ipAddress,
        macAddress: record.macAddress,
        computerName: record.computerName,
        connectionStartTime: record.connectionStartTime,
        connectionStartTimeFormatted: record.connectionStartTime
          ? formatDateTimeIST(record.connectionStartTime)
          : null,
        connectionEndTime: record.connectionEndTime,
        connectionEndTimeFormatted: record.connectionEndTime
          ? formatDateTimeIST(record.connectionEndTime)
          : null,
        connectionDuration: record.connectionDuration,
        connectionDurationFormatted: durationFormatted,
        isActive: record.isActive,
        status: record.isActive ? "Connected" : "Disconnected",
      };
    });

    return apiResponse.success(
      res,
      "Attendance history retrieved successfully",
      {
        total: attendance.count,
        records: formattedRecords,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          hasMore:
            parseInt(offset) + formattedRecords.length < attendance.count,
        },
      }
    );
  } catch (error) {
    console.error("Error in getAttendanceHistory:", error);
    return apiResponse.serverError(res, error);
  }
};
