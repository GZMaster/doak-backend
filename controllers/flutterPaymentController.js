/* eslint-disable camelcase */
const dotenv = require("dotenv");
const Flutterwave = require("flutterwave-node-v3");
// const { v4: uuidv4 } = require("uuid");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const Transaction = require("../models/transactionModel");
const Order = require("../models/orderModel");

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

  const {
    card_number,
    cvv,
    expiry_month,
    expiry_year,
    amount,
    fullname,
    email,
    phone_number,
    pin,
    city,
    address,
    state,
    country,
    zip_code,
    orderId,
  } = req.body;

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

  const payload = {
    card_number,
    cvv,
    expiry_month,
    expiry_year,
    currency: "NGN",
    amount: amount.toString(),
    redirect_url: "https://www.drinksofallkind.com",
    fullname,
    email,
    phone_number,
    enckey: process.env.FLW_ENCRYPTION_KEY,
    tx_ref: transaction._id.toString(),
  };

  const response = await flw.Charge.card(payload);

  if (response.status === "error") {
    return next(new AppError(response.message, 400));
  }

  switch (response.meta.authorization.mode) {
    case "pin":
      req.body = {
        ...payload,
        authorization: {
          mode: response.meta.authorization.mode,
          pin,
        },
      };

      break;
    case "avs_noauth": {
      // Store the current payload
      req.session = { charge_payload: payload };
      // Now we'll show the user a form to enter
      // the requested fields (PIN or billing details)
      req.session = {
        auth_fields: { city, address, state, country, zip_code },
      };
      req.session = { auth_mode: response.meta.authorization.mode };
      break;
    }
    case "redirect": {
      // Store the transaction ID
      // so we can look it up later with the flw_ref
      await Transaction.findByIdAndUpdate(transaction._id, {
        transactionId: response.data.id,
      });
      // Auth type is redirect,
      // so just redirect to the customer's bank
      const authUrl = response.meta.authorization.redirect;

      return res.status(200).json({
        status: "redirect",
        message: "Payment pending",
        authUrl,
      });
    }
    default: {
      // No authorization needed; just verify the payment
      const transactionId = response.data.id;
      const verifyPayment = await flw.Transaction.verify({
        id: transactionId,
      });

      if (verifyPayment.data.status === "successful") {
        // Update the transaction
        transaction.paymentStatus = "successful";
        await transaction.save();

        // Update the order
        const order = await Order.findOne({ _id: transaction.orderId });
        order.orderStatus = "paid";
        await order.save();

        return res.status(200).json({
          status: "success",
          message: "Payment successful",
        });
      }

      if (verifyPayment.data.status === "pending") {
        // Update the transaction
        transaction.paymentStatus = "pending";
        await transaction.save();

        // Schedule a job that polls for the status of the payment every 10 minutes
        transactionVerificationQueue.add({
          id: transactionId,
        });

        return res.status(200).json({
          status: "pending",
          message: "Payment pending",
        });
      }

      return res.status(400).json({
        status: "error",
        message: "Payment failed",
      });
    }
  }

  next();
});

// The route where we send the user's auth details (Step 4)
exports.authorize = catchAsync(async (req, res, next) => {
  const payload = req.body;

  const transaction = await Transaction.findOne({ tx_ref: payload.tx_ref });

  const response = await flw.Charge.card(payload);

  switch (response.meta.authorization.mode) {
    case "otp": {
      // Show the user a form to enter the OTP
      const { flw_ref } = response.data;

      return res.status(200).json({
        status: "otp",
        message: "Enter OTP",
        data: { tx_ref: payload.tx_ref, flw_ref },
      });
    }
    case "redirect": {
      const authUrl = response.meta.authorization.redirect;

      return res.status(200).json({
        status: "redirect",
        message: "Redirecting to bank",
        authUrl,
      });
    }
    default: {
      // No validation needed; just verify the payment
      const transactionId = response.data.id;
      const verifyTransaction = await flw.Transaction.verify({
        id: transactionId,
      });

      if (verifyTransaction.data.status === "successful") {
        // Update the transaction
        transaction.paymentStatus = "successful";
        await transaction.save({ validateBeforeSave: false });

        // Update the order
        const order = await Order.findOne({ _id: transaction.orderId });
        order.orderStatus = "paid";
        await order.save({ validateBeforeSave: false });

        return res.status(200).json({
          status: "success",
          message: "Payment successful",
        });
      }

      if (verifyTransaction.data.status === "pending") {
        // Update the transaction
        transaction.paymentStatus = "pending";
        await transaction.save({ validateBeforeSave: false });

        // Schedule a job that polls for the status of the payment every 10 minutes
        transactionVerificationQueue.add({
          id: transactionId,
        });

        return res.status(200).json({
          status: "success",
          message: "Payment pending",
        });
      }

      return res.status(400).json({
        status: "error",
        message: "Payment failed",
      });
    }
  }
});

