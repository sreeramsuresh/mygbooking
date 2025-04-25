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

// Add this route to backend/routes/desktop.routes.js
router.post(
  "/reset-mac-address",
  [authJwt.verifyToken, authJwt.isAdmin],
  controller.resetMacAddress
);

module.exports = router;
