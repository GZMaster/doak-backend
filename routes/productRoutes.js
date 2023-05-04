const express = require("express");
const productController = require("../controllers/productController");
const userController = require("../controllers/userController");

const router = express.Router();

router
  .route("/")
  .get(productController.getAllWineProducts)
  .post(
    productController.uploadProductImage,
    productController.createWineProduct
  );

router.route("/length").get(productController.getLength);

router.route("/many").post(productController.createWineProductMany);

router.route("/cart").get(userController.protect, productController.getCart);

router.route("/image/:filename").get(productController.getImage);

router
  .route("/cart/:id")
  .post(userController.protect, productController.addToCart)
  .patch(userController.protect, productController.updateCart)
  .delete(userController.protect, productController.deleteFromCart);

router
  .route("/:id")
  .get(productController.getWineProduct)
  .patch(productController.updateWineProduct)
  .delete(productController.deleteWineProduct);

module.exports = router;
