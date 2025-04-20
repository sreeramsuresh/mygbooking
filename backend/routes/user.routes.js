// backend/routes/user.routes.js
const express = require("express");
const controller = require("../controllers/user.controller");
const { authJwt, verifySignUp } = require("../middleware");

const router = express.Router();

// Apply middleware to all routes
router.use(authJwt.verifyToken);

// Public routes (for authenticated users)
router.get("/profile", controller.getProfile);
router.put("/profile", controller.updateProfile);

// Admin routes
router.get("/", [authJwt.isAdmin], controller.getAllUsers);

router.post(
  "/",
  [
    authJwt.isAdmin,
    verifySignUp.checkDuplicateUsernameOrEmail,
    verifySignUp.checkRolesExisted,
  ],
  controller.createUser
);

router.get("/:userId", [authJwt.isAdmin], controller.getUserById);

router.put("/:userId", [authJwt.isAdmin], controller.updateUser);

router.delete("/:userId", [authJwt.isAdmin], controller.deleteUser);

router.patch("/:userId/status", [authJwt.isAdmin], controller.toggleUserStatus);

router.patch("/:userId/manager", [authJwt.isAdmin], controller.assignManager);

router.get("/role/:role", [authJwt.isAdmin], controller.getUsersByRole);

// Update auto-booking preferences for all users
router.post("/update-preferences", [authJwt.isAdmin], controller.updateAllUserPreferences);

module.exports = router;
