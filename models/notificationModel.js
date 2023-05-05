const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: [true, "userId is required"],
  },
  header: {
    type: String,
    required: [true, "header is required"],
    trim: true,
  },
  body: {
    type: String,
    required: [true, "body is required"],
    trim: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  read: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("notification", notificationSchema);
