const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["user", "admin", "superadmin", "worker", "industry"],
    default: "user",
  },
  city: { type: String },
  homeAddress: {
    address: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    city: { type: String },
    pincode: { type: String },
  },
  totalPoints: { type: Number, default: 0 },
  pointsRemaining: { type: Number, default: 0 },
  monthlyPoints: { type: Number, default: 0 },
  redeemedRewards: [
    {
      title: { type: String, required: true },
      description: { type: String, required: true },
      points: { type: Number, required: true },
      redeemedAt: { type: Date, default: Date.now },
    },
  ],
  educationProgress: {
    completedModules: [{ type: mongoose.Schema.Types.ObjectId, ref: "EducationalContent" }],
    quizzesTaken: [{
      quizId: { type: mongoose.Schema.Types.ObjectId, ref: "Quiz" },
      score: { type: Number },
      pointsEarned: { type: Number },
      completedAt: { type: Date, default: Date.now }
    }],
    learningStreak: { type: Number, default: 0 },
    lastActivityDate: { type: Date }
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
