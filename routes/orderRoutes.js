const express = require("express");
const userController = require("../controllers/userController");
const orderController = require("../controllers/orderController");

const router = express.Router();

router.post(
  "/createOrder/:id",
  userController.protect,
  orderController.createOrder
);

router.get(
  "/getAllOrders",
  userController.protect,
  userController.restrictTo("admin"),
  orderController.getAllOrders
);

router.post(
  "/updateOrderStatus/:id",
  userController.protect,
  userController.restrictTo("admin"),
  orderController.updateOrder
);

router.get(
  "/getOrdersByUser/:id",
  userController.protect,
  orderController.getOrdersByUser
);

module.exports = router;
