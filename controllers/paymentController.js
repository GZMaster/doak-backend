const dotenv = require("dotenv");
const https = require("https");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const Transaction = require("../models/transactionModel");
// const Order = require("../models/orderModel");

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
        console.log(JSON.parse(data));
        res.json(JSON.parse(data)); // return the response from Paystack API to the client
      });
    })
    .on("error", (error) => {
      console.error(error);
      next(new AppError("Something went wrong", 400));
    });

  payReq.write(params);
  payReq.end();
});

exports.webhook = catchAsync(async (req, res, next) => {
  // Retrieve the request's body
  const event = req.body;

  console.log(event);

  // Do something with event
  switch (event.event) {
    case "charge.success":
      // The payment was successful, you can provision the value to your customer
      console.log(event);
      break;
    case "charge.failed":
      // The charge failed for some reason. If it was card declined, you can
      // use event.data.raw_message to display the message to your customer.
      console.log(event);
      break;
    default:
      break;
  }

  res.send(200);
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
