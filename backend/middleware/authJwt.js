// backend/middleware/authJwt.js
const jwt = require("jsonwebtoken");
const db = require("../db/models");
const User = db.user;
const Role = db.role;
const config = require("../config/auth.config");

/**
 * Verify JWT token middleware
 */
const verifyToken = (req, res, next) => {
  const token =
    req.headers["x-access-token"] || req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(403).send({
      message: "No token provided!",
    });
  }

  jwt.verify(token, config.secret, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!",
      });
    }
    req.userId = decoded.id;
    next();
  });
};

/**
 * Check if user is an admin
 */
const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const roles = await user.getRoles();

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "admin") {
        return next();
      }
    }

    return res.status(403).send({
      message: "Admin role required!",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Unable to validate user role",
    });
  }
};

/**
 * Check if user is a manager
 */
const isManager = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const roles = await user.getRoles();

    for (let i = 0; i < roles.length; i++) {
      if (roles[i].name === "manager" || roles[i].name === "admin") {
        return next();
      }
    }

    return res.status(403).send({
      message: "Manager role required!",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Unable to validate user role",
    });
  }
};

/**
 * Check if user is an employee (or higher role)
 */
const isEmployee = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);
    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    const roles = await user.getRoles();

    for (let i = 0; i < roles.length; i++) {
      if (["employee", "manager", "admin"].includes(roles[i].name)) {
        return next();
      }
    }

    return res.status(403).send({
      message: "Employee role required!",
    });
  } catch (error) {
    return res.status(500).send({
      message: "Unable to validate user role",
    });
  }
};

/**
 * Check if the user is active
 */
const isActiveUser = async (req, res, next) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    if (!user.isActive) {
      return res.status(403).send({
        message: "User account is inactive",
      });
    }

    next();
  } catch (error) {
    return res.status(500).send({
      message: "Unable to validate user status",
    });
  }
};

const authJwt = {
  verifyToken,
  isAdmin,
  isManager,
  isEmployee,
  isActiveUser,
};

module.exports = authJwt;
