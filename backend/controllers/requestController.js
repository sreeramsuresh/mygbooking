// backend/controllers/requestController.js
const { WFHRequest, User } = require("../models");
const { Op } = require("sequelize");
const emailService = require("../services/emailService");

// Create a new WFH request
const createRequest = async (req, res) => {
  try {
    const { start_date, end_date, reason } = req.body;
    const user_id = req.user.id;

    // Validate required fields
    if (!start_date || !end_date || !reason) {
      return res.status(400).json({
        success: false,
        message: "Start date, end date, and reason are required",
      });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: "End date cannot be before start date",
      });
    }

    // Check for overlapping requests
    const overlappingRequest = await WFHRequest.findOne({
      where: {
        user_id,
        status: { [Op.in]: ["pending", "approved"] },
        [Op.or]: [
          {
            start_date: { [Op.lte]: end_date },
            end_date: { [Op.gte]: start_date },
          },
        ],
      },
    });

    if (overlappingRequest) {
      return res.status(409).json({
        success: false,
        message: "You already have an overlapping WFH request for this period",
      });
    }

    // Create new request
    const newRequest = await WFHRequest.create({
      user_id,
      start_date,
      end_date,
      reason,
      status: "pending",
    });

    // Notify managers of new request
    const managers = await User.findAll({
      where: { role: "manager" },
    });

    for (const manager of managers) {
      await emailService.sendRequestNotification(
        manager.email,
        req.user,
        newRequest
      );
    }

    return res.status(201).json({
      success: true,
      message: "WFH request created successfully",
      data: newRequest,
    });
  } catch (error) {
    console.error("Error creating WFH request:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while creating WFH request",
    });
  }
};

// Get pending requests (for managers)
const getPendingRequests = async (req, res) => {
  try {
    // Check if user is manager or admin
    if (!["manager", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view pending requests",
      });
    }

    // Get pending requests
    const pendingRequests = await WFHRequest.findAll({
      where: { status: "pending" },
      include: [
        {
          model: User,
          attributes: ["id", "username", "first_name", "last_name", "email"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: pendingRequests,
    });
  } catch (error) {
    console.error("Error getting pending requests:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while getting pending requests",
    });
  }
};

// Approve or reject a WFH request
const updateRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const manager_id = req.user.id;

    // Validate status
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either approved or rejected",
      });
    }

    // Check if user is manager or admin
    if (!["manager", "admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update request status",
      });
    }

    // Find request
    const request = await WFHRequest.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ["id", "username", "first_name", "last_name", "email"],
        },
      ],
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request not found",
      });
    }

    // Check if request is already processed
    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Request has already been processed",
      });
    }

    // Update request status
    await request.update({
      status,
      approved_by: manager_id,
      manager_notes: notes,
    });

    // Notify user of request status
    await emailService.sendRequestStatusNotification(
      request.User.email,
      status,
      notes,
      request
    );

    return res.status(200).json({
      success: true,
      message: `Request ${status} successfully`,
    });
  } catch (error) {
    console.error("Error updating request status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating request status",
    });
  }
};

module.exports = {
  createRequest,
  getPendingRequests,
  updateRequestStatus,
};
