const express = require("express");
const payment = require("../controllers/paymentController");

// Create a new Express router
const router = express.Router();

// Routes
router.route("/").post(payment.createPaymentIntent);

// Export the Express router
module.exports = router;
