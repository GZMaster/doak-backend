const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

// Create a new Mongoose schema for the user model
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
    trim: true,
  },
  email: {
    type: String,
    required: [true, "Please provide your email address!"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valid email address!"],
  },
  cart: {
    type: Object,
    default: {},
  },
  password: {
    type: String,
    required: [true, "Please provide a password!"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password!"],
    validate: {
      // This only works on CREATE and SAVE!
      validator: function (el) {
        return el === this.password;
      },
      message: "Passwords are not the same!",
    },
  },
  otp: {
    type: String,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// Encrypt the user password before saving the user to the database
userSchema.pre("save", async function (next) {
  // Only run this function if the password was actually modified
  if (!this.isModified("password")) return next();

  // Hash the password with a cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // Delete the passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

// Compare the provided password with the user's password
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = async function (tokenIssuedAt) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return tokenIssuedAt < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.addToCart = function (id, quantity = 1) {
  const { cart } = this;
  const updatedCart = {};

  // data in the cart will be { id, quantity }
  Object.keys(cart).forEach((key) => {
    const item = cart[key];
    if (item.id === id) {
      item.quantity += quantity;
    }
    updatedCart[key] = item;
  });

  // If the item is not in the cart, add it
  if (!updatedCart[id]) {
    updatedCart[id] = { id, quantity };
  }

  // Set the cart to the updatedCart
  this.cart = updatedCart;
  return this.save({ validateBeforeSave: false });
};

userSchema.methods.updateCartItem = function (id, quantity = 0) {
  const { cart } = this;
  const updatedCart = {};
  let itemUpdated = false;

  // data in the cart will be { id, quantity }
  Object.keys(cart).forEach((key) => {
    const item = cart[key];
    if (item.id === id) {
      if (quantity > 0) {
        item.quantity = quantity;
        itemUpdated = true;
      } else {
        itemUpdated = true;
        return;
      }
    }
    updatedCart[key] = item;
  });

  // If no item was updated, return false
  if (!itemUpdated) {
    return false;
  }

  // Set the cart to the updatedCart and return true
  this.cart = updatedCart;
  return true;
};

userSchema.methods.deleteCartItem = function (id) {
  const { cart } = this;
  const updatedCart = {};
  let itemDeleted = false;

  // data in the cart will be { id, quantity } delete the item if the id found
  Object.keys(cart).forEach((key) => {
    const item = cart[key];
    if (item.id === id) {
      itemDeleted = true;
      return;
    }
    updatedCart[key] = item;
  });

  // If no item was deleted, return false
  if (!itemDeleted) {
    return false;
  }

  // Set the cart to the updatedCart and return true
  this.cart = updatedCart;
  return true;
};

// Create a new Mongoose model for the user model
const User = mongoose.model("User", userSchema);

// Export the user model
module.exports = User;
