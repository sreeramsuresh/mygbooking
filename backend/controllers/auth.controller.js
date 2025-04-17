// backend/controllers/auth.controller.js
const authService = require("../services/auth.service");
const apiResponse = require("../utils/apiResponse");

/**
 * Handles user sign-in
 */
exports.signin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return apiResponse.badRequest(res, "Username and password are required");
    }

    const result = await authService.authenticateUser(username, password);

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

    return apiResponse.created(res, "User registered successfully", user);
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};
