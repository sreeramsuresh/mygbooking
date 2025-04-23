// backend/routes/auth.routes.js
const express = require("express");
const { verifySignUp, authJwt } = require("../middleware");
const controller = require("../controllers/auth.controller");

const router = express.Router();

router.post(
  "/signup",
  [verifySignUp.checkDuplicateUsernameOrEmail, verifySignUp.checkRolesExisted],
  controller.signup
);

router.post("/signin", controller.signin);

router.post("/refreshtoken", controller.refreshToken);

router.post("/logout", [authJwt.verifyToken], controller.logout);

module.exports = router;
