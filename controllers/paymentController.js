const dotenv = require("dotenv");
const https = require("https");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
// const APIFeatures = require("../utils/apiFeatures");
const Transaction = require("../models/transactionModel");
const Order = require("../models/orderModel");

dotenv.config({ path: "../config.env" });

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

  const params = JSON.stringify({
    email,
    amount: `${amount}00`,
    reference: `${transaction._id}`,
  });

  const options = {
    hostname: "api.paystack.co",
    port: 443,
    path: "/transaction/initialize",
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_TESTKEY}`,
      "Content-Type": "application/json",
    },
  };

  const payReq = https
    .request(options, (payRes) => {
      let data = "";

      payRes.on("data", (chunk) => {
        data += chunk;
      });

      payRes.on("end", () => {
        res.json(JSON.parse(data)); // return the response from Paystack API to the client
      });
    })
    .on("error", (error) => {
      next(new AppError(`Something went wrong error: ${error}`, 400));
    });

  payReq.write(params);
  payReq.end();
});

exports.webhook = catchAsync(async (req, res, next) => {
  // Retrieve the request's body
  const { event, data } = req;

  const transaction = await Transaction.findById(data.reference);

  if (!transaction) {
    return next(new AppError("Something went wrong", 400));
  }

  const order = await Order.findById(transaction.orderId);

  if (!order) {
    return next(new AppError("Something went wrong", 400));
  }

  // Do something with event
  switch (event) {
    case "charge.success":
      // The payment was successful, change transaction status to success
      transaction.paymentStatus = "success";
      order.orderStatus = "paid";

      // Save the transaction
      await transaction.save();
      await order.save();

      res.sendStatus(200);
      break;
    case "charge.failed":
      // The charge failed for some reason. If it was card declined, you can
      // use event.data.raw_message to display the message to your customer.
      transaction.paymentStatus = "failed";
      order.orderStatus = "cancelled";

      // Save the transaction
      await transaction.save();
      await order.save();

      res.sendStatus(200);
      break;
    default:
      break;
  }

  res.sendStatus(200);
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
