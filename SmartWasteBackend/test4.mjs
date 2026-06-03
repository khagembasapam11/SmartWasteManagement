import mongoose from "mongoose";
import SessionRoute from "./models/SessionRoute.js";
import User from "./models/User.js";

async function run() {
  await mongoose.connect("mongodb://localhost:27017/smartwaste");
  const users = await User.find({ role: "worker" });
  for (const u of users) {
    const sessions = await SessionRoute.find({ assignedTo: u._id, status: "active" });
    console.log(`Worker: ${u.name} (ID: ${u._id})`);
    console.log(`Active Sessions:`, JSON.stringify(sessions, null, 2));
  }
  process.exit();
}
run();
