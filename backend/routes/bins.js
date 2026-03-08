const express = require("express");
const router = express.Router();
const Bin = require("../models/Bin");
const jwt = require("jsonwebtoken");
const axios = require("axios");

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

const roleMiddleware = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

// Optimized Route - place before /:id
router.get("/optimized-route", authMiddleware, async (req, res) => {
  try {
    const bins = await Bin.find({ level: { $gte: 90 } })
      .sort({ level: -1 }); // highest first

    res.json(bins);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Route optimization failed" });
  }
});

// Get All Bins (Public)
router.get("/", async (req, res) => {
  try {
    const bins = await Bin.find({}).sort({ createdAt: -1 });
    res.json(bins);
  } catch (err) {
    console.error("Error fetching bins:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get Single Bin
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const bin = await Bin.findById(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: "Bin not found" });
    }
    res.json(bin);
  } catch (err) {
    console.error("Error fetching bin:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create Bin (Admin/Superadmin only)
router.post("/", authMiddleware, roleMiddleware(["admin", "superadmin"]), async (req, res) => {
  try {
    const { name, placeName, latitude, longitude, level, capacity, wasteType } = req.body;

    if (!name || !placeName || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ message: "Name, place name, latitude, and longitude are required" });
    }

    const newBin = new Bin({
      name,
      placeName,
      latitude,
      longitude,
      level: level || 0,
      capacity: capacity || 100,
      wasteType: wasteType || "Mixed",
    });

    await newBin.save();
    res.status(201).json({ message: "Bin created successfully", bin: newBin });
  } catch (err) {
    console.error("Error creating bin:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update Bin (Admin/Superadmin only)
router.put("/:id", authMiddleware, roleMiddleware(["admin", "superadmin"]), async (req, res) => {
  try {
    const { name, placeName, latitude, longitude, level, capacity, wasteType } = req.body;
    const bin = await Bin.findById(req.params.id);

    if (!bin) {
      return res.status(404).json({ message: "Bin not found" });
    }

    if (name) bin.name = name;
    if (placeName) bin.placeName = placeName;
    if (latitude !== undefined) bin.latitude = latitude;
    if (longitude !== undefined) bin.longitude = longitude;
    if (level !== undefined) bin.level = level;
    if (capacity !== undefined) bin.capacity = capacity;
    if (wasteType) bin.wasteType = wasteType;

    await bin.save();
    res.json({ message: "Bin updated successfully", bin });
  } catch (err) {
    console.error("Error updating bin:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete Bin (Admin/Superadmin only)
router.delete("/:id", authMiddleware, roleMiddleware(["admin", "superadmin"]), async (req, res) => {
  try {
    const bin = await Bin.findByIdAndDelete(req.params.id);
    if (!bin) {
      return res.status(404).json({ message: "Bin not found" });
    }
    res.json({ message: "Bin deleted successfully" });
  } catch (err) {
    console.error("Error deleting bin:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
router.get("/optimized-route", authMiddleware, async (req, res) => {
  try {
    // Only fetch bins that are critical (>= 80% or 90%)
    const bins = await Bin.find({ level: { $gte: 80 } });
    
    // Simple logic: sort by those closest to overflow first
    const sortedBins = bins.sort((a, b) => b.level - a.level);

    res.json(sortedBins);
  } catch (err) {
    res.status(500).json({ message: "Route optimization failed" });
  }
});
module.exports = router;
