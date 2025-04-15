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
router.post("/public-register", validateRegisterRequest, authController.registerPublic); // Renamed to be explicit
router.post("/signup", validateRegisterRequest, authController.registerPublic); // Alternative route for public registration

// Special test route with no validation or middleware
router.post("/test-register", (req, res) => {
  console.log("TEST REGISTER ROUTE");
  console.log("Request body:", req.body);
  
  return res.status(200).json({
    success: true, 
    message: "Test registration route reached successfully",
    receivedData: req.body
  });
});

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
