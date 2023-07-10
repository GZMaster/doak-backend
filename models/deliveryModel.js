const mongoose = require("mongoose");

const deliverySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["delivery", "pickup"],
    default: "pickup",
  },
  text: {
    type: String,
    trim: true,
    required: [true, "text is required"],
  },
  price: {
    type: Number,
    required: [true, "price is required"],
  },
});

module.exports = mongoose.model("delivery", deliverySchema);
