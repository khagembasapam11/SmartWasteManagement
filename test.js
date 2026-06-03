import mongoose from "mongoose";
import SessionRoute from "./SmartWasteBackend/models/SessionRoute.js";
import User from "./SmartWasteBackend/models/User.js";

async function run() {
  await mongoose.connect("mongodb://localhost:27017/smartwaste");
  const sessions = await SessionRoute.find();
  console.log("Sessions:", sessions);
  process.exit();
}
run();
