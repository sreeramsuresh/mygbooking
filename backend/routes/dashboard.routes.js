// backend/routes/dashboard.routes.js
const express = require("express");
const controller = require("../controllers/dashboard.controller");
const { authJwt } = require("../middleware");

const router = express.Router();

// Apply middleware to all routes
router.use(authJwt.verifyToken);
router.use(authJwt.isActiveUser);

// Get dashboard based on role
router.get("/employee", controller.getEmployeeDashboard);
router.get("/manager", [authJwt.isManager], controller.getManagerDashboard);
router.get("/admin", [authJwt.isAdmin], controller.getAdminDashboard);

// Attendance reporting endpoints
router.get("/attendance", [authJwt.isAdmin], controller.getTodayAttendance);
router.get("/attendance/weekly", [authJwt.isAdmin], controller.getWeeklyAttendanceReport);
router.get("/attendance/monthly", [authJwt.isAdmin], controller.getMonthlyAttendanceReport);

module.exports = router;
