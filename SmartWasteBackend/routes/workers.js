import express from "express";
import User from "../models/User.js";
import Report from "../models/Report.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Get all workers
router.get("/", protect, authorize("admin"), async (req, res) => {
  try {
    const workers = await User.find({ role: "worker" }).select(
      "name email points assignedTasks createdAt"
    );

    res.json(workers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get worker by ID with assigned tasks
router.get("/:id", protect, async (req, res) => {
  try {
    const worker = await User.findById(req.params.id)
      .select("name email role points assignedTasks")
      .populate({
        path: "assignedTasks",
        select: "location type status coords createdAt completedAt description reporter assignedTo",
        populate: [
          { path: "reporter", select: "name email" },
          { path: "assignedTo", select: "name email" },
        ],
      });

    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ error: "Worker not found" });
    }

    res.json(worker);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign task to worker (admin only)
router.post("/:workerId/assign/:reportId", protect, authorize("admin"), async (req, res) => {
  try {
    const worker = await User.findById(req.params.workerId);
    const report = await Report.findById(req.params.reportId);

    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ error: "Worker not found" });
    }

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    report.assignedTo = worker._id;
    report.status = "assigned";
    await report.save();

    if (!worker.assignedTasks.includes(report._id)) {
      worker.assignedTasks.push(report._id);
      await worker.save();
    }

    res.json({
      message: "Task assigned",
      report: await report.populate([
        { path: "reporter", select: "name email" },
        { path: "assignedTo", select: "name email" },
      ]),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unassign task from worker (admin only)
router.post("/:workerId/unassign/:reportId", protect, authorize("admin"), async (req, res) => {
  try {
    const worker = await User.findById(req.params.workerId);
    const report = await Report.findById(req.params.reportId);

    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ error: "Worker not found" });
    }

    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }

    report.assignedTo = null;
    report.status = "pending";
    await report.save();

    worker.assignedTasks = worker.assignedTasks.filter(
      (taskId) => taskId.toString() !== report._id.toString()
    );
    await worker.save();

    res.json({ message: "Task unassigned" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
