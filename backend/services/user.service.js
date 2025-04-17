// backend/services/user.service.js
const db = require("../db/models");
const bcrypt = require("bcryptjs");
const User = db.user;
const Role = db.role;
const AuditLog = db.auditLog;
const { Op } = db.Sequelize;

/**
 * Get all users with their roles
 */
const getAllUsers = async () => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Role,
          attributes: ["name"],
          through: { attributes: [] },
        },
      ],
    });

    // Format the response
    const formattedUsers = users.map((user) => {
      const userData = user.toJSON();
      return {
        ...userData,
        roles: userData.roles.map((role) => `ROLE_${role.name.toUpperCase()}`),
      };
    });

    return formattedUsers;
  } catch (error) {
    throw error;
  }
};

/**
 * Get a specific user by ID
 */
const getUserById = async (userId) => {
  try {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
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
      return null;
    }

    // Format the response
    const userData = user.toJSON();
    return {
      ...userData,
      roles: userData.roles.map((role) => `ROLE_${role.name.toUpperCase()}`),
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Create a new user
 */
const createUser = async (userData, createdBy = null) => {
  try {
    // Check if username already exists
    const existingUsername = await User.findOne({
      where: { username: userData.username },
    });
    if (existingUsername) {
      throw new Error("Username already exists");
    }

    // Check if email already exists
    const existingEmail = await User.findOne({
      where: { email: userData.email },
    });
    if (existingEmail) {
      throw new Error("Email already exists");
    }

    // Create the user
    const hashedPassword = bcrypt.hashSync(userData.password, 8);
    const user = await User.create({
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      fullName: userData.fullName,
      department: userData.department,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      managerId: userData.managerId || null,
      defaultWorkDays: userData.defaultWorkDays || [1, 2, 3, 4, 5],
      requiredDaysPerWeek: userData.requiredDaysPerWeek || 2,
    });

    // Assign roles to the user
    let roleIds = [];
    if (userData.roles && userData.roles.length > 0) {
      // Convert role names to lowercase to ensure consistency
      const roleNames = userData.roles.map((role) => role.toLowerCase());

      const foundRoles = await Role.findAll({
        where: {
          name: { [Op.in]: roleNames },
        },
      });

      roleIds = foundRoles.map((role) => role.id);
    } else {
      // Default to employee role
      const defaultRole = await Role.findOne({ where: { name: "employee" } });
      if (defaultRole) {
        roleIds = [defaultRole.id];
      }
    }

    // Assign roles to user
    await user.setRoles(roleIds);

    // Log user creation
    if (createdBy) {
      await AuditLog.create({
        entityType: "user",
        entityId: user.id,
        action: "create",
        performedBy: createdBy,
        newValues: {
          username: userData.username,
          email: userData.email,
          fullName: userData.fullName,
          department: userData.department,
          isActive: userData.isActive,
          managerId: userData.managerId,
          roles: userData.roles,
        },
      });
    }

    // Return user data without password
    const createdUser = await getUserById(user.id);
    return createdUser;
  } catch (error) {
    throw error;
  }
};

/**
 * Update an existing user
 */
const updateUser = async (userId, updates, performedBy = null) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return null;
    }

    // Check if username is being changed and if it already exists
    if (updates.username && updates.username !== user.username) {
      const existingUsername = await User.findOne({
        where: { username: updates.username },
      });
      if (existingUsername) {
        throw new Error("Username already exists");
      }
    }

    // Check if email is being changed and if it already exists
    if (updates.email && updates.email !== user.email) {
      const existingEmail = await User.findOne({
        where: { email: updates.email },
      });
      if (existingEmail) {
        throw new Error("Email already exists");
      }
    }

    // Store old values for audit log
    const oldValues = { ...user.dataValues };

    // Update password if provided
    if (updates.password) {
      updates.password = bcrypt.hashSync(updates.password, 8);
    }

    // Update user data
    const updateFields = [
      "username",
      "email",
      "password",
      "fullName",
      "department",
      "isActive",
      "managerId",
      "defaultWorkDays",
      "requiredDaysPerWeek",
    ];

    // Filter only valid fields
    const validUpdates = {};
    updateFields.forEach((field) => {
      if (updates[field] !== undefined) {
        validUpdates[field] = updates[field];
      }
    });

    await user.update(validUpdates);

    // Update roles if provided
    if (updates.roles && Array.isArray(updates.roles)) {
      // Convert role names to lowercase
      const roleNames = updates.roles.map((role) => role.toLowerCase());

      const foundRoles = await Role.findAll({
        where: {
          name: { [Op.in]: roleNames },
        },
      });

      const roleIds = foundRoles.map((role) => role.id);
      await user.setRoles(roleIds);
    }

    // Log user update
    if (performedBy) {
      await AuditLog.create({
        entityType: "user",
        entityId: user.id,
        action: "update",
        performedBy,
        oldValues,
        newValues: {
          ...validUpdates,
          roles: updates.roles,
        },
      });
    }

    // Return updated user data
    const updatedUser = await getUserById(userId);
    return updatedUser;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete a user
 */
const deleteUser = async (userId, performedBy = null) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return false;
    }

    // Store user data for audit log
    const userData = { ...user.dataValues };

    // Delete user
    await user.destroy();

    // Log user deletion
    if (performedBy) {
      await AuditLog.create({
        entityType: "user",
        entityId: userId,
        action: "delete",
        performedBy,
        oldValues: userData,
      });
    }

    return true;
  } catch (error) {
    throw error;
  }
};

