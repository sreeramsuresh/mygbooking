// backend/controllers/dashboard.controller.js
const dashboardService = require("../services/dashboard.service");
const apiResponse = require("../utils/apiResponse");

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
