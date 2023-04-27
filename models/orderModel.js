const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    orderId: {
      type: Number,
      trim: true,
    },
    orderStatus: {
      type: String,
      enum: ["pending", "delivered", "cancelled"],
      default: "pending",
    },
    address: {
      type: String,
      required: [true, "address is required"],
      trim: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "product",
        },
        quantity: {
          type: Number,
          required: [true, "quantity is required"],
        },
        price: {
          type: Number,
          required: [true, "price is required"],
        },
        name: {
          type: String,
          required: [true, "name is required"],
          trim: true,
        },
        status: {
          type: String,
          enum: ["pending", "delivered", "cancelled"],
          default: "pending",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Order", orderSchema);
