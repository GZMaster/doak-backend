const express = require("express");
const productController = require("../controllers/productController");
const userController = require("../controllers/userController");

const router = express.Router();

router
  .route("/")
  .get(productController.getAllWineProducts)
  .post(productController.createWineProduct);

router.route("/length").get(productController.getLength);

router.route("/many").post(productController.createWineProductMany);

router
  .route("/:id")
  .get(productController.getWineProduct)
  .patch(productController.updateWineProduct)
  .delete(productController.deleteWineProduct);

router.route("/cart").get(productController.getCart);

router
  .route("/cart/:id")
  .post(userController.protect, productController.addToCart)
  .delete(userController.protect, productController.deleteFromCart);

module.exports = router;
