const mongoose = require("mongoose");
const catchAsync = require("../utils/catchAsync");

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
    required: [true, "Please provide the country"],
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

addressSchema.statics.changeDefault = catchAsync(async (userId, addressId) => {
  const session = await this.startSession();
  session.startTransaction();

  // Update the specified address as default
  const updatedAddress = await this.findOneAndUpdate(
    { userId, _id: addressId },
    { isDefault: true },
    { new: true, runValidators: true }
  ).session(session);

  // Turn all other addresses for the user to not default
  const updateAddress = await this.updateMany(
    { userId, _id: { $ne: addressId } },
    { isDefault: false }
  ).session(session);

  if (!updatedAddress || !updateAddress) {
    await session.abortTransaction();
    session.endSession();
    return false;
  }

  await session.commitTransaction();

  return this.findById(updatedAddress._id);
});

module.exports = mongoose.model("Address", addressSchema);
