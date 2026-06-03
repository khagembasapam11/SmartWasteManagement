import mongoose from "mongoose";

const sessionRouteSchema = new mongoose.Schema(
  {
    sessionType: {
      type: String,
      enum: ["morning", "evening"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "active", "collected", "completed"],
      default: "pending",
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reports: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Report",
      },
    ],
    centerCoords: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model("SessionRoute", sessionRouteSchema);
