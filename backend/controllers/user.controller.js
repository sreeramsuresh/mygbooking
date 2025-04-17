// backend/controllers/user.controller.js
const db = require("../db/models");
const apiResponse = require("../utils/apiResponse");
const User = db.user;
const Role = db.role;
const AuditLog = db.auditLog;
const bcrypt = require("bcryptjs");

/**
 * Get all users
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: {
        exclude: ["password"],
      },
      include: [
        {
          model: Role,
          attributes: ["name"],
          through: { attributes: [] },
        },
        {
          model: User,
          as: "manager",
          attributes: ["id", "username", "fullName"],
        },
      ],
    });

    // Format user data
    const formattedUsers = users.map((user) => {
      const userData = {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        department: user.department,
        isActive: user.isActive,
        defaultWorkDays: user.defaultWorkDays,
        requiredDaysPerWeek: user.requiredDaysPerWeek,
        managerId: user.manager ? user.manager.id : null,
        managerName: user.manager ? user.manager.fullName : null,
        roles: user.roles.map((role) => `ROLE_${role.name.toUpperCase()}`),
      };

      return userData;
    });

    return apiResponse.success(
      res,
      "Users retrieved successfully",
      formattedUsers
    );
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get user by ID
 */
exports.getUserById = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findByPk(userId, {
      attributes: {
        exclude: ["password"],
      },
      include: [
        {
          model: Role,
          attributes: ["name"],
          through: { attributes: [] },
        },
        {
          model: User,
          as: "manager",
          attributes: ["id", "username", "fullName"],
        },
      ],
    });

    if (!user) {
      return apiResponse.notFound(res, "User not found");
    }

    // Format user data
    const userData = {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      department: user.department,
      isActive: user.isActive,
      defaultWorkDays: user.defaultWorkDays,
      requiredDaysPerWeek: user.requiredDaysPerWeek,
      managerId: user.manager ? user.manager.id : null,
      managerName: user.manager ? user.manager.fullName : null,
      roles: user.roles.map((role) => `ROLE_${role.name.toUpperCase()}`),
    };

    return apiResponse.success(res, "User retrieved successfully", userData);
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Create a new user
 */
exports.createUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      fullName,
      department,
      isActive,
      roles,
      managerId,
      defaultWorkDays,
      requiredDaysPerWeek,
    } = req.body;

    // Check if username or email already exists
    const existingUser = await User.findOne({
      where: {
        [db.Sequelize.Op.or]: [{ username }, { email }],
      },
    });

    if (existingUser) {
      return apiResponse.badRequest(res, "Username or email already exists");
    }

    // Create new user
    const newUser = await User.create({
      username,
      email,
      password: bcrypt.hashSync(password, 8),
      fullName,
      department,
      isActive: isActive !== undefined ? isActive : true,
      defaultWorkDays: defaultWorkDays || [1, 2, 3, 4, 5],
      requiredDaysPerWeek: requiredDaysPerWeek || 2,
    });

    // Assign roles
    if (roles && roles.length > 0) {
      const roleRecords = await Role.findAll({
        where: {
          name: {
            [db.Sequelize.Op.in]: roles.map((role) => role.toLowerCase()),
          },
        },
      });

      if (roleRecords.length > 0) {
        await newUser.setRoles(roleRecords);
      } else {
        // Assign default employee role
        const defaultRole = await Role.findOne({ where: { name: "employee" } });
        await newUser.setRoles([defaultRole]);
      }
    } else {
      // Assign default employee role
      const defaultRole = await Role.findOne({ where: { name: "employee" } });
      await newUser.setRoles([defaultRole]);
    }

    // Assign manager if provided
    if (managerId) {
      const manager = await User.findByPk(managerId);
      if (manager) {
        await newUser.setManager(manager);
      }
    }

    // Log the action
    await AuditLog.create({
      entityType: "user",
      entityId: newUser.id,
      action: "create",
      performedBy: req.userId,
      newValues: {
        username,
        email,
        fullName,
        department,
        isActive,
        roles,
        managerId,
        defaultWorkDays,
        requiredDaysPerWeek,
      },
    });

    return apiResponse.created(res, "User created successfully", {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      fullName: newUser.fullName,
      isActive: newUser.isActive,
    });
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Update a user
 */
