const mongoose = require("mongoose");

const wineProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "A wine product must have a name"],
    unique: true,
    trim: true,
    maxlength: [
      40,
      "A wine product name must have less or equal then 40 characters",
    ],
    minlength: [
      10,
      "A wine product name must have more or equal then 10 characters",
    ],
  },
  price: {
    type: Number,
    required: [true, "A wine product must have a price"],
  },
  summary: {
    type: String,
    trim: true,
    required: [true, "A wine product must have a description"],
  },
  description: {
    type: String,
    trim: true,
  },
  imageCover: {
    type: String,
    required: [true, "A wine product must have a cover image"],
  },
  images: [String],
  createdAt: {
    type: Date,
    default: Date.now(),
    select: false,
  },
  startDates: [Date],
});

const WineProduct = mongoose.model("WineProduct", wineProductSchema);

module.exports = WineProduct;
