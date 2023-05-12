const express = require("express");
const payment = require("../controllers/paymentController");
const userController = require("../controllers/userController");

// Create a new Express router
const router = express.Router();

// Routes
router
  .route("/initialize-payment")
  .post(userController.protect, payment.initializePayment);

router.route("/webhook").post(payment.webhook);

// router.route("/verify-payment").post(payment.verifyPayment);

router.route("/get-all-transactions").get(payment.getAllTransactions);

// Export the Express router
module.exports = router;
