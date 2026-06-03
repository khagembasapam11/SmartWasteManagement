import express from "express";
import Report from "../models/Report.js";
import User from "../models/User.js";
import SessionRoute from "../models/SessionRoute.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all reports (with filters)
router.get("/", async (req, res) => {
  try {
    const { status, type, reporter, assignedTo } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;
    if (reporter) filter.reporter = reporter;
    if (assignedTo) filter.assignedTo = assignedTo;

    const reports = await Report.find(filter)
      .populate("reporter", "name email")
      .populate("assignedTo", "name email")
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single report
router.get("/:id", async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("reporter", "name email")
      .populate("assignedTo", "name email");

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create report (protected - any authenticated user)
router.post("/", protect, async (req, res) => {
  try {
    const { location, type, description, coords, photo } = req.body;

    if (!location || !type || !coords) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const report = new Report({
      location,
      type,
      description,
      coords,
      photo,
      reporter: req.user.id,
    });

    await report.save();

    // Award points to user
    const user = await User.findById(req.user.id);
    if (user) {
      user.points = (user.points || 0) + 20;
      await user.save();
    }

    const populatedReport = await report.populate("reporter", "name email");
    res.status(201).json(populatedReport);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update report status (protected - admin or assigned worker)
router.patch("/:id", protect, async (req, res) => {
  try {
    const { status, assignedTo } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    // Only admin, the assigned worker, or the reporter can update
    const isAuthorized =
      req.user.role === "admin" ||
      report.assignedTo?.toString() === req.user.id ||
      report.reporter?.toString() === req.user.id;

    if (!isAuthorized) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const wasAlreadyCompleted = report.status === "completed";

    if (status) {
      report.status = status;
      if (status === "completed" && !wasAlreadyCompleted) {
        report.completedAt = new Date();
        
        // Automatic resolution bonus for the reporter
        if (report.reporter) {
          const reporter = await User.findById(report.reporter);
          if (reporter) {
            reporter.points = (reporter.points || 0) + 50;
            await reporter.save();
          }
        }
      }
    }

    if (assignedTo && req.user.role === "admin") {
      report.assignedTo = assignedTo;
      report.status = "assigned";

      let activeSession = await SessionRoute.findOne({ assignedTo, status: "active" });
      if (!activeSession) {
        activeSession = await SessionRoute.findOne({ assignedTo, status: "pending" });
      }

      if (activeSession) {
        if (!activeSession.reports.includes(report._id)) {
          activeSession.reports.push(report._id);
          const n = activeSession.reports.length;
          activeSession.centerCoords.lat = ((activeSession.centerCoords.lat * (n - 1)) + report.coords.lat) / n;
          activeSession.centerCoords.lng = ((activeSession.centerCoords.lng * (n - 1)) + report.coords.lng) / n;
          await activeSession.save();
        }
      } else {
        const newSession = new SessionRoute({
          sessionType: "morning",
          reports: [report._id],
          centerCoords: report.coords,
          assignedTo,
          status: "active"
        });
        await newSession.save();
      }
    }

    await report.save();
    const updated = await report.populate("reporter assignedTo", "name email");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete report (protected - admin only)
router.delete("/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const report = await Report.findByIdAndDelete(req.params.id);

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.json({ message: "Report deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reward worker (protected - admin only)
router.post("/:id/reward", protect, authorize("admin"), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ error: "Report not found" });
    if (report.status !== "completed") return res.status(400).json({ error: "Report must be completed to reward" });
    if (report.rewarded) return res.status(400).json({ error: "Already rewarded" });

    report.rewarded = true;
    await report.save();

    if (report.assignedTo) {
      const worker = await User.findById(report.assignedTo);
      if (worker) {
        worker.points = (worker.points || 0) + 50;
        await worker.save();
      }
    }

    const updated = await report.populate("reporter assignedTo", "name email");
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
