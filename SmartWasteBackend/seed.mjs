import mongoose from "mongoose";
import Report from "./models/Report.js";
import User from "./models/User.js";

async function run() {
  await mongoose.connect("mongodb://localhost:27017/smartwaste");
  const user = await User.findOne({ role: "user" });
  if (!user) { console.log("No user found"); process.exit(1); }
  
  const reports = [
    { reporter: user._id, type: "wet", location: "Downtown Park", coords: { lat: 26.1158, lng: 91.7086 }, status: "pending", imageUrl: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?auto=format&fit=crop&q=80&w=800" },
    { reporter: user._id, type: "dry", location: "Main Street", coords: { lat: 26.1160, lng: 91.7090 }, status: "pending", imageUrl: "https://images.unsplash.com/photo-1595278069441-2cf29f8005a4?auto=format&fit=crop&q=80&w=800" },
    { reporter: user._id, type: "wet", location: "Market Square", coords: { lat: 26.1170, lng: 91.7100 }, status: "pending", imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800" },
    { reporter: user._id, type: "hazardous", location: "Industrial Estate", coords: { lat: 26.1200, lng: 91.7150 }, status: "pending", imageUrl: "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&q=80&w=800" }
  ];
  await Report.insertMany(reports);
  console.log("Inserted pending reports");
  process.exit();
}
run();
