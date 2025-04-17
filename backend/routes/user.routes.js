// backend/routes/user.routes.js
const express = require("express");
const controller = require("../controllers/user.controller");
const { authJwt } = require("../middleware");

const router = express.Router();

// Apply middleware to all routes
router.use(authJwt.verifyToken);

// Routes accessible by any authenticated user
router.get("/departments", controller.getAllDepartments);
router.get("/managers", controller.getAllManagers);

// Routes that require specific roles
router.get("/", [authJwt.isAdmin], controller.getAllUsers);

router.get("/:id", [authJwt.isAdmin], controller.getUserById);

router.post("/", [authJwt.isAdmin], controller.createUser);

router.put("/:id", [authJwt.isAdmin], controller.updateUser);

router.delete("/:id", [authJwt.isAdmin], controller.deleteUser);

router.patch("/:id/status", [authJwt.isAdmin], controller.toggleUserStatus);

router.patch("/:id/manager", [authJwt.isAdmin], controller.assignManager);

router.get(
  "/by-department",
  [authJwt.isManager],
  controller.getUsersByDepartment
);

module.exports = router;