exports.updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const {
      email,
      password,
      fullName,
      department,
      isActive,
      roles,
      managerId,
      defaultWorkDays,
      requiredDaysPerWeek,
    } = req.body;

    // Find the user
    const user = await User.findByPk(userId);

    if (!user) {
      return apiResponse.notFound(res, "User not found");
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({
        where: {
          email,
          id: { [db.Sequelize.Op.ne]: userId },
        },
      });

      if (existingUser) {
        return apiResponse.badRequest(res, "Email is already in use");
      }
    }

    // Save old values for audit log
    const oldValues = {
      email: user.email,
      fullName: user.fullName,
      department: user.department,
      isActive: user.isActive,
      defaultWorkDays: user.defaultWorkDays,
      requiredDaysPerWeek: user.requiredDaysPerWeek,
    };

    // Update user fields
    if (email) user.email = email;
    if (password) user.password = bcrypt.hashSync(password, 8);
    if (fullName) user.fullName = fullName;
    if (department !== undefined) user.department = department;
    if (isActive !== undefined) user.isActive = isActive;
    if (defaultWorkDays) user.defaultWorkDays = defaultWorkDays;
    if (requiredDaysPerWeek) user.requiredDaysPerWeek = requiredDaysPerWeek;

    // Save the changes
    await user.save();

    // Update roles if provided
    if (roles && roles.length > 0) {
      const roleRecords = await Role.findAll({
        where: {
          name: {
            [db.Sequelize.Op.in]: roles.map((role) => role.toLowerCase()),
          },
        },
      });

      if (roleRecords.length > 0) {
        await user.setRoles(roleRecords);
      }
    }

    // Update manager if provided
    if (managerId !== undefined) {
      if (managerId) {
        const manager = await User.findByPk(managerId);
        if (manager) {
          await user.setManager(manager);
        }
      } else {
        // Remove manager
        await user.setManager(null);
      }
    }

    // Get updated user with roles for response
    const updatedUser = await User.findByPk(userId, {
      attributes: {
        exclude: ["password"],
      },
      include: [
        {
          model: Role,
          attributes: ["name"],
          through: { attributes: [] },
        },
        {
          model: User,
          as: "manager",
          attributes: ["id", "username", "fullName"],
        },
      ],
    });

    // Format user data
    const userData = {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      fullName: updatedUser.fullName,
      department: updatedUser.department,
      isActive: updatedUser.isActive,
      defaultWorkDays: updatedUser.defaultWorkDays,
      requiredDaysPerWeek: updatedUser.requiredDaysPerWeek,
      managerId: updatedUser.manager ? updatedUser.manager.id : null,
      managerName: updatedUser.manager ? updatedUser.manager.fullName : null,
      roles: updatedUser.roles.map((role) => `ROLE_${role.name.toUpperCase()}`),
    };

    // Log the action
    await AuditLog.create({
      entityType: "user",
      entityId: userId,
      action: "update",
      performedBy: req.userId,
      oldValues,
      newValues: {
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        department: updatedUser.department,
        isActive: updatedUser.isActive,
        defaultWorkDays: updatedUser.defaultWorkDays,
        requiredDaysPerWeek: updatedUser.requiredDaysPerWeek,
        roles: updatedUser.roles.map((role) => role.name),
        managerId: updatedUser.manager ? updatedUser.manager.id : null,
      },
    });

    return apiResponse.success(res, "User updated successfully", userData);
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Delete a user
 */
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Prevent deleting yourself
    if (userId == req.userId) {
      return apiResponse.badRequest(res, "You cannot delete your own account");
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return apiResponse.notFound(res, "User not found");
    }

    // Check if user is the manager of other users
    const managedUsers = await User.count({
      where: { managerId: userId },
    });

    if (managedUsers > 0) {
      return apiResponse.badRequest(
        res,
        "Cannot delete user who is a manager. Please reassign their team members first."
      );
    }

    // Store user data for audit log
    const userData = {
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      department: user.department,
    };

    // Delete the user
    await user.destroy();

    // Log the action
    await AuditLog.create({
      entityType: "user",
      entityId: userId,
      action: "delete",
      performedBy: req.userId,
      oldValues: userData,
    });

    return apiResponse.success(res, "User deleted successfully");
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Toggle user's active status
 */
