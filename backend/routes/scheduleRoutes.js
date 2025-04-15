// backend/routes/scheduleRoutes.js
const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/scheduleController");
const { verifyToken, checkRole } = require("../middleware/auth");
const { validateScheduleRequest } = require("../middleware/validation");

// All routes require authentication
router.use(verifyToken);

// Employee routes
router.get("/my-schedule", scheduleController.getUserSchedule);
router.get("/my-compliance", scheduleController.getUserCompliance);

// Manager/Admin routes
router.get(
  "/compliance-stats",
  checkRole(["manager", "admin"]),
  scheduleController.getComplianceStats
);
router.get(
  "/employee-compliance",
  checkRole(["manager", "admin"]),
  scheduleController.getEmployeeCompliance
);
router.put(
  "/user/:userId",
  checkRole(["manager", "admin"]),
  validateScheduleRequest,
  scheduleController.updateUserSchedule
);

module.exports = router;
