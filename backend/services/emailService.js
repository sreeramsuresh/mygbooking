// backend/services/emailService.js
const nodemailer = require("nodemailer");
const config = require("../config/email");
const logger = require("../utils/logger");

// Create nodemailer transporter
const transporter = nodemailer.createTransport({
  host: config.host,
  port: config.port,
  secure: config.secure,
  auth: {
    user: config.auth.user,
    pass: config.auth.pass,
  },
});

// Send WFH request notification to manager
const sendRequestNotification = async (managerEmail, user, request) => {
  try {
    const startDate = new Date(request.start_date).toLocaleDateString();
    const endDate = new Date(request.end_date).toLocaleDateString();

    const mailOptions = {
      from: config.from,
      to: managerEmail,
      subject: "New WFH Request Needs Approval",
      html: `
        <h2>New Work From Home Request</h2>
        <p><strong>Employee:</strong> ${user.first_name} ${user.last_name}</p>
        <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
        <p><strong>Reason:</strong> ${request.reason}</p>
        <p>Please log in to the system to approve or reject this request.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`WFH request notification sent to ${managerEmail}`);

    return { success: true };
  } catch (error) {
    logger.error("Error sending WFH request notification:", error);
    throw error;
  }
};

// Send request status notification to employee
const sendRequestStatusNotification = async (
  userEmail,
  status,
  notes,
  request
) => {
  try {
    const startDate = new Date(request.start_date).toLocaleDateString();
    const endDate = new Date(request.end_date).toLocaleDateString();

    const statusText = status === "approved" ? "Approved" : "Rejected";
    const statusColor = status === "approved" ? "#4caf50" : "#f44336";

    const mailOptions = {
      from: config.from,
      to: userEmail,
      subject: `Your WFH Request Has Been ${statusText}`,
      html: `
        <h2>Work From Home Request ${statusText}</h2>
        <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
        <p><strong>Status:</strong> <span style="color
        // backend/services/emailService.js (continued)
        <p><strong>Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></p>
        ${notes ? `<p><strong>Manager Notes:</strong> ${notes}</p>` : ""}
        <p>You can log in to the system to view more details.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Request status notification sent to ${userEmail}`);

    return { success: true };
  } catch (error) {
    logger.error("Error sending request status notification:", error);
    throw error;
  }
};

// Send weekly schedule reminder
const sendWeeklyScheduleReminder = async (user, bookings) => {
  try {
    const bookingsList = bookings
      .map((booking) => {
        const date = new Date(booking.booking_date).toLocaleDateString(
          "en-US",
          {
            weekday: "long",
            month: "long",
            day: "numeric",
          }
        );

        return `<li>${date} - Seat #${booking.seat.seat_number}</li>`;
      })
      .join("");

    const mailOptions = {
      from: config.from,
      to: user.email,
      subject: "Your Office Schedule This Week",
      html: `
        <h2>Your Office Schedule This Week</h2>
        <p>Hello ${user.first_name},</p>
        <p>Here is your office schedule for this week:</p>
        <ul>
          ${bookingsList}
        </ul>
        <p>Please remember to check in when you arrive at the office.</p>
        <p>If you need to make any changes, please log in to the system as soon as possible.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Weekly schedule reminder sent to ${user.email}`);

    return { success: true };
  } catch (error) {
    logger.error("Error sending weekly schedule reminder:", error);
    throw error;
  }
};

// Send compliance warning
const sendComplianceWarning = async (user, compliance) => {
  try {
    const mailOptions = {
      from: config.from,
      to: user.email,
      subject: "Office Attendance Compliance Warning",
      html: `
        <h2 style="color: #f44336;">Office Attendance Compliance Warning</h2>
        <p>Hello ${user.first_name},</p>
        <p>Our records show that you have only attended the office ${compliance.actual_days} days out of your required ${compliance.required_days} days this week.</p>
        <p>Please make sure to meet your required office days each week. If you are unable to do so, please submit a Work From Home request with your manager for approval.</p>
        <p>If you have any questions or need assistance, please contact your manager.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    logger.info(`Compliance warning sent to ${user.email}`);

    return { success: true };
  } catch (error) {
    logger.error("Error sending compliance warning:", error);
    throw error;
  }
};

module.exports = {
  sendRequestNotification,
  sendRequestStatusNotification,
  sendWeeklyScheduleReminder,
  sendComplianceWarning,
};
