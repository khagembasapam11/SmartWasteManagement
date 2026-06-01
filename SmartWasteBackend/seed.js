import mongoose from "mongoose";
import User from "./models/User.js";
import Report from "./models/Report.js";
import Bin from "./models/Bin.js";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/smartwaste";

async function seedDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✓ Connected to MongoDB");

    // Clear existing data
    await User.deleteMany({});
    await Report.deleteMany({});
    await Bin.deleteMany({});
    console.log("✓ Cleared existing data");

    // Create users
    const adminUser = await User.create({
      name: "Admin User",
      email: "admin@example.com",
      password: "admin123",
      role: "admin",
      points: 500,
    });

    const citizen1 = await User.create({
      name: "Anita S.",
      email: "anita@example.com",
      password: "user123",
      role: "user",
      points: 120,
    });

    const citizen2 = await User.create({
      name: "John D.",
      email: "john@example.com",
      password: "user123",
      role: "user",
      points: 85,
    });

    const worker1 = await User.create({
      name: "Ravi Kumar",
      email: "ravi@example.com",
      password: "worker123",
      role: "worker",
      points: 300,
    });

    const worker2 = await User.create({
      name: "Aisha Khan",
      email: "aisha@example.com",
      password: "worker123",
      role: "worker",
      points: 250,
    });

    console.log("✓ Created users");

    // Create bins
    const bin1 = await Bin.create({
      name: "Central Park Bin",
      fill: 72,
      type: "wet",
      coords: { lat: 12.97, lng: 77.59 },
      location: "Central Park",
      capacity: 100,
    });

    const bin2 = await Bin.create({
      name: "Tech Park East",
      fill: 45,
      type: "dry",
      coords: { lat: 12.98, lng: 77.6 },
      location: "Tech Park",
      capacity: 100,
    });

    const bin3 = await Bin.create({
      name: "Riverside",
      fill: 90,
      type: "hazardous",
      coords: { lat: 12.96, lng: 77.58 },
      location: "Riverside Area",
      capacity: 100,
    });

    const bin4 = await Bin.create({
      name: "City Mall",
      fill: 30,
      type: "dry",
      coords: { lat: 12.99, lng: 77.61 },
      location: "City Mall",
      capacity: 100,
    });

    console.log("✓ Created bins");

    // Create reports
    const report1 = await Report.create({
      location: "MG Road, Block A",
      type: "wet",
      status: "pending",
      reporter: citizen1._id,
      coords: { lat: 12.97, lng: 77.59 },
      description: "Overflowing food waste near bus stop.",
      createdAt: new Date("2026-05-03"),
    });

    const report2 = await Report.create({
      location: "Park Street 12",
      type: "hazardous",
      status: "assigned",
      reporter: citizen2._id,
      assignedTo: worker1._id,
      coords: { lat: 12.98, lng: 77.6 },
      description: "Broken batteries dumped on sidewalk.",
      createdAt: new Date("2026-05-03"),
    });

    const report3 = await Report.create({
      location: "5th Ave Plaza",
      type: "dry",
      status: "completed",
      reporter: citizen1._id,
      assignedTo: worker2._id,
      coords: { lat: 12.96, lng: 77.58 },
      createdAt: new Date("2026-05-02"),
      completedAt: new Date("2026-05-04"),
    });

    const report4 = await Report.create({
      location: "Lakeview Apartments",
      type: "wet",
      status: "assigned",
      reporter: citizen2._id,
      assignedTo: worker1._id,
      coords: { lat: 12.99, lng: 77.61 },
      createdAt: new Date("2026-05-04"),
    });

    console.log("✓ Created reports");

    // Update worker assigned tasks
    worker1.assignedTasks = [report2._id, report4._id];
    await worker1.save();

    worker2.assignedTasks = [report3._id];
    await worker2.save();

    console.log("✓ Updated worker tasks");

    console.log("\n✅ Database seeded successfully!");
    console.log("\nTest credentials:");
    console.log("Admin: admin@example.com / admin123");
    console.log("User: anita@example.com / user123");
    console.log("Worker: ravi@example.com / worker123");

    await mongoose.disconnect();
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
}

seedDatabase();
