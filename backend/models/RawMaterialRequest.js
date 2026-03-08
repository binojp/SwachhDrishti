const mongoose = require("mongoose");

const rawMaterialRequestSchema = new mongoose.Schema({
  industry: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  materialType: {
    type: String,
    required: true,
    enum: ["Plastic", "Glass", "Metal", "Paper", "Organic", "Other"],
  },
  quantity: {
    type: String, // e.g., "500kg", "2 tons"
    required: true,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: ["Pending", "Accepted", "Transferred", "Rejected"],
    default: "Pending",
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.models.RawMaterialRequest || mongoose.model("RawMaterialRequest", rawMaterialRequestSchema);
