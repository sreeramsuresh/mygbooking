// backend/routes/desktop.routes.js
const express = require("express");
const controller = require("../controllers/desktop.controller");
const { authJwt } = require("../middleware");

const router = express.Router();

// Public routes (no authentication)
router.post("/login", controller.desktopLogin);

// Protected routes (require authentication)
router.post("/logout", authJwt.verifyToken, controller.desktopLogout);
router.post(
  "/track-connection",
  authJwt.verifyToken,
  controller.trackConnection
);

// Admin routes
router.post(
  "/reset-mac-address",
  [authJwt.verifyToken, authJwt.isAdmin],
  controller.resetMacAddress
);

router.get(
  "/active-sessions",
  [authJwt.verifyToken, authJwt.isAdmin],
  controller.getActiveSessions
);

module.exports = router;
