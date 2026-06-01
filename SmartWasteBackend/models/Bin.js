import mongoose from "mongoose";

const binSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    fill: { type: Number, default: 0, min: 0, max: 100 },
    type: {
      type: String,
      enum: ["wet", "dry", "hazardous"],
      required: true,
    },
    coords: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    location: String,
    lastEmptied: Date,
    capacity: { type: Number, default: 100 }, // in liters or units
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Index for geospatial queries
binSchema.index({ "coords.lat": 1, "coords.lng": 1 });

export default mongoose.model("Bin", binSchema);
