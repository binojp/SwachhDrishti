const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true, enum: ["report", "cleanup"] },
  wasteType: {
    type: String,
    enum: [
      "plastic",
      "organic",
      "glass",
      "metal",
      "paper",
      "electronics",
      "hazardous",
      "Mixed",
      "Other",
    ],
    default: "Other",
  },
  latitude: { type: Number },
  longitude: { type: Number },
  location: { type: String, default: "Location not provided" },
  mediaUrls: [{ type: String, required: true }],
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  status: {
    type: String,
    default: "Reported",
    enum: ["Reported", "Pending", "Review", "Resolved", "Rejected"],
  },
  severity: {
    type: String,
    default: "Not specified",
    enum: ["Low", "Medium", "High", "Not specified"],
  },
  pointsAwarded: { type: Number, default: 0 },
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  photoVerified: { type: Boolean, default: false },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  verifiedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  replies: [
    {
      mediaUrls: [{ type: String, required: true }],
      type: { type: String, required: true, enum: ["before", "after"] },
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      uploadedAt: { type: Date, default: Date.now },
    },
  ],
});

reportSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports =
  mongoose.models.Report || mongoose.model("Report", reportSchema);