exports.toggleUserStatus = async (req, res) => {
  try {
    const userId = req.params.id;
    const { isActive } = req.body;

    // Prevent deactivating yourself
    if (userId == req.userId && isActive === false) {
      return apiResponse.badRequest(
        res,
        "You cannot deactivate your own account"
      );
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return apiResponse.notFound(res, "User not found");
    }

    // Store old status for audit log
    const oldStatus = user.isActive;

    // Update status
    user.isActive = isActive;
    await user.save();

    // Log the action
    await AuditLog.create({
      entityType: "user",
      entityId: userId,
      action: "update-status",
      performedBy: req.userId,
      oldValues: { isActive: oldStatus },
      newValues: { isActive },
    });

    return apiResponse.success(
      res,
      `User ${isActive ? "activated" : "deactivated"} successfully`,
      {
        id: user.id,
        username: user.username,
        isActive: user.isActive,
      }
    );
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Assign manager to a user
 */
exports.assignManager = async (req, res) => {
  try {
    const userId = req.params.id;
    const { managerId } = req.body;

    const user = await User.findByPk(userId);

    if (!user) {
      return apiResponse.notFound(res, "User not found");
    }

    // Check if managerId is valid
    if (managerId) {
      const manager = await User.findByPk(managerId);

      if (!manager) {
        return apiResponse.badRequest(res, "Manager not found");
      }

      // Check if manager has appropriate role
      const managerRoles = await manager.getRoles();
      const hasManagerRole = managerRoles.some(
        (role) => role.name === "manager" || role.name === "admin"
      );

      if (!hasManagerRole) {
        return apiResponse.badRequest(
          res,
          "Selected user does not have manager or admin role"
        );
      }

      // Check for circular management relationship
      if (userId === managerId) {
        return apiResponse.badRequest(res, "User cannot be their own manager");
      }
    }

    // Store old managerId for audit log
    const oldManagerId = user.managerId;

    // Update manager
    if (managerId) {
      await user.setManager(managerId);
    } else {
      await user.setManager(null);
    }

    // Log the action
    await AuditLog.create({
      entityType: "user",
      entityId: userId,
      action: "assign-manager",
      performedBy: req.userId,
      oldValues: { managerId: oldManagerId },
      newValues: { managerId },
    });

    return apiResponse.success(res, "Manager assignment updated successfully", {
      id: user.id,
      username: user.username,
      managerId,
    });
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get users by department
 */
exports.getUsersByDepartment = async (req, res) => {
  try {
    const { department } = req.query;

    if (!department) {
      return apiResponse.badRequest(res, "Department parameter is required");
    }

    const users = await User.findAll({
      where: {
        department,
        isActive: true,
      },
      attributes: {
        exclude: ["password"],
      },
      include: [
        {
          model: Role,
          attributes: ["name"],
          through: { attributes: [] },
        },
      ],
    });

    // Format user data
    const formattedUsers = users.map((user) => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      roles: user.roles.map((role) => `ROLE_${role.name.toUpperCase()}`),
    }));

    return apiResponse.success(
      res,
      "Users retrieved successfully",
      formattedUsers
    );
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get all managers
 */
exports.getAllManagers = async (req, res) => {
  try {
    // Find users with manager or admin role
    const managers = await User.findAll({
      attributes: {
        exclude: ["password"],
      },
      include: [
        {
          model: Role,
          where: {
            name: {
              [db.Sequelize.Op.in]: ["manager", "admin"],
            },
          },
          attributes: ["name"],
          through: { attributes: [] },
        },
      ],
      where: {
        isActive: true,
      },
    });

    // Format manager data
    const formattedManagers = managers.map((manager) => ({
      id: manager.id,
      username: manager.username,
      fullName: manager.fullName,
      email: manager.email,
      department: manager.department,
      roles: manager.roles.map((role) => `ROLE_${role.name.toUpperCase()}`),
    }));

    return apiResponse.success(
      res,
      "Managers retrieved successfully",
      formattedManagers
    );
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};

/**
 * Get all departments
 */
exports.getAllDepartments = async (req, res) => {
  try {
    // Get distinct departments
    const departments = await User.findAll({
      attributes: [
        [
          db.Sequelize.fn("DISTINCT", db.Sequelize.col("department")),
          "department",
        ],
      ],
      where: {
        department: {
          [db.Sequelize.Op.ne]: null,
          [db.Sequelize.Op.ne]: "",
        },
      },
      raw: true,
    });

    const departmentList = departments
      .map((item) => item.department)
      .filter(Boolean); // Remove any null/undefined values

    return apiResponse.success(
      res,
      "Departments retrieved successfully",
      departmentList
    );
  } catch (error) {
    return apiResponse.serverError(res, error);
  }
};
