const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const APIFeatures = require("../utils/apiFeatures");
const Notification = require("../models/notificationModel");

exports.createNotification = catchAsync(async (req, res, next) => {
  const { userId, header, body } = req.body;

  const notification = await Notification.create({
    userId,
    header,
    body,
  });

  if (!notification) {
    return next(new AppError("Notification not created", 400));
  }

  res.status(201).json({
    status: "success",
    data: {
      notification,
    },
  });
});

exports.getAllNotifications = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Notification.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const notifications = await features.query;

  if (!notifications) {
    return next(new AppError("No notifications found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      notifications,
    },
  });
});

exports.getNotificationsByUser = catchAsync(async (req, res, next) => {
  const { id } = req.user;

  const features = new APIFeatures(Notification.find({ userId: id }), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const notifications = await features.query;

  if (!notifications) {
    return next(new AppError("No notifications found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      notifications,
    },
  });
});

exports.getNotification = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const notification = await Notification.findById(id);

  if (!notification) {
    return next(new AppError("Notification not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      notification,
    },
  });
});

exports.readNotification = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const notification = await Notification.findOneAndUpdate(
    { _id: id, userId },
    { read: true },
    { new: true }
  );

  if (!notification) {
    return next(new AppError("Notification not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      notification,
    },
  });
});

exports.deleteNotification = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;

  const notification = await Notification.findOneAndDelete({
    _id: id,
    userId,
  });

  if (!notification) {
    return next(new AppError("Notification not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});
