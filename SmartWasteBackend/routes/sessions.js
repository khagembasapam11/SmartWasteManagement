import express from "express";
import SessionRoute from "../models/SessionRoute.js";
import Report from "../models/Report.js";
import User from "../models/User.js";
import { protect, authorize } from "../middleware/auth.js";

const router = express.Router();

// Helper to calculate distance
const getDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Get all sessions
router.get("/", protect, async (req, res) => {
  try {
    const { status, assignedTo, sessionType } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (sessionType) filter.sessionType = sessionType;

    const sessions = await SessionRoute.find(filter)
      .populate("assignedTo", "name email")
      .populate({
        path: "reports",
        populate: { path: "reporter", select: "name email" },
      })
      .sort({ createdAt: -1 });

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Generate routes from pending reports
router.post("/generate", protect, authorize("admin"), async (req, res) => {
  try {
    const { sessionType } = req.body;
    if (!["morning", "evening"].includes(sessionType)) {
      return res.status(400).json({ error: "Invalid session type" });
    }

    // Find all pending reports
    const pendingReports = await Report.find({ status: "pending" });
    
    // Simple clustering logic: group reports within 5km
    const clusters = [];
    const visited = new Set();

    for (const report of pendingReports) {
      if (visited.has(report._id.toString())) continue;
      
      const cluster = [report];
      visited.add(report._id.toString());
      
      let sumLat = report.coords.lat;
      let sumLng = report.coords.lng;

      for (const other of pendingReports) {
        if (visited.has(other._id.toString())) continue;
        const dist = getDistance(report.coords.lat, report.coords.lng, other.coords.lat, other.coords.lng);
        if (dist <= 5) { // 5km radius
          cluster.push(other);
          visited.add(other._id.toString());
          sumLat += other.coords.lat;
          sumLng += other.coords.lng;
        }
      }

      clusters.push({
        reports: cluster.map(r => r._id),
        centerCoords: {
          lat: sumLat / cluster.length,
          lng: sumLng / cluster.length,
        }
      });
    }

    const workers = await User.find({ role: "worker" });
    let workerIndex = 0;

    const createdSessions = [];
    for (const cluster of clusters) {
      let assignedTo = null;
      let status = "pending";
      
      if (workers.length > 0) {
        assignedTo = workers[workerIndex]._id;
        status = "active";
        workerIndex = (workerIndex + 1) % workers.length;
      }

      const session = new SessionRoute({
        sessionType,
        reports: cluster.reports,
        centerCoords: cluster.centerCoords,
        assignedTo,
        status
      });
      await session.save();
      createdSessions.push(session);
      
      const updateData = { status: "assigned" };
      if (assignedTo) updateData.assignedTo = assignedTo;

      await Report.updateMany(
        { _id: { $in: cluster.reports } },
        { $set: updateData } 
      );
    }

    res.json(createdSessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Claim nearest route
router.post("/claim-nearest", protect, async (req, res) => {
  try {
    const { lat, lng } = req.body;
    // We allow lat/lng to be optional so testing without GPS works

    // Find all pending sessions
    const pendingSessions = await SessionRoute.find({ status: "pending" });
    if (pendingSessions.length === 0) {
      return res.status(404).json({ error: "No pending routes available" });
    }

    let nearest = pendingSessions[0];
    
    if (lat && lng) {
      let minDistance = Infinity;
      for (const session of pendingSessions) {
        const dist = getDistance(lat, lng, session.centerCoords.lat, session.centerCoords.lng);
        if (dist < minDistance) {
          minDistance = dist;
          nearest = session;
        }
      }
    }

    // Claim it
    nearest.status = "active";
    nearest.assignedTo = req.user.id;
    await nearest.save();

    // Update reports to point to this worker
    await Report.updateMany(
      { _id: { $in: nearest.reports } },
      { $set: { assignedTo: req.user.id } }
    );

    const populated = await SessionRoute.findById(nearest._id)
      .populate("assignedTo", "name email")
      .populate("reports");

    res.json(populated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Complete Session (Dumped)
router.patch("/:id/complete", protect, async (req, res) => {
  try {
    const session = await SessionRoute.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    session.status = "completed";
    await session.save();

    // Mark all reports as completed
    await Report.updateMany(
      { _id: { $in: session.reports } },
      { $set: { status: "completed", completedAt: new Date() } }
    );

    // Award points to worker
    const worker = await User.findById(req.user.id);
    if (worker) {
      worker.points = (worker.points || 0) + (100 * session.reports.length); // Huge bonus for full route
      await worker.save();
    }

    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