/**
 * Toggle user active status
 */
const toggleUserStatus = async (userId, isActive, performedBy = null) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return null;
    }

    // Store old values for audit log
    const oldValues = { ...user.dataValues };

    // Update status
    await user.update({ isActive });

    // Log status change
    if (performedBy) {
      await AuditLog.create({
        entityType: "user",
        entityId: userId,
        action: isActive ? "activate" : "deactivate",
        performedBy,
        oldValues,
        newValues: { isActive },
      });
    }

    // Return updated user data
    const updatedUser = await getUserById(userId);
    return updatedUser;
  } catch (error) {
    throw error;
  }
};

/**
 * Assign a manager to a user
 */
const assignManager = async (userId, managerId, performedBy = null) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return null;
    }

    // Check if assigning self as manager
    if (managerId && managerId == userId) {
      throw new Error("Cannot assign user as their own manager");
    }

    // Check if manager exists
    if (managerId) {
      const manager = await User.findByPk(managerId);
      if (!manager) {
        throw new Error("Manager not found");
      }

      // Check if manager has manager or admin role
      const roles = await manager.getRoles();
      const isManagerRole = roles.some(
        (role) => role.name === "manager" || role.name === "admin"
      );

      if (!isManagerRole) {
        throw new Error("Selected user does not have manager privileges");
      }
    }

    // Store old values for audit log
    const oldValues = { ...user.dataValues };

    // Update manager
    await user.update({ managerId });

    // Log manager assignment
    if (performedBy) {
      await AuditLog.create({
        entityType: "user",
        entityId: userId,
        action: "assign_manager",
        performedBy,
        oldValues,
        newValues: { managerId },
      });
    }

    // Return updated user data
    const updatedUser = await getUserById(userId);
    return updatedUser;
  } catch (error) {
    throw error;
  }
};

/**
 * Update current user's profile
 */
const updateProfile = async (userId, updates) => {
  try {
    const user = await User.findByPk(userId);

    if (!user) {
      return null;
    }

    // Check if email is being changed and if it already exists
    if (updates.email && updates.email !== user.email) {
      const existingEmail = await User.findOne({
        where: { email: updates.email },
      });
      if (existingEmail) {
        throw new Error("Email already exists");
      }
    }

    // Verify old password if changing password
    if (updates.password && updates.oldPassword) {
      const isValidPassword = bcrypt.compareSync(
        updates.oldPassword,
        user.password
      );
      if (!isValidPassword) {
        throw new Error("Incorrect old password");
      }

      // Hash new password
      updates.password = bcrypt.hashSync(updates.password, 8);
    }

    // Remove oldPassword from updates
    if (updates.oldPassword) {
      delete updates.oldPassword;
    }

    // Store old values for audit log
    const oldValues = { ...user.dataValues };

    // Update user data
    const updateFields = [
      "email",
      "password",
      "fullName",
      "department",
      "defaultWorkDays",
      "requiredDaysPerWeek",
    ];

    // Filter only valid fields
    const validUpdates = {};
    updateFields.forEach((field) => {
      if (updates[field] !== undefined) {
        validUpdates[field] = updates[field];
      }
    });

    await user.update(validUpdates);

    // Log profile update
    await AuditLog.create({
      entityType: "user",
      entityId: userId,
      action: "update_profile",
      performedBy: userId,
      oldValues,
      newValues: validUpdates,
    });

    // Return updated user data without password
    const updatedUser = await getUserById(userId);
    return updatedUser;
  } catch (error) {
    throw error;
  }
};

/**
 * Get users by role
 */
const getUsersByRole = async (roleName) => {
  try {
    const role = await Role.findOne({
      where: { name: roleName.toLowerCase() },
    });

    if (!role) {
      return [];
    }

    const users = await role.getUsers({
      attributes: { exclude: ["password"] },
    });

    // Format the response
    const formattedUsers = users.map((user) => {
      const userData = user.toJSON();
      return {
        ...userData,
        role: roleName,
      };
    });

    return formattedUsers;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  assignManager,
  updateProfile,
  getUsersByRole,
};
