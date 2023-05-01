const express = require("express");
const userController = require("../controllers/userController");
const orderController = require("../controllers/orderController");

const router = express.Router();

router.post(
  "/createOrder",
  userController.protect,
  orderController.createOrder
);

router.get(
  "/getAllOrders",
  userController.protect,
  userController.restrictTo("admin"),
  orderController.getAllOrders
);

router.get(
  "/getOrdersByUser/",
  userController.protect,
  orderController.getOrdersByUser
);

router.post(
  "/updateOrderStatus/:id",
  userController.protect,
  userController.restrictTo("admin"),
  orderController.updateOrder
);

module.exports = router;
