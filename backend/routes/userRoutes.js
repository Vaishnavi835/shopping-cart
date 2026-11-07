const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const protect = require("../middleware/authMiddleware");

// Helper to generate JWT token
const generateToken = (user) =>
  jwt.sign({ id: user._id, email: user.emailId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

// ─── POST /api/users ─── Register (public)
router.post("/", async (req, res) => {
  const { username, emailId, age, password } = req.body;

  // Input validation
  if (!username || !emailId || !age || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }
  // 🛡️ Type check: prevent NoSQL injection via object payloads
  if (typeof username !== "string" || typeof emailId !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Invalid input format." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." });
  }
  if (age < 1 || isNaN(age)) {
    return res.status(400).json({ message: "Please enter a valid age." });
  }

  try {
    const existing = await User.findOne({ emailId });
    if (existing) {
      return res.status(409).json({ message: "Email ID is already registered." });
    }
    const user = await User.create({ username, emailId, age, password });
    const token = generateToken(user);
    return res.status(201).json({
      message: `Successfully registered! Welcome, ${user.username}.`,
      token,
      user: {
        username: user.username,
        emailId: user.emailId,
        age: user.age,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── GET /api/users/me ─── Get current logged-in user profile (protected)
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.status(200).json({
      user: {
        _id: user._id,
        username: user.username,
        emailId: user.emailId,
        age: user.age,
        phone: user.phone || "",
        address: user.address || { street: "", city: "", state: "", postalCode: "", country: "India" },
        budget: user.budget || 0,
        darkMode: user.darkMode || false,
        ordersCount: user.orderHistory?.length || 0,
        wishlistCount: user.wishlist?.length || 0,
        cartCount: user.cart?.reduce((s, i) => s + (i.quantity || 1), 0) || 0,
        sizingProfile: user.sizingProfile || {
          height: 172,
          weight: 68,
          preferredFit: "regular",
          topSize: "M",
          bottomSize: "32",
          shoeSize: "9",
        },
        styleQuiz: user.styleQuiz || { completed: false },
        rewardCoins: user.rewardCoins ?? 50,
        dailyStreak: user.dailyStreak || { count: 1, lastLoginDate: new Date() },
        claimedCoupons: user.claimedCoupons || [],
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── PUT /api/users ─── Update all editable fields (protected)
router.put("/", protect, async (req, res) => {
  const { username, age, phone, address, budget, password } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (username) user.username = username;
    if (age !== undefined) user.age = Number(age);
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) {
      user.address = {
        street: address.street || "",
        city: address.city || "",
        state: address.state || "",
        postalCode: address.postalCode || "",
        country: address.country || "India",
      };
    }
    if (budget !== undefined) user.budget = Number(budget);
    if (password && password.length >= 6) {
      user.password = password; // will be hashed by pre-save hook
    }

    await user.save();

    return res.status(200).json({
      message: "Profile updated successfully! ✨",
      user: {
        _id: user._id,
        username: user.username,
        emailId: user.emailId,
        age: user.age,
        phone: user.phone || "",
        address: user.address,
        budget: user.budget || 0,
        darkMode: user.darkMode,
        ordersCount: user.orderHistory?.length || 0,
        wishlistCount: user.wishlist?.length || 0,
        cartCount: user.cart?.reduce((s, i) => s + (i.quantity || 1), 0) || 0,
        sizingProfile: user.sizingProfile || {
          height: 172,
          weight: 68,
          preferredFit: "regular",
          topSize: "M",
          bottomSize: "32",
          shoeSize: "9",
        },
        styleQuiz: user.styleQuiz || { completed: false },
        rewardCoins: user.rewardCoins ?? 50,
        dailyStreak: user.dailyStreak || { count: 1, lastLoginDate: new Date() },
        claimedCoupons: user.claimedCoupons || [],
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── PATCH /api/users ─── Update selected fields (protected)
router.patch("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (req.body.username !== undefined) user.username = req.body.username;
    if (req.body.age !== undefined) user.age = Number(req.body.age);
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.budget !== undefined) user.budget = Number(req.body.budget);
    if (req.body.darkMode !== undefined) user.darkMode = Boolean(req.body.darkMode);
    if (req.body.address !== undefined) {
      user.address = {
        street: req.body.address.street || user.address?.street || "",
        city: req.body.address.city || user.address?.city || "",
        state: req.body.address.state || user.address?.state || "",
        postalCode: req.body.address.postalCode || user.address?.postalCode || "",
        country: req.body.address.country || user.address?.country || "India",
      };
    }

    // Handle password change separately (if provided)
    if (req.body.password) {
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters." });
      }
      user.password = req.body.password;
    }

    await user.save();
    return res.status(200).json({
      message: "Profile updated successfully! ✨",
      user: {
        _id: user._id,
        username: user.username,
        emailId: user.emailId,
        age: user.age,
        phone: user.phone || "",
        address: user.address,
        budget: user.budget || 0,
        darkMode: user.darkMode,
        ordersCount: user.orderHistory?.length || 0,
        wishlistCount: user.wishlist?.length || 0,
        cartCount: user.cart?.reduce((s, i) => s + (i.quantity || 1), 0) || 0,
        sizingProfile: user.sizingProfile || {
          height: 172,
          weight: 68,
          preferredFit: "regular",
          topSize: "M",
          bottomSize: "32",
          shoeSize: "9",
        },
        styleQuiz: user.styleQuiz || { completed: false },
        rewardCoins: user.rewardCoins ?? 50,
        dailyStreak: user.dailyStreak || { count: 1, lastLoginDate: new Date() },
        claimedCoupons: user.claimedCoupons || [],
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── DELETE /api/users ─── Delete own account (protected)
router.delete("/", protect, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    return res.status(200).json({ message: `User ${user.username} deleted successfully.` });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;

