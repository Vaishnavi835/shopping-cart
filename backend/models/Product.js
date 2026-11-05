const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true, unique: true },
    productName: { type: String, required: true, trim: true },
    productPrice: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true },
    // 🌟 UNIQUE FEATURE: Image URL for product display
    imageUrl: { type: String, default: "" },
    // 🌟 UNIQUE FEATURE: Ratings & Reviews system
    ratings: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        rating: { type: Number, min: 1, max: 5 },
        review: { type: String, trim: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // 🌟 UNIQUE FEATURE: Discount percentage
    discount: { type: Number, default: 0, min: 0, max: 100 },
  },
  { timestamps: true }
);

// Virtual: calculate average rating
ProductSchema.virtual("averageRating").get(function () {
  if (!this.ratings || this.ratings.length === 0) return 0;
  const sum = this.ratings.reduce((acc, r) => acc + r.rating, 0);
  return (sum / this.ratings.length).toFixed(1);
});

// Virtual: discounted price
ProductSchema.virtual("discountedPrice").get(function () {
  return parseFloat((this.productPrice * (1 - this.discount / 100)).toFixed(2));
});

ProductSchema.set("toJSON", { virtuals: true });
ProductSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Product", ProductSchema);

