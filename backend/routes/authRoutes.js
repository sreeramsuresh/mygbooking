// backend/routes/authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken, checkRole } = require("../middleware/auth");
const {
  validateLoginRequest,
  validateRegisterRequest,
} = require("../middleware/validation");

// Public routes
router.post("/login", validateLoginRequest, authController.login);

// Protected routes
router.get("/validate", verifyToken, authController.validateToken);
router.post(
  "/register",
  verifyToken,
  checkRole("admin"),
  validateRegisterRequest,
  authController.register
);

module.exports = router;
