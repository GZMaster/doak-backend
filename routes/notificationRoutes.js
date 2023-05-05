const express = require("express");
const userController = require("../controllers/userController");
const notificationController = require("../controllers/notificationController");

const router = express.Router();

router
  .route("/")
  .post(notificationController.createNotification)
  .get(notificationController.getAllNotifications);

router
  .route("/user")
  .get(userController.protect, notificationController.getNotificationsByUser)
  .get(userController.protect, notificationController.readNotification)
  .delete(userController.protect, notificationController.deleteNotification);

router.route("/:id").get(notificationController.getNotification);

module.exports = router;
