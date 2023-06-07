const { v4: uuidv4 } = require("uuid");
// eslint-disable-next-line import/no-extraneous-dependencies
const multer = require("multer");
const path = require("path");
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

// Create Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb("Error: Images Only!");
  },
});

exports.getImage = (req, res, next) => {
  const imagePath = path.join(
    __dirname,
    "..",
    "public",
    "images",
    req.params.filename
  );
  res.sendFile(imagePath);

  res.set("Cache-Control", "public, max-age=31557600");
};

// Middleware function to handle file uploads
exports.uploadProductImage = upload.single("image");

exports.searchWineProducts = catchAsync(async (req, res, next) => {
  const { query } = req.query;

  const wineProducts = await WineProduct.find({
    name: { $regex: query, $options: "i" },
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
  const newId = uuidv4();

  req.body.id = newId;

  if (req.file) {
    req.body.image = req.file.filename;
  }

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
  const { price, quantity } = req.body;

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  const wine = await WineProduct.findById({ _id: req.params.id });

  if (!wine) {
    return next(new AppError("No wine found with that ID", 404));
  }

  await user.updateCartItem(wine.id, wine.name, quantity, price);

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

  const wine = await WineProduct.findById({ _id: req.params.id });

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
