const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    emailId: { type: String, required: true, unique: true, lowercase: true, trim: true },
    age: { type: Number, required: true, min: 1 },
    password: { type: String, required: true, minlength: 6 },
    phone: { type: String, default: "" },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "India" },
    },
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
        orderId: { type: String, default: "" },
        items: [
          {
            productName: String,
            price: Number,
            quantity: Number,
            imageUrl: String,
          },
        ],
        totalAmount: Number,
        paymentMethod: { type: String, default: "Card" },
        paymentStatus: { type: String, default: "Paid" },
        deliveryAddress: {
          fullName: String,
          phone: String,
          street: String,
          city: String,
          state: String,
          postalCode: String,
          country: String,
        },
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

    // 🌟 SIZE & FIT PREDICTOR PROFILE
    sizingProfile: {
      height: { type: Number, default: 172 }, // in cm
      weight: { type: Number, default: 68 }, // in kg
      preferredFit: {
        type: String,
        enum: ["slim", "regular", "relaxed", "oversized"],
        default: "regular",
      },
      topSize: { type: String, default: "M" },
      bottomSize: { type: String, default: "32" },
      shoeSize: { type: String, default: "9" },
    },
    // Past returns used by size predictor to calibrate recommendations
    pastReturns: [
      {
        productName: { type: String, default: "" },
        category: { type: String, default: "Clothing" },
        size: { type: String, default: "M" },
        reason: { type: String, default: "Too Small" }, // "Too Small", "Too Large", "Uncomfortable", etc.
        returnedAt: { type: Date, default: Date.now },
      },
    ],

    // 🌟 STYLE QUIZ & HOMEPAGE PERSONALIZATION
    styleQuiz: {
      completed: { type: Boolean, default: false },
      primaryVibe: { type: String, default: "" }, // "Minimalist Modern", "Urban Streetwear", "Classic Elegance", "Athleisure", "Casual Cozy"
      favoriteColors: [{ type: String }], // ["Pastels", "Earth Tones", "Monochrome", "Vibrant"]
      preferredCategories: [{ type: String }], // ["Clothing", "Footwear", "Electronics", "Accessories", "Home", "Kitchen"]
      budgetTier: { type: String, default: "Balanced" }, // "Budget-Friendly", "Balanced", "Premium"
      completedAt: { type: Date },
    },

    // 🌟 REWARDS, STREAKS & SPIN-THE-WHEEL
    rewardCoins: { type: Number, default: 50 },
    dailyStreak: {
      count: { type: Number, default: 1 },
      lastLoginDate: { type: Date, default: Date.now },
    },
    lastSpinDate: { type: Date, default: null },
    claimedCoupons: [
      {
        code: { type: String, required: true },
        title: { type: String, default: "" },
        discountType: { type: String, enum: ["percent", "flat", "free_shipping"], default: "percent" },
        discountValue: { type: Number, default: 15 },
        claimedAt: { type: Date, default: Date.now },
        used: { type: Boolean, default: false },
      },
    ],
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

