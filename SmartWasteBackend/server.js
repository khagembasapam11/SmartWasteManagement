import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import reportRoutes from "./routes/reports.js";
import binRoutes from "./routes/bins.js";
import workerRoutes from "./routes/workers.js";
import userRoutes from "./routes/users.js";
import sessionRoutes from "./routes/sessions.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/smartwaste";

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✓ MongoDB connected"))
  .catch((err) => {
    console.error("✗ MongoDB connection error:", err.message);
    // Don't exit process in serverless environments, let Mongoose handle it
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  });

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/bins", binRoutes);
app.use("/api/workers", workerRoutes);
app.use("/api/users", userRoutes);
app.use("/api/sessions", sessionRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date() });
});

import Report from "./models/Report.js";
import User from "./models/User.js";
import Bin from "./models/Bin.js";

// Public stats
app.get("/api/stats", async (req, res) => {
  try {
    const [totalReports, completedReports, workers, bins] = await Promise.all([
      Report.countDocuments(),
      Report.countDocuments({ status: "completed" }),
      User.countDocuments({ role: "worker" }),
      Bin.countDocuments()
    ]);
    const resolvedPercent = totalReports === 0 ? "0%" : `${Math.round((completedReports / totalReports) * 100)}%`;
    res.json({
      reports: totalReports,
      resolved: resolvedPercent,
      workers: workers,
      bins: bins
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
  });
});

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  });
}

export default app;
