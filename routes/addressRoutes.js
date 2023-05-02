const express = require("express");
const userController = require("../controllers/userController");
const addressController = require("../controllers/addressController");

const router = express.Router();

router.get(
  "/getAllAddresses",
  userController.protect,
  userController.restrictTo("admin"),
  addressController.getAllAddresses
);

router
  .route("/default")
  .get(userController.protect, addressController.getDefaultAddress);

router
  .route("/default/:id")
  .patch(userController.protect, addressController.setDefaultAddress);

router
  .route("/")
  .post(userController.protect, addressController.createAddress)
  .get(userController.protect, addressController.getAddressByUser)
  .patch(userController.protect, addressController.updateAddress)
  .delete(userController.protect, addressController.deleteAddress);

router.get("/:id", userController.protect, addressController.getAddressById);

module.exports = router;
