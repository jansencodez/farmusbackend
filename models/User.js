const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const TransactionSchema = new mongoose.Schema({
  amount: { type: mongoose.Schema.Types.Decimal128, required: true },
  type: { type: String, enum: ["credit", "debit"], required: true },
  date: { type: Date, default: Date.now },
  description: { type: String },
});

const CartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: { type: Number, default: 1 },
  price: { type: mongoose.Schema.Types.Decimal128, required: true }, // price at time of adding to cart
});

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  profilePicture: { type: String },
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  walletBalance: { type: mongoose.Schema.Types.Decimal128, default: 0.0 },
  transactionHistory: [TransactionSchema],
  cart: [CartItemSchema], // Added cart field to store items in the user's cart
});

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", UserSchema);
module.exports = User;
