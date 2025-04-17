// backend/services/auth.service.js
const db = require("../db/models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;
const AuditLog = db.auditLog;

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * Authenticate a user and generate tokens
 * @param {string} username
 * @param {string} password
 * @returns {Object} Authentication result
 */
const authenticateUser = async (username, password) => {
  try {
    // Find user by username
    const user = await User.findOne({
      where: { username },
    });

    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Check if user is active
    if (!user.isActive) {
      return { success: false, message: "User account is inactive" };
    }

    // Verify password
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return { success: false, message: "Invalid password" };
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: config.jwtExpiration,
    });

    // Get user roles
    const roles = await user.getRoles();
    const authorities = roles.map((role) => `ROLE_${role.name.toUpperCase()}`);

    // Log successful login
    await AuditLog.create({
      entityType: "user",
      entityId: user.id,
      action: "login",
      performedBy: user.id,
      newValues: { lastLogin: new Date() },
    });

    return {
      success: true,
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      roles: authorities,
      accessToken: token,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Register a new user
 * @param {Object} userData User data
 * @param {Array} roles User roles
 * @param {number} createdBy ID of user creating this account
 * @returns {Object} Created user
 */
const registerUser = async (
  userData,
  roles = ["employee"],
  createdBy = null
) => {
  try {
    // Create user
    const user = await User.create({
      username: userData.username,
      email: userData.email,
      password: bcrypt.hashSync(userData.password, 8),
      fullName: userData.fullName,
      department: userData.department,
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      defaultWorkDays: userData.defaultWorkDays || [1, 2, 3, 4, 5],
      requiredDaysPerWeek: userData.requiredDaysPerWeek || 2,
    });

    // Find role records
    let roleIds = [];
    if (roles && roles.length > 0) {
      const foundRoles = await Role.findAll({
        where: {
          name: { [db.Sequelize.Op.in]: roles },
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
          roles: roles,
        },
      });
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      roles: roles,
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  authenticateUser,
  registerUser,
};
