const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: [true, "userId is required"],
    },
    orderId: {
      type: String,
      trim: true,
      required: [true, "orderId is required"],
    },
    orderStatus: {
      type: String,
      enum: ["pending", "paid", "delivered", "cancelled"],
      default: "pending",
    },
    addressId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "address",
      required: [true, "addressId is required"],
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
      },
    ],
    date: {
      type: Date,
      default: Date.now,
    },
    subtotal: {
      type: Number,
      required: [true, "subtotal is required"],
    },
    deliveryFee: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.methods.CalculateTotal = function () {
  this.total = this.subtotal + this.deliveryFee;
};

orderSchema.methods.GetOrderStatus = function () {
  return this.orderStatus;
};

orderSchema.methods.GetOrderItems = function () {
  return this.items;
};

orderSchema.methods.GetOrderSubtotal = function () {
  return this.subtotal;
};

orderSchema.methods.GetOrderDeliveryFee = function () {
  return this.deliveryFee;
};

orderSchema.methods.GetOrderTotal = function () {
  return this.total;
};

orderSchema.methods.GetOrderDate = function () {
  return this.date;
};

orderSchema.methods.GetOrderAddress = function () {
  return this.address;
};

orderSchema.pre("save", function (next) {
  this.CalculateTotal();
  next();
});

module.exports = mongoose.model("Order", orderSchema);
