const {
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
} = require("firebase/firestore");
// const APIFeatures = require("../utils/apiFeatures");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const { docRef } = require("../firebase");

exports.createWineProduct = catchAsync(async (req, res, next) => {
  const newWineProduct = await addDoc(docRef, req.body);

  res.status(201).json({
    status: "success",
    data: {
      id: newWineProduct.id,
      wineProduct: req.body,
    },
  });
});

exports.getAllWineProducts = catchAsync(async (req, res, next) => {
  const wineProducts = await (
    await getDocs(docRef)
  ).docs.map((item) => ({
    ...item.data(),
  }));

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
  const wineProductRef = doc(docRef, req.params.id);
  const wineProductDoc = await getDoc(wineProductRef);

  if (!wineProductDoc.exists()) {
    return next(new AppError("No wineProduct found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      wineProduct: wineProductDoc.data(),
    },
  });
});

exports.updateWineProduct = catchAsync(async (req, res, next) => {
  const wineProductRef = doc(docRef, req.params.id);
  const wineProductDoc = await getDoc(wineProductRef);

  if (!wineProductDoc.exists()) {
    return next(new AppError("No wineProduct found with that ID", 404));
  }

  await updateDoc(wineProductRef, req.body);

  res.status(200).json({
    status: "success",
    data: {
      wineProduct: { ...wineProductDoc.data(), ...req.body },
    },
  });
});

exports.deleteWineProduct = catchAsync(async (req, res, next) => {
  const wineProductRef = doc(docRef, req.params.id);
  const wineProductDoc = await getDoc(wineProductRef);

  if (!wineProductDoc.exists()) {
    return next(new AppError("No wineProduct found with that ID", 404));
  }

  await deleteDoc(wineProductRef);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.addToCart = catchAsync(async (req, res, next) => {
  const wineSnapshot = await docRef.ref(`wines/${req.params.id}`).once("value");
  const wine = wineSnapshot.val();

  if (!wine) {
    return next(new AppError("No wine found with that ID", 404));
  }

  const userSnapshot = await docRef.ref(`users/${req.user.id}`).once("value");
  const user = userSnapshot.val();

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  // Add the wine to the user's cart
  const cartRef = docRef.ref(`users/${req.user.id}/cart`);
  const cartSnapshot = await cartRef.once("value");
  const cart = cartSnapshot.val() || [];

  cart.push(wine);

  await cartRef.set(cart);

  res.status(200).json({
    status: "success",
    data: {
      cart,
    },
  });
});

exports.getCart = catchAsync(async (req, res, next) => {
  const userSnapshot = await docRef.ref(`users/${req.user.id}`).once("value");
  const user = userSnapshot.val();

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  const cartSnapshot = await docRef
    .ref(`users/${req.user.id}/cart`)
    .once("value");
  const cart = cartSnapshot.val() || [];

  res.status(200).json({
    status: "success",
    data: {
      cart,
    },
  });
});

exports.deleteFromCart = catchAsync(async (req, res, next) => {
  const userSnapshot = await docRef.ref(`users/${req.user.id}`).once("value");
  const user = userSnapshot.val();

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  const cartSnapshot = await docRef
    .ref(`users/${req.user.id}/cart`)
    .once("value");
  const cart = cartSnapshot.val() || [];

  const wineSnapshot = await docRef.ref(`wines/${req.params.id}`).once("value");
  const wine = wineSnapshot.val();

  if (!wine) {
    return next(new AppError("No wine found with that ID", 404));
  }

  // Remove the wine from the user's cart
  const index = cart.findIndex((item) => item.id === req.params.id);

  if (index > -1) {
    cart.splice(index, 1);

    await docRef.ref(`users/${req.user.id}/cart`).set(cart);
  }

  res.status(200).json({
    status: "success",
    data: {
      cart,
    },
  });
});
