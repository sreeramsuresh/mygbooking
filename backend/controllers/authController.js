// backend/controllers/authController.js
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User } = require("../models");
const config = require("../config/server");

// Login user
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Check if user exists
    const user = await User.findOne({
      where: { username },
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
      expiresIn: "24h",
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
    if (req.user.role !== "admin") {
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

module.exports = {
  login,
  register,
  validateToken,
};
