const mongoose = require("mongoose");

const wineProductSchema = new mongoose.Schema({
  id: {
    type: String,
    required: [true, "A wine product must have an id"],
    unique: true,
  },
  name: {
    type: String,
    required: [true, "A wine product must have a name"],
    unique: true,
    trim: true,
    maxlength: [
      40,
      "A wine product name must have less or equal then 40 characters",
    ],
  },
  price: {
    type: Number,
    required: [true, "A wine product must have a price"],
  },
  summary: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  image: {
    type: String,
  },
  categories: [String],
  quantity: {
    type: Number,
    required: [true, "A wine product must have a quantity"],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  startDates: [Date],
});

const WineProduct = mongoose.model("WineProduct", wineProductSchema);

module.exports = WineProduct;
