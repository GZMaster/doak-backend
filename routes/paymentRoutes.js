const express = require("express");
const paymentController = require("../controllers/paymentController");
// const flutterPayment = require("../controllers/flutterPaymentController");
const userController = require("../controllers/userController");

// Create a new Express router
const router = express.Router();

router
  .route("/pay")
  .post(userController.protect, paymentController.initializeTransaction);

// router.route("/validate").post(userController.protect, payment.validate);

// router.route("/redirect").get(payment.redirect);

router.route("/verify").post(userController.protect, paymentController.verify);

router.route("/webhook").post(paymentController.webhook);

router.route("/").get(paymentController.getAllTransactions);

// Export the Express router
module.exports = router;
