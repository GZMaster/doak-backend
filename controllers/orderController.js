const { v4: uuidv4 } = require("uuid");
const dotenv = require("dotenv");
const nodemailer = require("nodemailer");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const Order = require("../models/orderModel");
const User = require("../models/userModel");
const WineProduct = require("../models/wineProductModel");

dotenv.config({ path: "./config.env" });

const sendEmailOrderDelivered = catchAsync(
  async (
    email,
    customerName,
    orderId,
    orderDate,
    orderTotal,
    deliveryAddress
  ) => {
    const transporter = nodemailer.createTransport({
      host: `${process.env.EMAIL_HOST}`,
      port: `${process.env.EMAIL_PORT}`,
      secure: true,
      auth: {
        user: `${process.env.EMAIL_USERNAME}`,
        pass: `${process.env.EMAIL_PASSWORD}`,
      },
    });

    const info = await transporter
      .sendMail({
        from: `${process.env.EMAIL_USERNAME}`,
        to: email,
        subject: "",
        html: `
              <h1>Order Delivered</h1>
              <p>Dear ${customerName},</p>
              <p>We are pleased to inform you that your order has been delivered to the following address:</p>
              <p>${deliveryAddress}</p>
              <p>Order Details:</p>
              <ul>
                <li>Order ID: ${orderId}</li>
                <li>Order Date: ${orderDate}</li>
                <li>Order Total: ${orderTotal}</li>
              </ul>
              <p>Thank you for shopping with us!</p>
      `,
      })
      .then((message) => message)
      .catch(() => false);

    if (info !== false) {
      return true;
    }

    return false;
  }
);

const sendEmailOrderPaid = catchAsync(
  async (
    email,
    customerName,
    orderId,
    orderDate,
    orderTotal,
    deliveryAddress
  ) => {
    const transporter = nodemailer.createTransport({
      host: `${process.env.EMAIL_HOST}`,
      port: `${process.env.EMAIL_PORT}`,
      secure: true,
      auth: {
        user: `${process.env.EMAIL_USERNAME}`,
        pass: `${process.env.EMAIL_PASSWORD}`,
      },
    });

    const info = await transporter
      .sendMail({
        from: `${process.env.EMAIL_USERNAME}`,
        to: email,
        subject: "",
        html: `
      <h1>Order Confirmation</h1>
      <p>Dear ${customerName},</p>
      <p>We are pleased to inform you that your order has been successfully paid and is being processed for delivery.</p>
      <p>Order Details:</p>
      <ul>
        <li>Order ID: ${orderId}</li>
        <li>Order Date: ${orderDate}</li>
        <li>Order Total: ${orderTotal}</li>
        <li>Delivery Address: ${deliveryAddress}</li>
      </ul>
      <p>Thank you for shopping with us!</p>
      `,
      })
      .then((message) => message)
      .catch(() => false);

    if (info !== false) {
      return true;
    }

    return false;
  }
);

exports.subtractItemsFromWine = catchAsync(async (items) => {
  const wineIds = items.map((item) => item.productId);
  const wines = await WineProduct.find({ _id: { $in: wineIds } });

  wines.forEach(async (wine) => {
    const wineItem = items.find(
      (item) => item.productId === wine._id.toString()
    );
    wine.quantity -= wineItem.quantity;
    await wine.save();
  });
});

exports.validateItems = catchAsync(async (items) => {
  const wineIds = items.map((item) => item.productId);
  const wines = await WineProduct.find({ _id: { $in: wineIds } });

  const invalidItems = wines.filter((wine) => {
    const wineItem = items.find(
      (item) => item.productId === wine._id.toString()
    );
    return wineItem.quantity > wine.quantity;
  });

  if (invalidItems.length > 0) {
    return false;
  }

  // Check if the price of the items in the cart is the same as the price of the items in the database
  const invalidPrice = wines.filter((wine) => {
    const wineItem = items.find(
      (item) => item.productId === wine._id.toString()
    );
    return wineItem.price !== wine.price;
  });

  if (invalidPrice > 0) {
    return false;
  }

  return true;
});

exports.createOrder = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { items, address, subtotal, deliveryFee, deliveryMethod } = req.body;
  const orderId = uuidv4();

  // validate items
  const validateItems = await this.validateItems(items);

  if (!validateItems) {
    return next(new AppError("Invalid items", 400));
  }

  // subtract items from wine
  const subtractQuantity = await this.subtractItemsFromWine(items);

  if (subtractQuantity) {
    return next(new AppError("Quantity not subtracted", 400));
  }

  const order = await Order.create({
    userId,
    orderId,
    contact: {
      address,
    },
    items,
    subtotal,
    deliveryFee,
    deliveryMethod,
  });

  if (!order) {
    return next(new AppError("Order not created", 400));
  }

  // empty cart
  const user = await User.findById(userId);

  if (!user) {
    return next(new AppError("User not found", 404));
  }

  user.cart = {};

  const savedChange = await user.save({ validateBeforeSave: false });

  if (!savedChange) {
    return next(new AppError("Cart not emptied", 400));
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
  const { orderId, userId, orderStatus } = req.body;

  const order = await Order.findOneAndUpdate(
    { orderId, userId },
    {
      orderStatus,
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

exports.sendStatusMail = catchAsync(async (req, res, next) => {
  await sendEmailOrderDelivered();
  await sendEmailOrderPaid();

  next();
});
