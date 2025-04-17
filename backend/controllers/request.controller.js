// backend/controllers/request.controller.js
const requestService = require("../services/request.service");
const apiResponse = require("../utils/apiResponse");

/**
 * Create a new regularization request
 */
exports.createRegularizationRequest = async (req, res) => {
  try {
    const { date, reason } = req.body;

    if (!date || !reason) {
      return apiResponse.badRequest(res, "Date and reason are required");
    }

    const requestData = {
      type: "regularization",
      date,
      reason,
    };

    const request = await requestService.createRequest(
      req.userId,
      requestData,
      req.userId
    );

    return apiResponse.created(
      res,
      "Regularization request submitted successfully",
      request
    );
  } catch (error) {
    if (error.message.includes("already have a request")) {
      return apiResponse.badRequest(res, error.message);
    }
    return apiResponse.serverError(res, error);
  }
};

/**
 * Create a new WFH request
 */
exports.createWFHRequest = async (req, res) => {
  try {
    const { date, reason } = req.body;

    if (!date || !reason) {
      return apiResponse.badRequest(res, "Date and reason are required");
    }

    const requestData = {
      type: "wfh",
      date,
      reason,
    };

    const request = await requestService.createRequest(
      req.userId,
      requestData,
      req.userId
    );

    return apiResponse.created(
      res,
      "Work from home request submitted successfully",
      request
    );
  } catch (error) {
    if (error.message.includes("already have a request")) {
      return apiResponse.badRequest(res, error.message);
    }
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get all requests for the current user
 */
exports.getMyRequests = async (req, res) => {
  try {
    const filters = req.query;

    const requests = await requestService.getUserRequests(req.userId, filters);

    return apiResponse.success(
      res,
      "Requests retrieved successfully",
      requests
    );
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get pending requests for the current user (manager role)
 */
exports.getPendingRequests = async (req, res) => {
  try {
    const filters = req.query;

    const requests = await requestService.getPendingRequests(
      req.userId,
      filters
    );

    return apiResponse.success(
      res,
      "Pending requests retrieved successfully",
      requests
    );
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Approve a request
 */
exports.approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { responseMessage } = req.body;

    if (!requestId) {
      return apiResponse.badRequest(res, "Request ID is required");
    }

    const request = await requestService.processRequest(
      requestId,
      "approve",
      responseMessage || "Approved",
      req.userId
    );

    return apiResponse.success(res, "Request approved successfully", request);
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("already been processed")
    ) {
      return apiResponse.badRequest(res, error.message);
    }
    return apiResponse.serverError(res, error);
  }
};

/**
 * Reject a request
 */
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { responseMessage } = req.body;

    if (!requestId) {
      return apiResponse.badRequest(res, "Request ID is required");
    }

    if (!responseMessage) {
      return apiResponse.badRequest(
        res,
        "Response message is required for rejection"
      );
    }

    const request = await requestService.processRequest(
      requestId,
      "reject",
      responseMessage,
      req.userId
    );

    return apiResponse.success(res, "Request rejected successfully", request);
  } catch (error) {
    if (
      error.message.includes("not found") ||
      error.message.includes("already been processed")
    ) {
      return apiResponse.badRequest(res, error.message);
    }
    return apiResponse.serverError(res, error);
  }
};
