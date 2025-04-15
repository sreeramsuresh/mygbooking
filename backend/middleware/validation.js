// Request validation
// backend/middleware/validation.js
// Basic validation middleware

// Validate login request
const validateLoginRequest = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });
  }

  next();
};

// Validate registration request
const validateRegisterRequest = (req, res, next) => {
  // Check which registration route is being used
  if (req.path === '/admin/register') {
    // Admin registration
    const { username, email, password, first_name, last_name } = req.body;

    if (!username || !email || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: "All fields are required for admin registration",
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }
  } 
  else {
    // Public registration
    const { firstName, lastName, email, password, department, employeeId } = req.body;
    
    console.log("Public registration request:", { firstName, lastName, email, password: password ? "***" : undefined, department, employeeId });

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }
    
    // Validate password strength
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }
  }

  next();
};

// Validate booking request
const validateBookingRequest = (req, res, next) => {
  const { seat_id, booking_date } = req.body;

  if (!seat_id || !booking_date) {
    return res.status(400).json({
      success: false,
      message: "Seat ID and booking date are required",
    });
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(booking_date)) {
    return res.status(400).json({
      success: false,
      message: "Invalid date format. Use YYYY-MM-DD",
    });
  }

  next();
};

// Validate schedule request
const validateScheduleRequest = (req, res, next) => {
  const { days } = req.body;

  if (!Array.isArray(days)) {
    return res.status(400).json({
      success: false,
      message: "Days must be an array",
    });
  }

  // Validate each day
  const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
  const invalidDays = days.filter((day) => !validDays.includes(day));

  if (invalidDays.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Invalid days: ${invalidDays.join(", ")}`,
    });
  }

  next();
};

// Validate WFH request
const validateWFHRequest = (req, res, next) => {
  const { start_date, end_date, reason } = req.body;

  if (!start_date || !end_date || !reason) {
    return res.status(400).json({
      success: false,
      message: "Start date, end date, and reason are required",
    });
  }

  // Validate date format (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(start_date) || !dateRegex.test(end_date)) {
    return res.status(400).json({
      success: false,
      message: "Invalid date format. Use YYYY-MM-DD",
    });
  }

  // Validate that end date is not before start date
  if (new Date(end_date) < new Date(start_date)) {
    return res.status(400).json({
      success: false,
      message: "End date cannot be before start date",
    });
  }

  next();
};

// Validate status update
const validateStatusUpdate = (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({
      success: false,
      message: "Status is required",
    });
  }

  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Status must be either approved or rejected",
    });
  }

  next();
};

module.exports = {
  validateLoginRequest,
  validateRegisterRequest,
  validateBookingRequest,
  validateScheduleRequest,
  validateWFHRequest,
  validateStatusUpdate,
};
