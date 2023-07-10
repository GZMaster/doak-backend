const Delivery = require("../models/deliveryModel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.createDelivery = catchAsync(async (req, res, next) => {
  const { type, text, price } = req.body;

  const delivery = await Delivery.create({ type, text, price });

  if (!delivery) {
    return next(new AppError("No delivery found", 404));
  }

  res.status(201).json({
    status: "success",
    data: {
      delivery,
    },
  });
});

exports.getAllDeliveries = catchAsync(async (req, res, next) => {
  const deliveries = await Delivery.find();

  if (!deliveries) {
    return next(new AppError("No deliveries found", 404));
  }

  res.status(200).json({
    status: "success",
    results: deliveries.length,
    data: {
      deliveries,
    },
  });
});

exports.getDelivery = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const delivery = await Delivery.findById(id);

  if (!delivery) {
    return next(new AppError("No delivery found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      delivery,
    },
  });
});

exports.updateDelivery = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const delivery = await Delivery.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!delivery) {
    return next(new AppError("No delivery found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      delivery,
    },
  });
});

exports.deleteDelivery = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const delivery = await Delivery.findByIdAndDelete(id);

  if (!delivery) {
    return next(new AppError("No delivery found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
