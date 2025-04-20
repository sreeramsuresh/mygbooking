// backend/middleware/verifySignUp.js
const db = require("../db/models");
const User = db.user;
const ROLES = db.ROLES;

/**
 * Check if username and email are unique
 */
const checkDuplicateUsernameOrEmail = async (req, res, next) => {
  try {
    // Check for duplicate username
    const userByUsername = await User.findOne({
      where: {
        username: req.body.username,
      },
    });

    if (userByUsername) {
      return res.status(400).send({
        message: "Failed! Username is already in use!",
      });
    }

    // Check for duplicate email
    const userByEmail = await User.findOne({
      where: {
        email: req.body.email,
      },
    });

    if (userByEmail) {
      return res.status(400).send({
        message: "Failed! Email is already in use!",
      });
    }
    
    // Log registration data including default work days
    console.log("Registration data:", {
      username: req.body.username,
      email: req.body.email,
      fullName: req.body.fullName,
      defaultWorkDays: req.body.defaultWorkDays || [1, 2, 3, 4, 5],
      requiredDaysPerWeek: req.body.requiredDaysPerWeek || 2
    });

    next();
  } catch (error) {
    return res.status(500).send({
      message: "Unable to validate username/email",
    });
  }
};

/**
 * Check if roles in the request are valid
 */
const checkRolesExisted = (req, res, next) => {
  if (req.body.roles) {
    for (let i = 0; i < req.body.roles.length; i++) {
      if (!ROLES.includes(req.body.roles[i])) {
        return res.status(400).send({
          message: `Failed! Role ${req.body.roles[i]} does not exist!`,
        });
      }
    }
  }

  next();
};

const verifySignUp = {
  checkDuplicateUsernameOrEmail,
  checkRolesExisted,
};

module.exports = verifySignUp;
