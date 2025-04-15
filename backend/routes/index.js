// backend/routes/index.js
const express = require("express");
const router = express.Router();

// Import all route modules
const authRoutes = require("./authRoutes");

// Register routes
router.use("/auth", authRoutes);

// Placeholder route for testing
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is up and running",
    timestamp: new Date(),
  });
});

module.exports = router;
