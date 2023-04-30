/* eslint-disable camelcase */
const dotenv = require("dotenv");
const Flutterwave = require("flutterwave-node-v3");
const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const Transaction = require("../models/transactionModel");

dotenv.config({ path: "../config.env" });

const flw = new Flutterwave(
  process.env.FLW_PUBLIC_KEY,
  process.env.FLW_SECRET_KEY
);

// const payload = {
//   card_number: "4242424242424242",
//   cvv: "202",
//   expiry_month: "04",
//   expiry_year: "25",
//   currency: "NGN",
//   amount: "100",
//   redirect_url: "https://www.google.com",
//   fullname: "Flutterwave Developers",
//   email: "developers@flutterwavego.com",
//   phone_number: "08052026709",
//   enckey: process.env.FLW_ENCRYPTION_KEY,
//   tx_ref: "example01",
// };

exports.createTransaction = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, email, phone, amount, currency } = req.body;

  const transactionId = uuidv4();

  const transaction = await Transaction.create({
    userId: id,
    transactionId,
    name,
    email,
    phone,
    amount,
    currency,
    paymentGateway: "flutterwave",
  });

  if (!transaction) {
    return next(new AppError("Something went wrong", 400));
  }

  res.status(201).json({
    status: "success",
    data: {
      transaction,
    },
  });
});

exports.chargeCard = catchAsync(async (req, res, next) => {
  const {
    card_number,
    cvv,
    expiry_month,
    expiry_year,
    currency,
    amount,
    redirect_url,
    fullname,
    email,
    phone_number,
    tx_ref,
  } = req.body;

  const payload = {
    card_number,
    cvv,
    expiry_month,
    expiry_year,
    currency,
    amount: amount.toString(),
    redirect_url,
    fullname,
    email,
    phone_number,
    enckey: process.env.FLW_ENCRYPTION_KEY,
    tx_ref,
  };

  const response = await flw.Charge.card(payload);

  if (response.status === "error") {
    return next(new AppError(response.message, 400));
  }

  // const transaction = await Transaction.findOneAndUpdate(
  //   { transactionId: tx_ref },
  //   { flwRef: response.data.flw_ref, paymentStatus: "pending" },
  //   { new: true }
  // );

  // if (!transaction) {
  //   return next(new AppError("Something went wrong", 400));
  // }

  res.status(200).json({
    status: "success",
    data: {
      response,
    },
  });

  // if (response.meta.authorization.mode === "pin") {
  //   const payload2 = payload;
  //   payload2.authorization = {
  //     mode: "pin",
  //     fields: ["pin"],
  //     pin: 3310,
  //   };
  //   const reCallCharge = await flw.Charge.card(payload2);

  //   // Add the OTP to authorize the transaction
  //   const callValidate = await flw.Charge.validate({
  //     otp: "12345",
  //     flw_ref: reCallCharge.data.flw_ref,
  //   });

  //   console.log(callValidate);
  // }
  //   // For 3DS or VBV transactions, redirect users to their issue to authorize the transaction
  //   if (response.meta.authorization.mode === "redirect") {
  //     const url = response.meta.authorization.redirect;
  //     // open(url);
  //   }

  // console.log(response);
});

exports.getTransaction = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const transaction = await Transaction.findById(id);

  if (!transaction) {
    return next(new AppError("No transaction found with that ID", 404));
  }

  if (transaction.paymentStatus === "pending") {
    return next(new AppError("Transaction is still pending", 400));
  }

  if (transaction.paymentStatus === "failed") {
    return next(new AppError("Transaction failed", 400));
  }

  res.status(200).json({
    status: "success",
    data: {
      transaction,
    },
  });
});

exports.verifyTransaction = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const transaction = await Transaction.findById(id);

  if (!transaction) {
    return next(new AppError("No transaction found with that ID", 404));
  }

  const response = await flw.Transaction.verify(transaction.flwRef);

  if (response.status === "error") {
    return next(new AppError(response.message, 400));
  }

  if (response.data.status === "successful") {
    transaction.paymentStatus = "successful";
    transaction.save();
  }

  res.status(200).json({
    status: "success",
    data: {
      transaction,
    },
  });
});

exports.getAllTransactions = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Transaction.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const transactions = await features.query;

  if (!transactions) {
    return next(new AppError("No transactions found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      transactions,
    },
  });
});

exports.getTransactionsByUser = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const features = new APIFeatures(Transaction.find({ userId: id }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const transactions = await features.query;

  if (!transactions) {
    return next(new AppError("No transactions found", 404));
  }

  res.status(200).json({
    status: "success",
    results: transactions.length,
    data: {
      transactions,
    },
  });
});
