import express from "express";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Get current user profile
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email role points assignedTasks createdAt"
    );

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user by ID
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "name email role points createdAt"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update user profile (own profile only)
router.patch("/", protect, async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (name) user.name = name;
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ error: "Email already in use" });
      }
      user.email = email;
    }

    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      points: user.points,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add points to user (internal use - for rewards, referrals, etc.)
router.post("/:id/add-points", protect, async (req, res) => {
  try {
    const { points } = req.body;

    if (typeof points !== "number" || points < 0) {
      return res.status(400).json({ error: "Invalid points value" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.points = (user.points || 0) + points;
    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      points: user.points,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
