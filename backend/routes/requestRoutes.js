// backend/routes/requestRoutes.js
const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");
const { verifyToken, checkRole } = require("../middleware/auth");
const {
  validateWFHRequest,
  validateStatusUpdate,
} = require("../middleware/validation");

// All routes require authentication
router.use(verifyToken);

// Employee routes
router.post("/", validateWFHRequest, requestController.createRequest);
router.get("/my-requests", requestController.getUserRequests);

// Manager/Admin routes
router.get(
  "/pending",
  checkRole(["manager", "admin"]),
  requestController.getPendingRequests
);
router.put(
  "/:id/status",
  checkRole(["manager", "admin"]),
  validateStatusUpdate,
  requestController.updateRequestStatus
);

module.exports = router;
