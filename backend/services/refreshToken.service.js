// backend/services/refreshToken.service.js
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const db = require("../db/models");
const config = require("../config/auth.config");
const RefreshToken = db.refreshToken;
const User = db.user;
const { Op } = db.Sequelize;

/**
 * Create a new refresh token for a user
 */
const createToken = async (userId) => {
  try {
    // Generate a unique refresh token
    const token = uuidv4();

    // Calculate expiry date
    const expiryDate = new Date();
    expiryDate.setSeconds(
      expiryDate.getSeconds() + config.jwtRefreshExpiration
    );

    // Create the refresh token in the database
    const refreshToken = await RefreshToken.create({
      token: token,
      userId: userId,
      expiryDate: expiryDate,
    });

    return {
      token: refreshToken.token,
      expiryDate: refreshToken.expiryDate,
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Verify if a refresh token is valid and not expired
 */
const verifyExpiration = (token) => {
  if (token.expiryDate.getTime() < new Date().getTime()) {
    // Token has expired - mark it as revoked in the database
    token.update({ isRevoked: true });
    return false;
  }

  return !token.isRevoked;
};

/**
 * Find a refresh token in the database
 */
const findByToken = async (token) => {
  try {
    const refreshToken = await RefreshToken.findOne({
      where: { token: token },
      include: [
        {
          model: User,
          attributes: ["id", "username"],
        },
      ],
    });

    return refreshToken;
  } catch (error) {
    throw error;
  }
};

/**
 * Revoke all refresh tokens for a user
 */
const revokeAllUserTokens = async (userId) => {
  try {
    await RefreshToken.update(
      { isRevoked: true },
      { where: { userId: userId } }
    );
  } catch (error) {
    throw error;
  }
};

/**
 * Clean up expired and revoked refresh tokens
 */
const cleanupTokens = async () => {
  try {
    const deleted = await RefreshToken.destroy({
      where: {
        [Op.or]: [
          { expiryDate: { [Op.lt]: new Date() } },
          { isRevoked: true }
        ]
      }
    });
    
    console.log(`Cleaned up ${deleted} expired or revoked refresh tokens`);
    return deleted;
  } catch (error) {
    console.error("Error cleaning up refresh tokens:", error);
    throw error;
  }
};

module.exports = {
  createToken,
  verifyExpiration,
  findByToken,
  revokeAllUserTokens,
  cleanupTokens,
};
