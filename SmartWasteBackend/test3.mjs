import mongoose from "mongoose";
import SessionRoute from "./models/SessionRoute.js";
import User from "./models/User.js";

async function run() {
  await mongoose.connect("mongodb://localhost:27017/smartwaste");
  const sessions = await SessionRoute.find();
  const users = await User.find();
  console.log("Sessions:", JSON.stringify(sessions.map(s => ({ status: s.status, assignedTo: s.assignedTo })), null, 2));
  console.log("Workers:", users.filter(u => u.role === "worker").map(u => ({ id: u._id, name: u.name })));
  process.exit();
}
run();
