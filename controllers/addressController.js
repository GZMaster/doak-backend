const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const Address = require("../models/addressModel");

exports.createAddress = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const {
    name,
    address,
    city,
    phoneNumber,
    state,
    country,
    zipCode,
    isDefault,
  } = req.body;

  const addressData = await Address.create({
    userId,
    name,
    address,
    city,
    phoneNumber,
    state,
    country,
    zipCode,
    isDefault,
  });

  if (!addressData) {
    return next(new AppError("Address not created", 400));
  }

  res.status(201).json({
    status: "success",
    data: {
      addressData,
    },
  });
});

exports.getAllAddresses = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Address.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const addresses = await features.query;

  if (!addresses) {
    return next(new AppError("No addresses found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      addresses,
    },
  });
});

exports.getAddressByUser = catchAsync(async (req, res, next) => {
  const { id } = req.user;

  const features = new APIFeatures(Address.find({ userId: id }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const addresses = await features.query;

  if (!addresses) {
    return next(new AppError("No addresses found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      addresses,
    },
  });
});

exports.getAddress = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const features = new APIFeatures(Address.find({ userId: id }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const addresses = await features.query;

  if (!addresses) {
    return next(new AppError("No addresses found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      addresses,
    },
  });
});

exports.updateAddress = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const {
    name,
    address,
    city,
    phoneNumber,
    state,
    country,
    zipCode,
    isDefault,
  } = req.body;

  const addressData = await Address.findOneAndUpdate(
    { _id: id, userId },
    {
      name,
      address,
      city,
      phoneNumber,
      state,
      country,
      zipCode,
      isDefault,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!addressData) {
    return next(new AppError("Address not updated", 400));
  }

  res.status(201).json({
    status: "success",
    data: {
      addressData,
    },
  });
});

exports.deleteAddress = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const addressData = await Address.findOneAndDelete({ _id: id, userId });

  if (!addressData) {
    return next(new AppError("Address not deleted", 400));
  }

  res.status(201).json({
    status: "success",
    data: {
      addressData,
    },
  });
});

exports.setDefaultAddress = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const updatedAddress = await Address.findOneAndUpdate(
    { userId, _id: id },
    { isDefault: true },
    { new: true, runValidators: true }
  );

  // Turn all other addresses for the user to not default
  await Address.updateMany({ userId, _id: { $ne: id } }, { isDefault: false });

  const addressData = await Address.findById(updatedAddress._id);

  if (!addressData) {
    return next(new AppError("Address not updated", 400));
  }

  res.status(201).json({
    status: "success",
    data: {
      addressData,
    },
  });
});

exports.getDefaultAddress = catchAsync(async (req, res, next) => {
  const { id } = req.user;

  const addressData = await Address.findOne({ userId: id, isDefault: true });

  if (!addressData) {
    return next(new AppError("No addresses found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      addressData,
    },
  });
});

exports.getAddressById = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const addressData = await Address.find({ _id: id, userId });

  if (!addressData) {
    return next(new AppError("No addresses found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      addressData,
    },
  });
});
