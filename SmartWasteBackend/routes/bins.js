import express from "express";
import Bin from "../models/Bin.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all bins
router.get("/", async (req, res) => {
  try {
    const { type } = req.query;
    const filter = {};

    if (type) filter.type = type;

    const bins = await Bin.find(filter).sort({ fill: -1 });
    res.json(bins);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single bin
router.get("/:id", async (req, res) => {
  try {
    const bin = await Bin.findById(req.params.id);

    if (!bin) {
      return res.status(404).json({ error: "Bin not found" });
    }

    res.json(bin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create bin (protected - admin only)
router.post("/", protect, authorize("admin"), async (req, res) => {
  try {
    const { name, type, coords, location, capacity } = req.body;

    if (!name || !type || !coords) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const bin = new Bin({
      name,
      type,
      coords,
      location,
      capacity,
    });

    await bin.save();
    res.status(201).json(bin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update bin fill level (protected - admin/worker)
router.patch("/:id", protect, authorize("admin", "worker"), async (req, res) => {
  try {
    const { fill, lastEmptied } = req.body;
    const bin = await Bin.findById(req.params.id);

    if (!bin) {
      return res.status(404).json({ error: "Bin not found" });
    }

    if (fill !== undefined) {
      bin.fill = Math.max(0, Math.min(100, fill));
    }

    if (lastEmptied) {
      bin.lastEmptied = lastEmptied;
    }

    await bin.save();
    res.json(bin);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete bin (protected - admin only)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const bin = await Bin.findByIdAndDelete(req.params.id);

    if (!bin) {
      return res.status(404).json({ error: "Bin not found" });
    }

    res.json({ message: "Bin deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
