import mongoose from "mongoose";
import SessionRoute from "./models/SessionRoute.js";
import User from "./models/User.js";

async function run() {
  await mongoose.connect("mongodb://localhost:27017/smartwaste");
  const u = await User.findOne({ name: "Ayush Sarkar" });
  if (!u) { console.log("No Ayush"); process.exit(1); }
  const sessions = await SessionRoute.find({ assignedTo: u._id });
  console.log(`Worker: ${u.name} (ID: ${u._id})`);
  console.log(`All Sessions:`, JSON.stringify(sessions, null, 2));
  process.exit();
}
run();
