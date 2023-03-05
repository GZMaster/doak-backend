const WineProduct = require("../models/wineProductModel");
const User = require("../models/userModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

exports.aliasTopWineProducts = (req, res, next) => {
  req.query.limit = "10";
  req.query.sort = "price";
  req.query.fields = "name,price,summary,difficulty";
  next();
};

exports.getAllWineProducts = catchAsync(async (req, res, next) => {
  // EXECUTE QUERY
  const features = new APIFeatures(WineProduct.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const wineProducts = await features.query;

  // SEND RESPONSE
  res.status(200).json({
    status: "success",
    results: wineProducts.length,
    data: {
      wineProducts,
    },
  });
});

exports.getWineProduct = catchAsync(async (req, res, next) => {
  const wineProduct = await WineProduct.findById(req.params.id);

  if (!wineProduct) {
    return next(new AppError("No wineProduct found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      wineProduct,
    },
  });
});

exports.createWineProduct = catchAsync(async (req, res, next) => {
  const newWineProduct = await WineProduct.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      wineProduct: newWineProduct,
    },
  });
});

exports.updateWineProduct = catchAsync(async (req, res, next) => {
  const updatedWine = await WineProduct.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedWine) {
    return next(new AppError("No wine found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      wine: updatedWine,
    },
  });
});

exports.deleteWineProduct = catchAsync(async (req, res, next) => {
  const wine = await WineProduct.findByIdAndDelete(req.params.id);

  if (!wine) {
    return next(new AppError("No wine found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.addToCart = catchAsync(async (req, res, next) => {
  const wine = await WineProduct.findById(req.params.id);

  if (!wine) {
    return next(new AppError("No wine found with that ID", 404));
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  const cart = await user.cart.push(wine);

  res.status(200).json({
    status: "success",
    data: {
      cart,
    },
  });
});

exports.getCart = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  const cart = await user.cart;

  res.status(200).json({
    status: "success",
    data: {
      cart,
    },
  });
});

exports.deleteFromCart = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  const cart = await user.cart;

  const wine = await WineProduct.findById(req.params.id);

  if (!wine) {
    return next(new AppError("No wine found with that ID", 404));
  }

  const index = cart.indexOf(wine);

  if (index > -1) {
    cart.splice(index, 1);
  }

  res.status(200).json({
    status: "success",
    data: {
      cart,
    },
  });
});
