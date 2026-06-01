import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    location: { type: String, required: true },
    type: {
      type: String,
      enum: ["wet", "dry", "hazardous"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "assigned", "collected", "completed"],
      default: "pending",
    },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    description: String,
    photo: String, // URL to uploaded photo
    coords: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    createdAt: { type: Date, default: Date.now },
    completedAt: Date,
    rewarded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for location-based queries (useful for geospatial searches)
reportSchema.index({ "coords.lat": 1, "coords.lng": 1 });
reportSchema.index({ status: 1 });

export default mongoose.model("Report", reportSchema);
