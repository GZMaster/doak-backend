const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  address: {
    type: String,
    required: [true, "Please provide the address"],
  },
  city: {
    type: String,
    required: [true, "Please provide the city"],
  },
  phoneNumber: {
    type: String,
    required: [true, "Please provide the phone number"],
  },
  state: {
    type: String,
    required: [true, "Please provide the state"],
  },
  country: {
    type: String,
  },
  zipCode: {
    type: String,
  },
});

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
    contact: {
      address: addressSchema,
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

orderSchema.pre("save", function (next) {
  this.CalculateTotal();
  next();
});

module.exports = mongoose.model("Order", orderSchema);
