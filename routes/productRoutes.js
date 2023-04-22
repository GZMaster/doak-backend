const express = require("express");
const productController = require("../controllers/productController");
const userController = require("../controllers/userController");

const router = express.Router();

router.post("/signup", userController.signup);

router.post("/login", userController.login);

router.get("/logout", userController.logout);

router.post("/forgotPassword", userController.forgotPassword);

router.patch("/resetPassword/:token", userController.resetPassword);

router.patch(
  "/updateMyPassword",
  userController.protect,
  userController.updatePassword
);

router.patch("/updateMe", userController.protect, userController.updateMe);

router
  .route("/")
  .get(productController.getAllWineProducts)
  .post(productController.createWineProduct);

router
  .route("/:id")
  .get(productController.getWineProduct)
  .patch(productController.updateWineProduct)
  .delete(productController.deleteWineProduct);

router.route("/cart").get(productController.getCart);

router
  .route("/cart/:id")
  .post(productController.addToCart)
  .delete(productController.deleteFromCart);

module.exports = router;
