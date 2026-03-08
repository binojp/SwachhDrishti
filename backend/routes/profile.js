const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Collection = require("../models/Collection");
const jwt = require("jsonwebtoken");

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

// Add/Update Home Address
router.post("/home", authMiddleware, async (req, res) => {
  try {
    const { address, latitude, longitude, city, pincode } = req.body;
    
    if (!address) {
      return res.status(400).json({ message: "Address is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.homeAddress = {
      address,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      city: city || user.city,
      pincode,
    };

    await user.save();
    res.json({ message: "Home address updated successfully", homeAddress: user.homeAddress });
  } catch (err) {
    console.error("Error updating home address:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get Home Address
router.get("/home", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("homeAddress");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ homeAddress: user.homeAddress || null });
  } catch (err) {
    console.error("Error fetching home address:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Schedule Waste Collection
router.post("/collection", authMiddleware, async (req, res) => {
  try {
    const { scheduledDate, wasteType, notes } = req.body;
    
    if (!scheduledDate) {
      return res.status(400).json({ message: "Scheduled date is required" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.homeAddress || !user.homeAddress.address) {
      return res.status(400).json({ message: "Please add your home address first" });
    }

    const collection = new Collection({
      user: req.user.id,
      address: user.homeAddress,
      scheduledDate: new Date(scheduledDate),
      wasteType: wasteType || "Mixed",
      notes,
      status: "Scheduled",
    });

    await collection.save();
    res.status(201).json({ message: "Collection scheduled successfully", collection });
  } catch (err) {
    console.error("Error scheduling collection:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get User's Collections
router.get("/collections", authMiddleware, async (req, res) => {
  try {
    const collections = await Collection.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(collections);
  } catch (err) {
    console.error("Error fetching collections:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update Collection Status (for user)
router.patch("/collection/:id", authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    if (collection.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (status) {
      collection.status = status;
      if (status === "Completed") {
        collection.completedAt = new Date();
      }
    }

    await collection.save();
    res.json(collection);
  } catch (err) {
    console.error("Error updating collection:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;



