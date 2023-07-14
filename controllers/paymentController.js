const dotenv = require("dotenv");
// eslint-disable-next-line import/no-extraneous-dependencies
const axios = require("axios");
const Flutterwave = require("flutterwave-node-v3");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Transaction = require("../models/transactionModel");
const Order = require("../models/orderModel");

dotenv.config({ path: "../config.env" });

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

const transactionVerificationQueue = catchAsync(async (transactionId) => {
  const transaction = await Transaction.findOne({ transactionId });
  const order = await Order.findOne({ _id: transaction.orderId });

  if (!transaction) {
    return new AppError("Something went wrong", 400);
  }

  const verifyPayment = await flw.Transaction.verify({
    id: transactionId,
  });

  if (verifyPayment.data.status === "successful") {
    // Update the transaction
    transaction.paymentStatus = "successful";
    await transaction.save();

    // Update the order
    order.orderStatus = "paid";
    await order.save();
  }

  if (verifyPayment.data.status === "pending") {
    // Update the transaction
    transaction.paymentStatus = "pending";
    await transaction.save();

    // Schedule a job that polls for the status of the payment every 10 minutes
    transactionVerificationQueue.add({
      id: transactionId,
    });
  }
});

exports.initializeTransaction = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const { orderId, email, amount, name, phonenumber } = req.body;

  const order = await Order.findById(orderId);

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

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

  const headers = {
    Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
  };

  const data = {
    tx_ref: transaction._id.toString(),
    amount: transaction.amount,
    currency: "NGN",
    redirect_url: "https://drinksofallkind.com",
    meta: {
      consumer_id: userId,
    },
    customer: {
      email,
      phonenumber,
      name,
    },
    customizations: {
      title: "Drinks of all kind",
      logo: "https://admin.drinksofallkind.com/images/logo.svg",
    },
  };

  const results = await axios
    .post("https://api.flutterwave.com/v3/payments", data, { headers })
    .then((response) => {
      if (response.status === "error") {
        return next(new AppError(response.message, 400));
      }

      return response.data;
    })
    .catch((error) => {
      next(new AppError(error.message, 400));
    });

  res.status(200).json({
    status: "redirect",
    message: results.message,
    redirectUrl: results.data.link,
  });
});

exports.verify = catchAsync(async (req, res, next) => {
  const { transactionId } = req.body;

  const transaction = await Transaction.findById(transactionId);

  if (!transaction) {
    return next(new AppError("Transaction not found", 404));
  }

  const order = await Order.findById(transaction.orderId);

  const response = await flw.Transaction.verify({ id: transactionId });

  if (
    response.status === "successful" &&
    response.data.amount === transaction.amount &&
    response.data.currency === "NGN"
  ) {
    transaction.paymentStatus = "successful";
    await transaction.save();

    order.orderStatus = "paid";
    await order.save();
  } else if (response.status === "pending") {
    transaction.paymentStatus = "pending";
    await transaction.save();

    order.orderStatus = "pending";
    await order.save();
  } else if (response.status === "failed") {
    transaction.paymentStatus = "failed";
    await transaction.save();

    order.orderStatus = "cancelled";
    await order.save();
  }

  res.status(200).json({
    status: response.status,
    message: response.message,
  });
});

exports.webhook = catchAsync(async (req, res, next) => {
  const secreatHash = req.headers["verif-hash"];

  if (!secreatHash) {
    return next(new AppError("Invalid request", 400));
  }

  if (secreatHash !== process.env.FLW_WEBHOOK_HASH) {
    return next(new AppError("Invalid request", 400));
  }

  const { event, data } = req.body;

  if (event === "charge.completed") {
    const transaction = await Transaction.findOne({ tx_ref: data.tx_ref });

    if (!transaction) {
      return next(new AppError("Transaction not found", 404));
    }

    switch (data.status) {
      case "successful": {
        // Update the transaction
        transaction.paymentStatus = "successful";
        await transaction.save();

        // Update the order
        const order = await Order.findOne({ _id: transaction.orderId });
        order.orderStatus = "paid";
        await order.save();

        res.sendStatus(200);
        break;
      }
      case "pending": {
        transaction.paymentStatus = "pending";
        await transaction.save();

        // Schedule a job that polls for the status of the payment every 10 minutes
        transactionVerificationQueue.add({
          id: transaction.transactionId,
        });

        res.sendStatus(200);
        break;
      }
      case "failed":
        transaction.paymentStatus = "failed";
        await transaction.save();

        res.sendStatus(200);
        break;
      default:
        res.sendStatus(400);
        break;
    }
  }
});

exports.getAllTransactions = catchAsync(async (req, res, next) => {
  // const features = new APIFeatures(Transaction.find(), req.query)
  //   .filter()
  //   .sort()
  //   .limitFields()
  //   .paginate();

  // const transactions = await features.query;

  const transactions = await Transaction.find().populate("orderId").exec();

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
