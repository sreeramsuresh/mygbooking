// backend/controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User } = require("../models");
const config = require("../config/server");

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, {
      expiresIn: config.jwtExpiry,
    });

    // Send response without password
    const userWithoutPassword = {
      id: user.id,
      username: user.username,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    };

    return res.status(200).json({
      success: true,
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// Register user (admin only)
const register = async (req, res) => {
  try {
    const { username, email, password, first_name, last_name, role } = req.body;

    // Check if user is admin (middleware should handle this, but double check)
    if (req.user && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admins can register new users",
      });
    }

    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Username or email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      first_name,
      last_name,
      role: role || "employee", // Default to employee if not specified
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// Validate token
const validateToken = async (req, res) => {
  try {
    // User data is attached by auth middleware
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    const userWithoutPassword = {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email,
      first_name: req.user.first_name,
      last_name: req.user.last_name,
      role: req.user.role,
    };

    return res.status(200).json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during token validation",
    });
  }
};

// Public register function (no auth required)
const registerPublic = async (req, res) => {
  try {
    const { firstName, lastName, email, password, department, employeeId } = req.body;
    
    console.log("Received registration request:", { 
      firstName, 
      lastName, 
      email, 
      password: password ? '***' : undefined, 
      department, 
      employeeId 
    });

    // Check if email already exists
    const existingUser = await User.findOne({
      where: {
        email
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create username from email (before the @ symbol)
    let username = email.split('@')[0];

    // Check if the username already exists, append random digits if needed
    const existingUsername = await User.findOne({
      where: {
        username
      }
    });

    if (existingUsername) {
      username = `${username}${Math.floor(Math.random() * 10000)}`;
    }

    // Create user with optional fields
    const userData = {
      username,
      email,
      password: hashedPassword,
      first_name: firstName,
      last_name: lastName,
      role: "employee", // Default to employee for public registration
    };
    
    // Add optional fields if provided
    if (department) userData.department = department;
    if (employeeId) userData.employee_id = employeeId;
    
    const newUser = await User.create(userData);

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error("Public registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration: " + error.message,
    });
  }
};

module.exports = {
  login,
  register,
  registerPublic,
  validateToken,
};
