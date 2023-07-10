const { v4: uuidv4 } = require("uuid");
const multer = require("multer");
const path = require("path");
const WineProduct = require("../models/wineProductModel");
const User = require("../models/userModel");
const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, `./public/images`);
  },
  filename: function (req, file, cb) {
    // cb(null, `${uuidv4()}-${file.originalname}`);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  // reject a file
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/webp"
  ) {
    return cb(null, true);
  }
  return cb(
    new AppError("Not an image! Please upload only images.", 400),
    false
  );
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5 },
  fileFilter: fileFilter,
});

exports.uploadProductImage = upload.single("image");

exports.aliasTopWineProducts = (req, res, next) => {
  req.query.limit = "10";
  req.query.sort = "price";
  req.query.fields = "name,price,summary,difficulty";
  next();
};

exports.searchWineProducts = catchAsync(async (req, res, next) => {
  const { search } = req.query;

  const wineProducts = await WineProduct.find({
    name: { $regex: search, $options: "i" },
  });

  res.status(200).json({
    status: "success",
    results: wineProducts.length,
    data: {
      wineProducts,
    },
  });
});

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
  const wineProduct = await WineProduct.findById({ _id: req.params.id });

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
  const { file } = req;

  if (!file) {
    return next(new AppError("Please upload an image", 400));
  }

  req.body.image = file.path.replace("C:\\fakepath\\", "");

  const newWineProduct = await WineProduct.create(req.body);

  if (!newWineProduct) {
    return next(new AppError("No wineProduct found with that ID", 404));
  }

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
  if (req.file) {
    // req.body.image = req.file.path;
    req.body.image = req.file.path.replace("C:\\fakepath\\", "");
  }

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
  const wine = await WineProduct.findById({ _id: req.params.id });
  const { quantity, price } = req.body;

  if (!wine) {
    return next(new AppError("No wine found with that ID", 404));
  }

  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  const newUser = await user.addToCart(wine._id, wine.name, quantity, price);

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
  const { quantity } = req.body;

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  const wine = await WineProduct.findById({ _id: req.params.id });

  if (!wine) {
    return next(new AppError("No wine found with that ID", 404));
  }

  const updatedCart = await user.updateCartItem(
    wine.id,
    wine.name,
    quantity,
    wine.price
  );

  res.status(200).json({
    status: "success",
    data: {
      updatedCart,
    },
  });
});

exports.deleteFromCart = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  const wine = await WineProduct.findById({ _id: req.params.id });

  if (!wine) {
    return next(new AppError("No wine found with that ID", 404));
  }

  // const cart = await user.deleteCartItem(wine.id.toString());

  const { cart } = user;

  // Remove the item from the cart based on productId
  const updatedCart = {};

  Object.keys(cart).forEach((productId) => {
    if (productId !== req.params.id) {
      updatedCart[productId] = cart[productId];
    }
  });

  // Save the updated cart
  user.cart = updatedCart;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    data: {
      cart,
    },
  });
});
