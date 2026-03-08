const mongoose = require("mongoose");

const collectionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  address: {
    address: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    city: { type: String },
    pincode: { type: String },
  },
  scheduledDate: { type: Date, required: true },
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
    default: "Mixed",
  },
  status: {
    type: String,
    enum: ["Scheduled", "Assigned", "In Progress", "Completed", "Cancelled"],
    default: "Scheduled",
  },
  assignedWorker: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  notes: { type: String },
  completedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

collectionSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Collection", collectionSchema);



