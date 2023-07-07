const express = require("express");
const userController = require("../controllers/userController");
const orderController = require("../controllers/orderController");

const router = express.Router();

router
  .route("/getAllOrders/:id")
  .get(userController.protect, orderController.getOrderAddress);

router
  .route("/")
  .get(userController.protect, orderController.getOrdersByUser)
  .post(userController.protect, orderController.createOrder);

router
  .route("/getAllOrders")
  .get(
    userController.protect,
    userController.restrictTo("admin"),
    orderController.getAllOrders
  );

router
  .route("/cancelOrder/:id")
  .get(userController.protect, orderController.cancelOrder);

router
  .route("/updateOrderStatus/:id")
  .patch(
    userController.protect,
    userController.restrictTo("admin"),
    orderController.updateOrder
  );

module.exports = router;
