const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: [true, "Please provide the user id"],
  },
  name: {
    type: String,
    required: [true, "Please provide the name"],
  },
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
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Address", addressSchema);
