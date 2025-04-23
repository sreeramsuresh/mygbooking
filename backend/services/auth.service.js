// backend/services/auth.service.js
const db = require("../db/models");
const config = require("../config/auth.config");
const User = db.user;
const Role = db.role;
const AuditLog = db.auditLog;
const bookingService = require("./booking.service");
const refreshTokenService = require("./refreshToken.service");
const { Op } = db.Sequelize;

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * Authenticate a user and generate tokens
 * @param {string} login - Username or email
 * @param {string} password
 * @returns {Object} Authentication result
 */
const authenticateUser = async (login, password) => {
  try {
    // Find user by username or email
    const user = await User.findOne({
      where: {
        [Op.or]: [{ username: login }, { email: login }],
      },
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

    // Create refresh token
    const refreshToken = await refreshTokenService.createToken(user.id);

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
      refreshToken: refreshToken.token,
      defaultWorkDays: user.defaultWorkDays,
      requiredDaysPerWeek: user.requiredDaysPerWeek,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Refresh the access token using a refresh token
 * @param {string} requestToken - The refresh token
 * @returns {Object} New tokens
 */
const refreshToken = async (requestToken) => {
  try {
    // Find the refresh token in the database
    const refreshToken = await refreshTokenService.findByToken(requestToken);

    if (!refreshToken) {
      return { success: false, message: "Refresh token not found" };
    }

    // Verify the token is not expired or revoked
    if (!refreshTokenService.verifyExpiration(refreshToken)) {
      return { success: false, message: "Refresh token was expired" };
    }

    const userId = refreshToken.userId;

    // Find the user
    const user = await User.findByPk(userId);
    if (!user) {
      return { success: false, message: "User not found" };
    }

    // Generate a new access token
    const newAccessToken = jwt.sign({ id: user.id }, config.secret, {
      expiresIn: config.jwtExpiration,
    });

    // Revoke the old refresh token and create a new one for better security
    await refreshToken.update({ isRevoked: true });
    const newRefreshToken = await refreshTokenService.createToken(userId);

    return {
      success: true,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken.token,
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

    // Log user preferences
    console.log(
      `New user ${
        user.id
      } created with preferences: defaultWorkDays=${JSON.stringify(
        user.defaultWorkDays
      )}, requiredDaysPerWeek=${user.requiredDaysPerWeek}`
    );

    // Automatically run auto-booking for this new user
    try {
      // Get today's date and find next Monday
      const today = new Date();
      const nextMonday = new Date(today);
      nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7));
      const weekStartDate = nextMonday.toISOString().split("T")[0];

      console.log(
        `Automatically generating auto-bookings for new user ${user.id}`
      );

      // Create auto-bookings for this user based on their preferences
      await bookingService.createAutoBookingsForUser(
        user.id,
        weekStartDate,
        createdBy || user.id // Use the creator ID if available, otherwise the user's own ID
      );

      console.log(`Auto-bookings successfully created for new user ${user.id}`);
    } catch (autoBookingError) {
      console.error(
        `Error generating auto-bookings for new user ${user.id}:`,
        autoBookingError
      );
      // We don't throw the error here to allow the registration to complete
      // even if auto-booking fails
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

/**
 * Log out a user by revoking their refresh tokens
 * @param {number} userId - The user ID
 */
const logout = async (userId) => {
  try {
    await refreshTokenService.revokeAllUserTokens(userId);
    return { success: true, message: "User logged out successfully" };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  authenticateUser,
  registerUser,
  refreshToken,
  logout,
};
