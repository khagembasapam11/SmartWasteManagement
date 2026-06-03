import mongoose from "mongoose";
import Report from "./models/Report.js";
import User from "./models/User.js";
import SessionRoute from "./models/SessionRoute.js";
import jwt from "jsonwebtoken";

async function run() {
  await mongoose.connect("mongodb://localhost:27017/smartwaste");
  const admin = await User.findOne({ role: "admin" });
  const worker = await User.findOne({ name: "Ayush Sarkar" });
  
  const report = new Report({
    location: "Test Location 3",
    type: "dry",
    coords: { lat: 26.1, lng: 91.7 },
    status: "pending",
    reporter: admin._id
  });
  await report.save();
  
  const token = jwt.sign({ id: admin._id, role: "admin" }, "your_super_secret_jwt_key_change_this_in_production");
  
  const res = await fetch(`http://localhost:3001/api/reports/${report._id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ status: "assigned", assignedTo: worker._id })
  });
  
  console.log("Status Code:", res.status);
  const data = await res.json();
  console.log("Response assignedTo:", data.assignedTo?._id);
  
  const sessions = await SessionRoute.find({ assignedTo: worker._id });
  console.log("Sessions for worker:", JSON.stringify(sessions, null, 2));
  
  process.exit();
}
run();
