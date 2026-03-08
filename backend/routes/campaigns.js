const express = require("express");
const jwt = require("jsonwebtoken");
const Campaign = require("../models/Campaign");
const User = require("../models/User");
const router = express.Router();

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided or invalid format" });
  }
  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token", error: err.message });
  }
};

// Middleware to check role
const roleMiddleware = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

// Create a new campaign (Admin/Superadmin only)
router.post("/", authMiddleware, roleMiddleware(["admin", "superadmin"]), async (req, res) => {
  const { name, description, location, date, time, type, pointsAwarded } = req.body;

  if (!name || !description || !location || !date || !time || !type) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const campaign = new Campaign({
      name,
      description,
      location,
      date,
      time,
      type,
      organizer: req.user.id,
      pointsAwarded: pointsAwarded || 50,
    });

    await campaign.save();
    res.status(201).json({ message: "Campaign created successfully", campaign });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get all campaigns
router.get("/", async (req, res) => {
  try {
    const campaigns = await Campaign.find().populate("organizer", "name email");
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Join a campaign
router.post("/:id/join", authMiddleware, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const alreadyJoined = campaign.participants.some(
      (p) => p.user.toString() === req.user.id
    );

    if (alreadyJoined) {
      return res.status(400).json({ message: "You have already joined this campaign" });
    }

    campaign.participants.push({ user: req.user.id, status: "Joined" });
    await campaign.save();

    res.json({ message: "Joined campaign successfully", campaign });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get campaign participants (Admin/Superadmin only)
router.get("/:id/participants", authMiddleware, roleMiddleware(["admin", "superadmin"]), async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id).populate("participants.user", "name email totalPoints");
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    res.json(campaign.participants);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Mark participant as present and award points (Admin/Superadmin only)
router.post("/:id/mark-present", authMiddleware, roleMiddleware(["admin", "superadmin"]), async (req, res) => {
  const { userId } = req.body;
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    const participant = campaign.participants.find(
      (p) => p.user.toString() === userId
    );

    if (!participant) {
      return res.status(404).json({ message: "User is not a participant of this campaign" });
    }

    if (participant.status === "Present") {
      return res.status(400).json({ message: "User is already marked as present" });
    }

    participant.status = "Present";
    await campaign.save();

    // Award points to the user
    const user = await User.findById(userId);
    if (user) {
      const points = campaign.pointsAwarded || 50;
      user.totalPoints = (user.totalPoints || 0) + points;
      user.pointsRemaining = (user.pointsRemaining || 0) + points;
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // We assume points are awarded for a current/recent activity
      // In this app, monthlyPoints seems to be a running total for the current month
      // that might be reset elsewhere or checked by date (actually reports.js checks date)
      user.monthlyPoints = (user.monthlyPoints || 0) + points;
      
      await user.save();
    }

    res.json({ message: "User marked as present and points awarded", campaign });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
