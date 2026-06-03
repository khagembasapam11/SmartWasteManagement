import mongoose from "mongoose";
import Report from "./models/Report.js";

async function run() {
  await mongoose.connect("mongodb://localhost:27017/smartwaste");
  const counts = await Report.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
  console.log("Report Counts:", counts);
  process.exit();
}
run();
