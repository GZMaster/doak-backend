const dotenv = require("dotenv");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const Transaction = require("../models/transactionModel");
const Order = require("../models/orderModel");

dotenv.config({ path: "../config.env" });

// eslint-disable-next-line import/no-extraneous-dependencies, import/order, node/no-extraneous-require
const paystack = require("paystack")(process.env.PAYSTACK_SECRET_KEY);

exports.initializePayment = catchAsync(async (req, res, next) => {
  const { userId, orderId, email, amount } = req.body;

  // Create a new transaction
  const transaction = await Transaction.create({
    userId,
    orderId,
    email,
    amount,
  });

  if (!transaction) {
    return next(new AppError("Something went wrong", 400));
  }

  const initTransaction = await paystack.transaction.initialize({
    amount,
    email,
  });

  if (!initTransaction) {
    return next(new AppError("Something went wrong", 400));
  }

  // Return the authorization URL to the client
  res.send(transaction.data.authorization_url);
});

exports.verifyPayment = catchAsync(async (req, res, next) => {
  const { reference } = req.query;

  const verifyTransaction = await paystack.transaction.verify({ reference });

  if (!verifyTransaction) {
    return next(new AppError("Something went wrong", 400));
  }

  const transaction = await Transaction.findOneAndUpdate(
    { orderId: verifyTransaction.data.metadata.orderId },
    { paymentStatus: "successful" },
    { new: true }
  );

  if (!transaction) {
    return next(new AppError("Something went wrong", 400));
  }

  const order = await Order.findOneAndUpdate(
    { orderId: transaction.orderId },
    { orderStatus: "paid" },
    { new: true }
  );

  if (!order) {
    return next(new AppError("Something went wrong", 400));
  }

  res.send("Payment successful");
});

exports.getAllTransactions = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Transaction.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const transactions = await features.query;

  if (!transactions) {
    return next(new AppError("Something went wrong", 400));
  }

  res.status(200).json({
    status: "success",
    results: transactions.length,
    data: {
      transactions,
    },
  });
});
