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
        username: user.username,
        emailId: user.emailId,
        age: user.age,
        budget: user.budget || 0,
        darkMode: user.darkMode || false,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── PUT /api/users ─── Update all editable fields (protected)
router.put("/", protect, async (req, res) => {
  const { username, age, password } = req.body;

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    if (!username || !age || !password) {
      return res.status(400).json({ message: "All fields (username, age, password) are required for PUT." });
    }

    user.username = username;
    user.age = age;
    user.password = password; // will be hashed by pre-save hook
    await user.save();

    return res.status(200).json({ message: "User profile fully updated successfully." });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── PATCH /api/users ─── Update selected fields (protected)
router.patch("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found." });

    const allowedFields = ["username", "age", "darkMode", "budget"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) user[field] = req.body[field];
    });

    // Handle password separately (needs hashing)
    if (req.body.password) {
      user.password = req.body.password;
    }

    await user.save();
    return res.status(200).json({ message: "User profile partially updated successfully." });
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

