const express = require("express");
const userController = require("../controllers/userController");
const deliveryController = require("../controllers/deliveryController");

const router = express.Router();

router
  .route("/")
  .get(userController.protect, deliveryController.getAllDeliveries)
  .post(
    userController.protect,
    userController.restrictTo("admin"),
    deliveryController.createDelivery
  )
  .patch(
    userController.protect,
    userController.restrictTo("admin"),
    deliveryController.updateDelivery
  )
  .delete(
    userController.protect,
    userController.restrictTo("admin"),
    deliveryController.deleteDelivery
  );

module.exports = router;
