const express = require("express");
const userController = require("../controllers/userController");
const orderController = require("../controllers/orderController");

const router = express.Router();

router
  .route("/")
  .get(userController.protect, orderController.getOrdersByUser)
  .post(userController.protect, orderController.createOrder);

router.get(
  "/getAllOrders",
  userController.protect,
  userController.restrictTo("admin"),
  orderController.getAllOrders
);

router.get("/getOrderAddress/:id", orderController.getOrderAddress);

router.get(
  "/cancelOrder/:id",
  userController.protect,
  orderController.cancelOrder
);

router.post(
  "/updateOrderStatus/:id",
  userController.protect,
  userController.restrictTo("admin"),
  orderController.updateOrder
);

module.exports = router;
