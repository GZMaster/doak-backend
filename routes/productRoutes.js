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
  .get(userController.protect, productController.getAllWineProducts)
  .post(userController.protect, productController.createWineProduct);

router
  .route("/top-5-cheap")
  .get(
    userController.protect,
    productController.aliasTopWineProducts,
    productController.getAllWineProducts
  );

router
  .route("/:id")
  .get(userController.protect, productController.getWineProduct)
  .patch(userController.protect, productController.updateWineProduct)
  .delete(userController.protect, productController.deleteWineProduct);

module.exports = router;
