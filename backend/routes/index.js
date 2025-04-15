// backend/routes/index.js
const express = require("express");
const router = express.Router();

// Import all route modules
const authRoutes = require("./authRoutes");
const bookingRoutes = require("./bookingRoutes");
const scheduleRoutes = require("./scheduleRoutes");
const requestRoutes = require("./requestRoutes");
const userRoutes = require("./userRoutes");
const attendanceRoutes = require("./attendanceRoutes");

// Register routes
router.use("/auth", authRoutes);
router.use("/bookings", bookingRoutes);
router.use("/schedules", scheduleRoutes);
router.use("/requests", requestRoutes);
router.use("/users", userRoutes);
router.use("/attendance", attendanceRoutes);

module.exports = router;
