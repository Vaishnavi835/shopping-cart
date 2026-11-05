const express = require("express");
const router = express.Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");

// ─── POST /api/login ─── Login validation
router.post("/", async (req, res) => {
  const { emailId, password } = req.body;

  if (!emailId || !password) {
    return res.status(400).json({ message: "Email ID and password are required." });
  }

  // 🛡️ Type check: prevent NoSQL injection via object payloads like { "$gt": "" }
  if (typeof emailId !== "string" || typeof password !== "string") {
    return res.status(400).json({ message: "Invalid input format." });
  }

  try {
    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(404).json({ message: "User Not Registered." });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Password." });
    }

    // 🌟 UNIQUE FEATURE: Return JWT token for session management
    const token = jwt.sign(
      { id: user._id, email: user.emailId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        username: user.username,
        emailId: user.emailId,
        age: user.age,
      },
    });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;

