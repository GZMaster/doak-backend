const { v4: uuidv4 } = require("uuid");
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

exports.getLength = catchAsync(async (req, res, next) => {
  const numberOfWines = await WineProduct.countDocuments();

  res.status(200).json({
    status: "success",
    data: numberOfWines,
  });
});

exports.getWineProduct = catchAsync(async (req, res, next) => {
  const wineProduct = await WineProduct.findOne({ id: req.params.id });

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
  const newId = uuidv4();

  req.body.id = newId;

  const newWineProduct = await WineProduct.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      wineProduct: newWineProduct,
    },
  });
});

exports.createWineProductMany = catchAsync(async (req, res, next) => {
  const manyProd = req.body.map((el) => {
    el.id = uuidv4();
    return el;
  });

  const newWineProducts = await WineProduct.insertMany(manyProd);

  res.status(201).json({
    status: "success",
    data: {
      wineProducts: newWineProducts,
    },
  });
});

exports.updateWineProduct = catchAsync(async (req, res, next) => {
  const updatedWine = await WineProduct.findOneAndUpdate(
    { id: req.params.id },
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
  const wine = await WineProduct.findOneAndDelete({ id: req.params.id });

  if (!wine) {
    return next(new AppError("No wine found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.addToCart = catchAsync(async (req, res, next) => {
  const wine = await WineProduct.findOne({ id: req.params.id });
  const { quantity } = req.body;

  if (!wine) {
    return next(new AppError("No wine found with that ID", 404));
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  const newUser = await user.addToCart(wine.id, quantity);

  newUser.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    data: {
      cart: newUser.cart,
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

exports.updateCart = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  const quantity = req.body ? req.body.quantity : 1;

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  const wine = await WineProduct.findOne({ id: req.params.id });

  if (!wine) {
    return next(new AppError("No wine found with that ID", 404));
  }

  await user.updateCartItem(wine.id, quantity);

  user.save({ validateBeforeSave: false });

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

  const wine = await WineProduct.findOne({ id: req.params.id });

  if (!wine) {
    return next(new AppError("No wine found with that ID", 404));
  }

  await user.deleteCartItem(wine.id);

  const cart = await user.cart;

  user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    data: {
      cart,
    },
  });
});
