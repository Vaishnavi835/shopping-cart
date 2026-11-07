const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Product = require("../models/Product");
const protect = require("../middleware/authMiddleware");

// ─── GET /api/personal/dashboard ─── Personalized Shopping Dashboard
router.get("/dashboard", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("cart.product")
      .populate("wishlist")
      .populate("recentlyViewed.product");
    if (!user) return res.status(404).json({ message: "User not found." });

    const totalOrders = user.orderHistory.length;
    const totalSpent = user.orderHistory.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    const cartCount = user.cart.length;
    const wishlistCount = user.wishlist.length;
    const recentActivity = user.activityHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 10);
    const budgetRemaining = user.budget - totalSpent;

    return res.status(200).json({
      dashboard: {
        username: user.username,
        totalOrders,
        totalSpent: parseFloat(totalSpent.toFixed(2)),
        cartCount,
        wishlistCount,
        recentActivity,
        budget: user.budget,
        budgetRemaining: parseFloat(budgetRemaining.toFixed(2)),
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── POST /api/personal/recently-viewed/:productId ─── Track Recently Viewed
router.post("/recently-viewed/:productId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found." });

    // Remove duplicate if exists
    user.recentlyViewed = user.recentlyViewed.filter(
      (rv) => rv.product.toString() !== req.params.productId
    );

    // Push to front
    user.recentlyViewed.unshift({ product: req.params.productId, viewedAt: new Date() });

    // Keep only last 20 items
    if (user.recentlyViewed.length > 20) {
      user.recentlyViewed = user.recentlyViewed.slice(0, 20);
    }

    // Log to activityHistory
    user.activityHistory.push({
      action: "viewed_product",
      productName: product.productName,
      details: `Viewed ${product.productName}`,
    });

    await user.save();
    return res.status(200).json({ message: "Tracked" });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── GET /api/personal/recently-viewed ─── Get Recently Viewed
router.get("/recently-viewed", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("recentlyViewed.product");
    if (!user) return res.status(404).json({ message: "User not found." });

    // Sort newest first, limit 20
    const recentlyViewed = user.recentlyViewed
      .sort((a, b) => new Date(b.viewedAt) - new Date(a.viewedAt))
      .slice(0, 20);

    return res.status(200).json({ recentlyViewed });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── GET /api/personal/recommendations ─── Personalized Recommendations
router.get("/recommendations", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("recentlyViewed.product")
      .populate("wishlist")
      .populate("cart.product");
    if (!user) return res.status(404).json({ message: "User not found." });

    // Gather categories from recently viewed and wishlist
    const categories = new Set();
    user.recentlyViewed.forEach((rv) => {
      if (rv.product && rv.product.category) categories.add(rv.product.category);
    });
    user.wishlist.forEach((w) => {
      if (w && w.category) categories.add(w.category);
    });

    if (categories.size === 0) {
      return res.status(200).json({ recommendations: [] });
    }

    // Get IDs already in cart and wishlist to exclude
    const cartProductIds = user.cart.map((c) => c.product?._id?.toString()).filter(Boolean);
    const wishlistProductIds = user.wishlist.map((w) => w?._id?.toString()).filter(Boolean);
    const excludeIds = [...new Set([...cartProductIds, ...wishlistProductIds])];

    // Find products in those categories, not in cart or wishlist
    const recommendations = await Product.find({
      category: { $in: Array.from(categories) },
      _id: { $nin: excludeIds },
      quantity: { $gt: 0 },
    })
      .sort({ "ratings.length": -1 }) // We'll sort manually for average rating
      .limit(50); // Get more and sort manually

    // Sort by average rating descending
    const sorted = recommendations
      .map((p) => {
        let avgRating = 0;
        if (p.ratings && p.ratings.length > 0) {
          const sum = p.ratings.reduce((acc, r) => acc + r.rating, 0);
          avgRating = sum / p.ratings.length;
        }
        return { product: p, avgRating };
      })
      .sort((a, b) => b.avgRating - a.avgRating)
      .slice(0, 10)
      .map((item) => item.product);

    return res.status(200).json({ recommendations: sorted });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── GET /api/personal/activity ─── Shopping Activity History
router.get("/activity", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const activityHistory = user.activityHistory
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 50);

    return res.status(200).json({ activityHistory });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── POST /api/personal/restock-notify/:productId ─── Subscribe to Restock
router.post("/restock-notify/:productId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const productId = req.params.productId;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found." });

    // Add if not already subscribed
    if (!user.restockNotifications.includes(productId)) {
      user.restockNotifications.push(productId);
      await user.save();
    }

    return res.status(200).json({ message: "Subscribed to restock notification" });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── DELETE /api/personal/restock-notify/:productId ─── Unsubscribe
router.delete("/restock-notify/:productId", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.restockNotifications = user.restockNotifications.filter(
      (id) => id.toString() !== req.params.productId
    );
    await user.save();

    return res.status(200).json({ message: "Unsubscribed" });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── GET /api/personal/restock-notify ─── Get Restock Subscriptions
router.get("/restock-notify", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("restockNotifications");
    if (!user) return res.status(404).json({ message: "User not found." });

    return res.status(200).json({ restockNotifications: user.restockNotifications });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// 🌟 FEATURE 1: SIZE & FIT PREDICTOR
// ══════════════════════════════════════════════════════════════

// ─── GET /api/personal/size-predictor/:productId ───
// Predict size based on user measurements, past purchases & returns
router.get("/size-predictor/:productId", protect.optionalAuth, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: "Product not found." });

    let user = null;
    if (req.user && req.user.id) {
      user = await User.findById(req.user.id);
    }

    const category = (product.category || "").toLowerCase();
    const isFootwear = category.includes("footwear") || category.includes("shoe");
    const isClothing = category.includes("clothing") || category.includes("dress") || category.includes("shirt") || category.includes("top");

    // Default sizing profile
    const profile = user?.sizingProfile || {
      height: 172,
      weight: 68,
      preferredFit: "regular",
      topSize: "M",
      bottomSize: "32",
      shoeSize: "9",
    };

    const pastReturns = user?.pastReturns || [];
    const orderHistory = user?.orderHistory || [];

    let recommendedSize = "M";
    let confidence = 88;
    const reasons = [];

    if (isFootwear) {
      // Footwear logic
      recommendedSize = `UK ${profile.shoeSize || "9"}`;
      confidence = 92;
      reasons.push(`Calibrated to your standard UK ${profile.shoeSize || "9"} footwear profile`);

      // Check footwear returns
      const shoeReturns = pastReturns.filter(
        (r) => (r.category || "").toLowerCase().includes("footwear") || (r.category || "").toLowerCase().includes("shoe")
      );
      if (shoeReturns.some((r) => r.reason.toLowerCase().includes("small"))) {
        const currentNum = parseInt(profile.shoeSize) || 9;
        recommendedSize = `UK ${currentNum + 1}`;
        confidence = 96;
        reasons.push(`Adjusted +1 size up because you previously returned shoes due to snug fit`);
      } else {
        reasons.push("0 sizing returns reported across your past footwear orders");
      }
    } else {
      // Clothing / Top / Bottom logic
      const height = profile.height || 172;
      const weight = profile.weight || 68;
      const fit = profile.preferredFit || "regular";

      // BMI / Body mass calculation
      const bmi = weight / Math.pow(height / 100, 2);

      const sizeChart = ["XS", "S", "M", "L", "XL", "XXL"];
      let baseIndex = 2; // Default "M"

      if (bmi < 18.5) baseIndex = 1; // S
      else if (bmi < 24) baseIndex = 2; // M
      else if (bmi < 28) baseIndex = 3; // L
      else if (bmi < 32) baseIndex = 4; // XL
      else baseIndex = 5; // XXL

      reasons.push(`Height (${height}cm) & weight (${weight}kg) recommend base size ${sizeChart[baseIndex]}`);

      // Adjust for user's preferred fit
      if (fit === "oversized" || fit === "relaxed") {
        baseIndex = Math.min(baseIndex + 1, sizeChart.length - 1);
        reasons.push(`Up-sized to ${sizeChart[baseIndex]} to match your '${fit}' styling preference`);
      } else if (fit === "slim") {
        reasons.push(`Snug silhouette fits your preferred 'slim' fit profile`);
      }

      // Check past order history for this category
      const pastClothingOrders = [];
      orderHistory.forEach((o) => {
        (o.items || []).forEach((item) => {
          if (item.productName) pastClothingOrders.push(item);
        });
      });
      if (pastClothingOrders.length > 0) {
        confidence += 4;
        reasons.push(`Validated against your ${pastClothingOrders.length} previous fashion orders`);
      }

      // Check past returns for sizing issues
      const sizingReturns = pastReturns.filter(
        (r) => r.reason.toLowerCase().includes("small") || r.reason.toLowerCase().includes("tight")
      );
      if (sizingReturns.length > 0) {
        const returnedSize = sizingReturns[0].size || sizeChart[baseIndex];
        baseIndex = Math.min(baseIndex + 1, sizeChart.length - 1);
        confidence = 97;
        reasons.push(`Adjusted up to ${sizeChart[baseIndex]}: You previously returned ${returnedSize} as 'Too Small'`);
      }

      recommendedSize = sizeChart[baseIndex];
    }

    return res.status(200).json({
      productId: product._id,
      productName: product.productName,
      category: product.category,
      isClothingOrFootwear: isClothing || isFootwear,
      recommendedSize,
      confidence: Math.min(confidence, 99),
      fitTip: isFootwear
        ? "True to standard athletic & casual footwear measurements."
        : "Tailored contour with breathable comfort drape.",
      reasons,
      sizingProfile: profile,
      hasReturnsHistory: pastReturns.length > 0,
      pastReturns,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── PUT /api/personal/sizing-profile ─── Update Sizing Measurements
router.put("/sizing-profile", protect, async (req, res) => {
  try {
    const { height, weight, preferredFit, topSize, bottomSize, shoeSize } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.sizingProfile = {
      height: height !== undefined ? Number(height) : user.sizingProfile?.height || 172,
      weight: weight !== undefined ? Number(weight) : user.sizingProfile?.weight || 68,
      preferredFit: preferredFit || user.sizingProfile?.preferredFit || "regular",
      topSize: topSize || user.sizingProfile?.topSize || "M",
      bottomSize: bottomSize || user.sizingProfile?.bottomSize || "32",
      shoeSize: shoeSize || user.sizingProfile?.shoeSize || "9",
    };

    await user.save();
    return res.status(200).json({
      message: "Sizing profile updated! 📏",
      sizingProfile: user.sizingProfile,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── POST /api/personal/log-return ─── Log a Return for Size Calibration
router.post("/log-return", protect, async (req, res) => {
  try {
    const { productName, category, size, reason } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.pastReturns.unshift({
      productName: productName || "Apparel Item",
      category: category || "Clothing",
      size: size || "M",
      reason: reason || "Too Small",
      returnedAt: new Date(),
    });

    await user.save();
    return res.status(200).json({
      message: "Return logged for sizing calibration.",
      pastReturns: user.pastReturns,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// 🌟 FEATURE 2: STYLE QUIZ & HOMEPAGE PERSONALIZATION
// ══════════════════════════════════════════════════════════════

// ─── PUT /api/personal/style-quiz ─── Save Style Quiz Answers
router.put("/style-quiz", protect, async (req, res) => {
  try {
    const { primaryVibe, favoriteColors, preferredCategories, budgetTier } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    user.styleQuiz = {
      completed: true,
      primaryVibe: primaryVibe || "Minimalist Modern",
      favoriteColors: Array.isArray(favoriteColors) ? favoriteColors : ["Pastels", "Earth Tones"],
      preferredCategories: Array.isArray(preferredCategories) && preferredCategories.length > 0
        ? preferredCategories
        : ["Clothing", "Footwear", "Accessories"],
      budgetTier: budgetTier || "Balanced",
      completedAt: new Date(),
    };

    // Award 50 bonus reward coins for taking the quiz!
    user.rewardCoins = (user.rewardCoins || 0) + 50;

    user.activityHistory.push({
      action: "completed_style_quiz",
      details: `Completed Style Quiz: ${user.styleQuiz.primaryVibe} (+50 Coins)`,
    });

    await user.save();

    return res.status(200).json({
      message: "Style Quiz saved! Your feed has been personalized. ✨ (+50 Reward Coins)",
      styleQuiz: user.styleQuiz,
      rewardCoins: user.rewardCoins,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── GET /api/personal/style-feed ─── Personalized Product Feed
router.get("/style-feed", protect.optionalAuth, async (req, res) => {
  try {
    let user = null;
    if (req.user && req.user.id) {
      user = await User.findById(req.user.id);
    }

    const quiz = user?.styleQuiz;
    const preferredCats = quiz?.completed && quiz?.preferredCategories?.length > 0
      ? quiz.preferredCategories
      : ["Clothing", "Footwear", "Accessories", "Electronics"];

    // Find products matching preferred categories
    const products = await Product.find({
      category: { $in: preferredCats },
      quantity: { $gt: 0 },
    }).limit(12);

    return res.status(200).json({
      isPersonalized: Boolean(quiz?.completed),
      primaryVibe: quiz?.primaryVibe || "Modern Curated",
      favoriteColors: quiz?.favoriteColors || [],
      budgetTier: quiz?.budgetTier || "Balanced",
      products,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// 🌟 FEATURE 4: SPIN-THE-WHEEL & DAILY STREAK REWARDS
// ══════════════════════════════════════════════════════════════

// ─── GET /api/personal/rewards ─── Get User Rewards & Streaks
router.get("/rewards", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const now = new Date();
    const lastSpin = user.lastSpinDate ? new Date(user.lastSpinDate) : null;
    const hoursSinceLastSpin = lastSpin ? (now - lastSpin) / (1000 * 60 * 60) : 999;
    const canSpinFree = hoursSinceLastSpin >= 24;

    return res.status(200).json({
      rewardCoins: user.rewardCoins || 0,
      dailyStreak: user.dailyStreak || { count: 1, lastLoginDate: now },
      canSpinFree,
      hoursUntilNextFreeSpin: Math.max(0, Math.ceil(24 - hoursSinceLastSpin)),
      claimedCoupons: (user.claimedCoupons || []).filter((c) => !c.used),
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── POST /api/personal/check-streak ─── Daily Login Streak Verification
router.post("/check-streak", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const now = new Date();
    const lastLogin = user.dailyStreak?.lastLoginDate ? new Date(user.dailyStreak.lastLoginDate) : null;

    let updatedStreak = user.dailyStreak?.count || 1;
    let coinsAwarded = 0;
    let streakMessage = "Welcome back!";

    if (lastLogin) {
      const diffDays = Math.floor((now.setHours(0, 0, 0, 0) - new Date(lastLogin).setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        // Consecutive day!
        updatedStreak += 1;
        coinsAwarded = updatedStreak * 10;
        streakMessage = `🔥 ${updatedStreak}-Day Streak! Earned +${coinsAwarded} Coins!`;
      } else if (diffDays > 1) {
        // Broken streak
        updatedStreak = 1;
        coinsAwarded = 10;
        streakMessage = `Streak reset. Started Day 1 (+10 Coins)!`;
      }
    } else {
      updatedStreak = 1;
      coinsAwarded = 25;
      streakMessage = `Started your 7-Day Streak (+25 Coins)!`;
    }

    user.dailyStreak = {
      count: updatedStreak,
      lastLoginDate: new Date(),
    };
    user.rewardCoins = (user.rewardCoins || 0) + coinsAwarded;
    await user.save();

    return res.status(200).json({
      streakCount: updatedStreak,
      coinsAwarded,
      totalCoins: user.rewardCoins,
      streakMessage,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── POST /api/personal/spin-wheel ─── Spin The Wheel Reward Engine
router.post("/spin-wheel", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const now = new Date();
    const lastSpin = user.lastSpinDate ? new Date(user.lastSpinDate) : null;
    const hoursSinceLastSpin = lastSpin ? (now - lastSpin) / (1000 * 60 * 60) : 999;
    const isFree = hoursSinceLastSpin >= 24;

    if (!isFree) {
      const SPIN_COST = 30;
      if ((user.rewardCoins || 0) < SPIN_COST) {
        return res.status(400).json({
          message: `Next free spin in ${Math.ceil(24 - hoursSinceLastSpin)}h, or use 30 Coins (you have ${user.rewardCoins || 0}).`,
        });
      }
      user.rewardCoins -= SPIN_COST;
    }

    // 6 Wheel Segments
    const WHEEL_PRIZES = [
      { code: "SPIN15", title: "15% OFF Everything", discountType: "percent", discountValue: 15, label: "🎟️ 15% OFF" },
      { code: "FREESHIP", title: "Free Express Delivery", discountType: "free_shipping", discountValue: 0, label: "🚚 Free Delivery" },
      { code: "LUCKY150", title: "₹150 Flat Discount", discountType: "flat", discountValue: 150, label: "💰 ₹150 OFF" },
      { code: "COINS100", title: "100 Reward Coins", discountType: "coins", discountValue: 100, label: "🪙 100 Coins" },
      { code: "MEGA20", title: "20% Super Saver", discountType: "percent", discountValue: 20, label: "🎁 20% OFF" },
      { code: "COINS50", title: "50 Bonus Coins", discountType: "coins", discountValue: 50, label: "🌟 50 Coins" },
    ];

    // Pick random winning index (0 to 5)
    const winningIndex = Math.floor(Math.random() * WHEEL_PRIZES.length);
    const prize = WHEEL_PRIZES[winningIndex];

    if (prize.discountType === "coins") {
      user.rewardCoins = (user.rewardCoins || 0) + prize.discountValue;
    } else {
      // Avoid duplicate active coupon
      const hasCoupon = user.claimedCoupons.some((c) => c.code === prize.code && !c.used);
      if (!hasCoupon) {
        user.claimedCoupons.push({
          code: prize.code,
          title: prize.title,
          discountType: prize.discountType,
          discountValue: prize.discountValue,
          claimedAt: new Date(),
          used: false,
        });
      }
    }

    user.lastSpinDate = new Date();
    await user.save();

    return res.status(200).json({
      winningIndex,
      prize,
      totalCoins: user.rewardCoins,
      claimedCoupons: user.claimedCoupons.filter((c) => !c.used),
      message: `🎉 Congratulations! You won: ${prize.label}`,
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;
