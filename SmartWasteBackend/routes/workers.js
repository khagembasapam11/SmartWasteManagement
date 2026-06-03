import express from "express";
import User from "../models/User.js";
import Report from "../models/Report.js";
import SessionRoute from "../models/SessionRoute.js";
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

    const oldSession = await SessionRoute.findOne({ reports: report._id });
    if (oldSession && oldSession.assignedTo?.toString() !== worker._id.toString()) {
      oldSession.reports = oldSession.reports.filter(id => id.toString() !== report._id.toString());
      if (oldSession.reports.length === 0) await SessionRoute.findByIdAndDelete(oldSession._id);
      else await oldSession.save();
    }

    let activeSession = await SessionRoute.findOne({ assignedTo: worker._id, status: "active" });
    if (!activeSession) activeSession = await SessionRoute.findOne({ assignedTo: worker._id, status: "pending" });
    
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
        assignedTo: worker._id,
        status: "active"
      });
      await newSession.save();
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

    const oldSession = await SessionRoute.findOne({ reports: report._id });
    if (oldSession) {
      oldSession.reports = oldSession.reports.filter(id => id.toString() !== report._id.toString());
      if (oldSession.reports.length === 0) await SessionRoute.findByIdAndDelete(oldSession._id);
      else await oldSession.save();
    }

    res.json({ message: "Task unassigned" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
