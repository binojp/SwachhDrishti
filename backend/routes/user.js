const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Report = require("../models/Report");
const jwt = require("jsonwebtoken");

/* ================= AUTH MIDDLEWARE ================= */
const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
};

/* ================= POINT CALC ================= */
const calculateReportPoints = (report) => {
  const wasteTypePoints = {
    Plastic: 30,
    Electronic: 50,
    Metal: 25,
    Glass: 20,
    Paper: 15,
    Organic: 10,
    Mixed: 15,
  };

  const severityMultiplier = {
    Low: 1,
    Medium: 1.5,
    High: 2,
    "Not specified": 1,
  };

  const base = wasteTypePoints[report.wasteType] || 15;
  const mult = severityMultiplier[report.severity] || 1;

  return Math.round(base * mult);
};

/* ================= GET USER POINTS ================= */
router.get("/", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const reports = await Report.find({ user: req.user.id });

    // Calculate total points from reports
    const calculatedTotal = reports.reduce(
      (sum, r) => sum + (r.pointsAwarded || calculateReportPoints(r)),
      0
    );

    // Calculate monthly points
    const now = new Date();
    const calculatedMonthly = reports.reduce((sum, r) => {
      const d = new Date(r.createdAt);
      return d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
        ? sum + (r.pointsAwarded || calculateReportPoints(r))
        : sum;
    }, 0);

    // Calculate redeemed points
    const redeemedPoints = (user.redeemedRewards || []).reduce(
      (sum, r) => sum + r.points,
      0
    );

    // Sync points to user model
    // Total points is the sum of all points ever earned
    user.totalPoints = calculatedTotal;
    user.monthlyPoints = calculatedMonthly;
    // Points remaining is total earned minus sum of redeemed costs
    user.pointsRemaining = Math.max(0, calculatedTotal - redeemedPoints);
    await user.save();

    res.json({
      totalPoints: user.totalPoints,
      monthlyPoints: user.monthlyPoints,
      pointsRemaining: user.pointsRemaining,
      redeemedRewards: user.redeemedRewards || [],
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

/* ================= REDEEM REWARD ================= */
router.patch("/", authMiddleware, async (req, res) => {
  try {
    const { reward } = req.body;
    const user = await User.findById(req.user.id);

    if (!reward || !reward.points || !reward.title) {
      return res.status(400).json({ message: "Invalid reward" });
    }

    if (user.pointsRemaining < reward.points) {
      return res.status(400).json({ message: "Insufficient points" });
    }

    // Update balances
    user.pointsRemaining -= reward.points;
    // DO NOT subtract from totalPoints, as that represents lifetime earnings for rankings

    // Add to history
    user.redeemedRewards.push({
      title: reward.title,
      description: reward.description || "",
      points: reward.points,
      redeemedAt: new Date(),
    });

    await user.save();

    // Return the updated data to the frontend
    res.json({
      totalPoints: user.totalPoints,
      pointsRemaining: user.pointsRemaining,
      redeemedRewards: user.redeemedRewards, // Ensure this is sent!
    });
  } catch (err) {
    res.status(500).json({ message: "Redemption failed" });
  }
});

module.exports = router;
