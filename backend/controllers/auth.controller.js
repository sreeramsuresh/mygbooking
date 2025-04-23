// backend/controllers/auth.controller.js
const authService = require("../services/auth.service");
const apiResponse = require("../utils/apiResponse");

/**
 * Handles user sign-in with username or email
 */
exports.signin = async (req, res) => {
  try {
    const { login, password } = req.body;

    if (!login || !password) {
      return apiResponse.badRequest(
        res,
        "Username/email and password are required"
      );
    }

    const result = await authService.authenticateUser(login, password);

    if (!result.success) {
      return apiResponse.unauthorized(res, result.message);
    }

    return apiResponse.success(res, "Login successful", result);
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Handles user registration
 */
exports.signup = async (req, res) => {
  try {
    // Basic validation
    if (
      !req.body.username ||
      !req.body.email ||
      !req.body.password ||
      !req.body.fullName
    ) {
      return apiResponse.badRequest(res, "Missing required fields");
    }

    // Register user with provided roles or default to employee
    const user = await authService.registerUser(
      req.body,
      req.body.roles || ["employee"],
      req.userId // Creator ID if authenticated
    );

    // Check if auto-booking preferences are properly set
    const autoBookingMessage =
      req.body.defaultWorkDays && req.body.requiredDaysPerWeek
        ? "User registered and auto-bookings created successfully"
        : "User registered successfully, but auto-bookings could not be created due to missing preferences";

    return apiResponse.created(res, autoBookingMessage, user);
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Handles refresh token to get a new access token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return apiResponse.badRequest(res, "Refresh Token is required");
    }

    const result = await authService.refreshToken(refreshToken);

    if (!result.success) {
      return apiResponse.unauthorized(res, result.message);
    }

    return apiResponse.success(res, "Token refreshed successfully", result);
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Handles user logout
 */
exports.logout = async (req, res) => {
  try {
    const result = await authService.logout(req.userId);
    return apiResponse.success(res, "Logout successful", result);
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};
