const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const Order = require("../models/orderModel");
const User = require("../models/userModel");

exports.createOrder = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { items, address, subtotal, deliveryFee = 0 } = req.body;
  const orderId = uuidv4();

  const order = await Order.create({
    userId,
    orderId,
    contact: {
      address,
    },
    items,
    subtotal,
    deliveryFee,
  });

  if (!order) {
    return next(new AppError("Order not created", 400));
  }

  // empty cart
  const userCart = await User.findOneAndUpdate({ userId }, { cart: [] });

  if (!userCart) {
    return next(new AppError("Cart not found", 404));
  }

  res.status(201).json({
    status: "success",
    data: {
      order,
    },
  });
});

exports.getAllOrders = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Order.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const orders = await features.query;

  if (!orders) {
    return next(new AppError("No orders found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      orders,
    },
  });
});

exports.getOrderAddress = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const orders = await Order.find({ userId: id });

  res.status(200).json({
    status: "success",
    data: {
      orders,
    },
  });
});

exports.getOrdersByUser = catchAsync(async (req, res, next) => {
  const { id } = req.user;

  const features = new APIFeatures(Order.find({ userId: id }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const orders = await features.query;

  if (!orders) {
    return next(new AppError("No orders found", 404));
  }

  res.status(200).json({
    status: "success",
    results: orders.length,
    data: {
      orders,
    },
  });
});

exports.updateOrder = catchAsync(async (req, res, next) => {
  const { orderId, userId, status } = req.body;

  const order = await Order.findOneAndUpdate(
    { orderId, userId },
    {
      status,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

exports.cancelOrder = catchAsync(async (req, res, next) => {
  const orderId = req.params.id;
  const userId = req.user.id;

  const order = await Order.findOneAndUpdate(
    { orderId, userId },
    {
      status: "cancelled",
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});
