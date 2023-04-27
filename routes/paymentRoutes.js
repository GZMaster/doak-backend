const express = require("express");
const payment = require("../controllers/paymentController");
const userController = require("../controllers/userController");

// Create a new Express router
const router = express.Router();

// Routes
router
  .route("/transaction/:id")
  .post(userController.protect, payment.createTransaction)
  .get(userController.protect, payment.getTransactionsByUser)
  .patch(userController.protect, payment.verifyTransaction);

router.route("/payintent").post(userController.protect, payment.chargeCard);

router
  .route("/transaction")
  .get(
    userController.protect,
    userController.restrictTo("admin"),
    payment.getAllTransactions
  );

// Export the Express router
module.exports = router;
