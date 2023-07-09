const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

router.post("/signup", userController.signup);

router.post("/login", userController.adminLogin);

router.post(
  "/verifyEmail/:id",
  userController.restrictTo("admin"),
  userController.verifyEmail
);

router.get(
  "/logout",
  userController.protect,
  userController.restrictTo("admin"),
  userController.logout
);

router.post(
  "/forgotPassword",
  userController.restrictTo("admin"),
  userController.forgotPassword
);

router.post(
  "/resetPassword/:token",
  userController.restrictTo("admin"),
  userController.resetPassword
);

router.patch(
  "/updateMyPassword",
  userController.protect,
  userController.restrictTo("admin"),
  userController.updatePassword
);

router.patch(
  "/updateMe",
  userController.protect,
  userController.restrictTo("admin"),
  userController.updateMe
);

module.exports = router;
