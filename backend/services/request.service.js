// backend/services/request.service.js
const db = require("../db/models");
const { Op } = db.Sequelize;
const Request = db.request;
const User = db.user;
const AuditLog = db.auditLog;

/**
 * Create a new request (regularization or WFH)
 */
const createRequest = async (userId, data, performedBy) => {
  try {
    // Validate request type
    if (!["regularization", "wfh"].includes(data.type)) {
      throw new Error("Invalid request type");
    }

    // Check if there's already a request for this date and type
    const existingRequest = await Request.findOne({
      where: {
        userId,
        type: data.type,
        date: data.date,
        status: { [Op.ne]: "rejected" },
      },
    });

    if (existingRequest) {
      throw new Error(`You already have a ${data.type} request for this date`);
    }

    // Get user's manager ID
    const user = await User.findByPk(userId, {
      include: [
        {
          model: User,
          as: "manager",
        },
      ],
    });

    if (!user) {
      throw new Error("User not found");
    }

    // If no manager assigned, get any user with manager role
    let managerId = user.manager ? user.manager.id : null;

    if (!managerId) {
      const managers = await User.findAll({
        include: [
          {
            model: db.role,
            where: { name: "manager" },
          },
        ],
        limit: 1,
      });

      if (managers && managers.length > 0) {
        managerId = managers[0].id;
      }
    }

    if (!managerId) {
      throw new Error("No manager available to process this request");
    }

    // Create the request
    const request = await Request.create({
      userId,
      managerId,
      type: data.type,
      date: data.date,
      reason: data.reason,
      status: "pending",
    });

    // Log the action
    await AuditLog.create({
      entityType: "request",
      entityId: request.id,
      action: "create",
      performedBy,
      newValues: {
        userId,
        managerId,
        type: data.type,
        date: data.date,
        reason: data.reason,
        status: "pending",
      },
    });

    return request;
  } catch (error) {
    throw error;
  }
};

/**
 * Get requests for a user
 */
const getUserRequests = async (userId, filters = {}) => {
  try {
    const whereClause = { userId };

    if (filters.type) {
      whereClause.type = filters.type;
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.startDate && filters.endDate) {
      whereClause.date = {
        [Op.between]: [filters.startDate, filters.endDate],
      };
    } else if (filters.startDate) {
      whereClause.date = {
        [Op.gte]: filters.startDate,
      };
    } else if (filters.endDate) {
      whereClause.date = {
        [Op.lte]: filters.endDate,
      };
    }

    const requests = await Request.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "manager",
          attributes: ["id", "username", "fullName"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    return requests;
  } catch (error) {
    throw error;
  }
};

/**
 * Get pending requests for a manager
 */
const getPendingRequests = async (managerId, filters = {}) => {
  try {
    const whereClause = {
      managerId,
      status: "pending",
    };

    if (filters.type) {
      whereClause.type = filters.type;
    }

    if (filters.startDate && filters.endDate) {
      whereClause.date = {
        [Op.between]: [filters.startDate, filters.endDate],
      };
    } else if (filters.startDate) {
      whereClause.date = {
        [Op.gte]: filters.startDate,
      };
    } else if (filters.endDate) {
      whereClause.date = {
        [Op.lte]: filters.endDate,
      };
    }

    const requests = await Request.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ["id", "username", "fullName", "department"],
        },
      ],
      order: [["createdAt", "ASC"]],
    });

    return requests;
  } catch (error) {
    throw error;
  }
};

/**
 * Process a request (approve or reject)
 */
const processRequest = async (
  requestId,
  action,
  responseMessage,
  performedBy
) => {
  try {
    // Validate action
    if (!["approve", "reject"].includes(action)) {
      throw new Error("Invalid action");
    }

    const request = await Request.findByPk(requestId);

    if (!request) {
      throw new Error("Request not found");
    }

    if (request.status !== "pending") {
      throw new Error("This request has already been processed");
    }

    // Store old values for audit log
    const oldValues = { ...request.dataValues };

    // Update request status
    await request.update({
      status: action === "approve" ? "approved" : "rejected",
      responseMessage,
      responseDate: new Date(),
    });

    // Log the action
    await AuditLog.create({
      entityType: "request",
      entityId: request.id,
      action: `${action}-request`,
      performedBy,
      oldValues,
      newValues: {
        status: action === "approve" ? "approved" : "rejected",
        responseMessage,
        responseDate: new Date(),
      },
    });

    return request;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createRequest,
  getUserRequests,
  getPendingRequests,
  processRequest,
};
