// backend/routes/request.routes.js
const express = require("express");
const controller = require("../controllers/request.controller");
const { authJwt } = require("../middleware");

const router = express.Router();

// Apply middleware to all routes
router.use(authJwt.verifyToken);
router.use(authJwt.isActiveUser);

// Employee routes
router.post("/regularization", controller.createRegularizationRequest);
router.post("/wfh", controller.createWFHRequest);
router.get("/my", controller.getMyRequests);

// Manager routes
router.get("/pending", [authJwt.isManager], controller.getPendingRequests);
router.post(
  "/:requestId/approve",
  [authJwt.isManager],
  controller.approveRequest
);
router.post(
  "/:requestId/reject",
  [authJwt.isManager],
  controller.rejectRequest
);

module.exports = router;
