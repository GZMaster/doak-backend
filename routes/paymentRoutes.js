const express = require("express");
// const payment = require("../controllers/paymentController");
const flutterPayment = require("../controllers/flutterPaymentController");
const userController = require("../controllers/userController");

// Create a new Express router
const router = express.Router();

router
  .route("/pay")
  .post(
    userController.protect,
    flutterPayment.initializeTransaction,
    flutterPayment.authorize
  );

router.route("/validate").post(userController.protect, flutterPayment.validate);

router.route("/redirect").get(flutterPayment.redirect);

router.route("/verify").post(userController.protect, flutterPayment.verify);

router.route("/").get(flutterPayment.getAllTransactions);

// Export the Express router
module.exports = router;
