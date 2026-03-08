const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  location: {
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ["Cleanup", "Awareness", "Tree Plantation", "Waste Collection", "Other"],
    default: "Cleanup",
  },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  participants: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      status: { type: String, enum: ["Joined", "Present"], default: "Joined" },
      joinedAt: { type: Date, default: Date.now },
    },
  ],
  pointsAwarded: { type: Number, default: 50 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Campaign || mongoose.model("Campaign", campaignSchema);
