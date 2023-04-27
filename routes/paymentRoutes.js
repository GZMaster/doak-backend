const express = require("express");
const payment = require("../controllers/paymentController");

// Create a new Express router
const router = express.Router();

// Routes
router.route("/payintent").post(payment.chargeCard);

// Export the Express router
module.exports = router;
