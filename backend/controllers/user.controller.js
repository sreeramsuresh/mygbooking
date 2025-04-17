// backend/controllers/user.controller.js
const userService = require("../services/user.service");
const apiResponse = require("../utils/apiResponse");

/**
 * Get all users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await userService.getAllUsers();
    return apiResponse.success(res, "Users retrieved successfully", users);
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get a specific user by ID
 */
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return apiResponse.badRequest(res, "User ID is required");
    }

    const user = await userService.getUserById(userId);

    if (!user) {
      return apiResponse.notFound(res, "User not found");
    }

    return apiResponse.success(res, "User retrieved successfully", user);
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Create a new user
 */
exports.createUser = async (req, res) => {
  try {
    // Validation can be handled by middleware
    const userData = req.body;

    if (
      !userData.username ||
      !userData.email ||
      !userData.password ||
      !userData.fullName
    ) {
      return apiResponse.badRequest(res, "Required fields are missing");
    }

    const user = await userService.createUser(userData, req.userId);
    return apiResponse.created(res, "User created successfully", user);
  } catch (error) {
    if (
      error.message === "Username already exists" ||
      error.message === "Email already exists"
    ) {
      return apiResponse.badRequest(res, error.message);
    }
    return apiResponse.serverError(res, error);
  }
};

/**
 * Update a user
 */
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    if (!userId) {
      return apiResponse.badRequest(res, "User ID is required");
    }

    const user = await userService.updateUser(userId, updates, req.userId);

    if (!user) {
      return apiResponse.notFound(res, "User not found");
    }

    return apiResponse.success(res, "User updated successfully", user);
  } catch (error) {
    if (
      error.message === "Username already exists" ||
      error.message === "Email already exists"
    ) {
      return apiResponse.badRequest(res, error.message);
    }
    return apiResponse.serverError(res, error);
  }
};

/**
 * Delete a user
 */
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return apiResponse.badRequest(res, "User ID is required");
    }

    // Prevent users from deleting themselves
    if (userId == req.userId) {
      return apiResponse.badRequest(res, "You cannot delete your own account");
    }

    const result = await userService.deleteUser(userId, req.userId);

    if (!result) {
      return apiResponse.notFound(res, "User not found");
    }

    return apiResponse.success(res, "User deleted successfully");
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Toggle user active status
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { isActive } = req.body;

    if (!userId) {
      return apiResponse.badRequest(res, "User ID is required");
    }

    if (isActive === undefined) {
      return apiResponse.badRequest(res, "isActive status is required");
    }

    // Prevent users from deactivating themselves
    if (userId == req.userId && !isActive) {
      return apiResponse.badRequest(
        res,
        "You cannot deactivate your own account"
      );
    }

    const user = await userService.toggleUserStatus(
      userId,
      isActive,
      req.userId
    );

    if (!user) {
      return apiResponse.notFound(res, "User not found");
    }

    return apiResponse.success(
      res,
      `User ${isActive ? "activated" : "deactivated"} successfully`,
      user
    );
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Assign a manager to a user
 */
exports.assignManager = async (req, res) => {
  try {
    const { userId } = req.params;
    const { managerId } = req.body;

    if (!userId) {
      return apiResponse.badRequest(res, "User ID is required");
    }

    // managerId can be null to remove manager assignment

    const user = await userService.assignManager(userId, managerId, req.userId);

    if (!user) {
      return apiResponse.notFound(res, "User not found");
    }

    return apiResponse.success(
      res,
      "Manager assignment updated successfully",
      user
    );
  } catch (error) {
    if (
      error.message === "Manager not found" ||
      error.message === "Cannot assign user as their own manager"
    ) {
      return apiResponse.badRequest(res, error.message);
    }
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get current user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await userService.getUserById(req.userId);

    if (!user) {
      return apiResponse.notFound(res, "User not found");
    }

    return apiResponse.success(res, "Profile retrieved successfully", user);
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Update current user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;

    // Users can only update certain fields of their own profile
    const allowedUpdates = [
      "fullName",
      "email",
      "department",
      "defaultWorkDays",
      "password",
      "oldPassword", // Required if changing password
    ];

    // Filter out non-allowed fields
    const filteredUpdates = {};
    Object.keys(updates).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    // If password is being changed, check old password
    if (filteredUpdates.password && !filteredUpdates.oldPassword) {
      return apiResponse.badRequest(
        res,
        "Old password is required when changing password"
      );
    }

    const user = await userService.updateProfile(req.userId, filteredUpdates);

    if (!user) {
      return apiResponse.notFound(res, "User not found");
    }

    return apiResponse.success(res, "Profile updated successfully", user);
  } catch (error) {
    if (
      error.message === "Email already exists" ||
      error.message === "Incorrect old password"
    ) {
      return apiResponse.badRequest(res, error.message);
    }
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get users by role
 */
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    if (!role) {
      return apiResponse.badRequest(res, "Role is required");
    }

    const users = await userService.getUsersByRole(role);
    return apiResponse.success(res, "Users retrieved successfully", users);
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};
