const express = require("express");
const userController = require("../controllers/userController");

const router = express.Router();

router.post("/signup", userController.signup);

router.post("/login", userController.login);

router.get("/verifyEmail/:id", userController.verifyEmail);

router.get("/logout", userController.protect, userController.logout);

router.post("/forgotPassword", userController.forgotPassword);

router.patch(
  "/resetPassword/:token",
  userController.protect,
  userController.resetPassword
);

router.patch(
  "/updateMyPassword",
  userController.protect,
  userController.updatePassword
);

router.patch("/updateMe", userController.protect, userController.updateMe);

module.exports = router;
