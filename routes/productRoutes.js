const express = require("express");
const productController = require("../controllers/productController");

const router = express.Router();

router
  .route("/")
  .get(productController.getAllWineProducts)
  .post(productController.createWineProduct);

router
  .route("/top-5-cheap")
  .get(
    productController.aliasTopWineProducts,
    productController.getAllWineProducts
  );

router
  .route("/:id")
  .get(productController.getWineProduct)
  .patch(productController.updateWineProduct)
  .delete(productController.deleteWineProduct);

module.exports = router;
