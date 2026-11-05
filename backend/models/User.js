const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    emailId: { type: String, required: true, unique: true, lowercase: true, trim: true },
    age: { type: Number, required: true, min: 1 },
    password: { type: String, required: true, minlength: 6 },
    // 🌟 UNIQUE FEATURE: Wishlist stored per user
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    // 🌟 UNIQUE FEATURE: Cart stored per user (persistent cart)
    cart: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        quantity: { type: Number, default: 1 },
      },
    ],
    // 🌟 UNIQUE FEATURE: Order history per user
    orderHistory: [
      {
        items: [
          {
            productName: String,
            price: Number,
            quantity: Number,
          },
        ],
        totalAmount: Number,
        orderedAt: { type: Date, default: Date.now },
      },
    ],
    // 🌟 Budget Monitoring
    budget: { type: Number, default: 0 },
    // 🌟 Recently Viewed Products
    recentlyViewed: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        viewedAt: { type: Date, default: Date.now },
      },
    ],
    // 🌟 Shopping Activity History
    activityHistory: [
      {
        action: { type: String, required: true }, // e.g., "viewed_product", "added_to_cart", "placed_order", "added_to_wishlist"
        productName: { type: String },
        details: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    // 🌟 Restock Notifications
    restockNotifications: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
    // 🌟 Dark Mode Preference
    darkMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Compare plain password with hashed
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);

