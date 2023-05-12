const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "order",
    },
    email: {
      type: String,
      required: [true, "email is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "amount is required"],
    },
    paymentStatus: {
      type: String,
      enum: ["successful", "pending", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
