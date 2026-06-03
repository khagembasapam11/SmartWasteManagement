import mongoose from "mongoose";
import SessionRoute from "./models/SessionRoute.js";

async function run() {
  await mongoose.connect("mongodb://localhost:27017/smartwaste");
  const sessions = await SessionRoute.find().populate("assignedTo");
  console.log("Sessions:", JSON.stringify(sessions.map(s => ({ status: s.status, reports: s.reports.length, assignedTo: s.assignedTo?.name })), null, 2));
  process.exit();
}
run();