// The route where we validate and verify the payment (Steps 5 - 6)
exports.validate = catchAsync(async (req, res, next) => {
  const transaction = await Transaction.findById({ _id: req.body.tx_ref });

  if (!transaction) {
    return next(new AppError("Invalid transaction reference", 400));
  }

  const response = await flw.Charge.validate({
    otp: req.body.otp,
    flw_ref: req.body.flw_ref,
  });

  if (
    response.data.status === "successful" ||
    response.data.status === "pending"
  ) {
    // Verify the payment
    const transactionId = response.data.id.toString();
    const verifyTransaction = await flw.Transaction.verify({
      id: transactionId,
    });

    if (verifyTransaction.data.status === "successful") {
      // Update the transaction
      transaction.paymentStatus = "successful";
      await transaction.save();

      // Update the order
      const order = await Order.findById({ _id: transaction.orderId });
      order.orderStatus = "paid";
      await order.save();

      return res.status(200).json({
        status: "success",
        message: "Payment successful",
      });
    }

    if (verifyTransaction.data.status === "pending") {
      // Update the transaction
      transaction.paymentStatus = "pending";
      await transaction.save();

      // Schedule a job that polls for the status of the payment every 10 minutes
      transactionVerificationQueue.add({
        id: transactionId,
      });

      return res.status(200).json({
        status: "pending",
        message: "Payment pending",
      });
    }
  }
});

// Our redirect_url. For 3DS payments, Flutterwave will redirect here after authorization,
// and we can verify the payment (Step 6)
exports.redirect = catchAsync(async (req, res) => {
  if (req.query.status === "successful" || req.query.status === "pending") {
    // Verify the payment
    const txRef = req.query.tx_ref;
    const transaction = await Transaction.findOne({ tx_ref: txRef });

    if (!transaction) {
      return res.status(404).json({
        status: "error",
        message: "Transaction not found",
      });
    }

    const verifyTransaction = flw.Transaction.verify({
      id: transaction.transactionId,
    });

    if (verifyTransaction.data.status === "successful") {
      // Update the transaction
      transaction.paymentStatus = "successful";
      await transaction.save();

      // Update the order
      const order = await Order.findOne({ _id: transaction.orderId });
      order.orderStatus = "paid";
      await order.save();

      return res.status(200).json({
        status: "success",
        message: "Payment successful",
      });
    }

    if (verifyTransaction.data.status === "pending") {
      // Update the transaction
      transaction.paymentStatus = "pending";
      await transaction.save();

      // Schedule a job that polls for the status of the payment every 10 minutes
      transactionVerificationQueue.add({
        id: transaction.transactionId,
      });

      return res.status(200).json({
        status: "success",
        message: "Payment pending",
      });
    }
  }

  return res.status(400).json({
    status: "error",
    message: "Payment failed",
  });
});

// The route where we poll for the status of the payment (Step 7)
exports.verify = catchAsync(async (req, res, next) => {
  const transaction = await Transaction.findOne({ tx_ref: req.body.tx_ref });

  const verifyTransaction = flw.Transaction.verify({
    id: transaction.transactionId,
  });

  if (verifyTransaction.data.status === "successful") {
    // Update the transaction
    transaction.paymentStatus = "successful";
    await transaction.save();

    // Update the order
    const order = await Order.findOne({ _id: transaction.orderId });
    order.orderStatus = "paid";
    await order.save();

    return res.status(200).json({
      status: "success",
      message: "Payment successful",
    });
  }

  if (verifyTransaction.data.status === "pending") {
    // Update the transaction
    transaction.paymentStatus = "pending";
    await transaction.save();

    // Schedule a job that polls for the status of the payment every 10 minutes
    transactionVerificationQueue.add({
      id: transaction.transactionId,
    });

    return res.status(200).json({
      status: "success",
      message: "Payment pending",
    });
  }

  return res.status(400).json({
    status: "error",
    message: "Payment failed",
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
