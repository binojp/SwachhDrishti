const express = require("express");
const router = express.Router();
const Collection = require("../models/Collection");
const User = require("../models/User");
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

const roleMiddleware = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

// Get All Collections (Admin/Worker)
router.get("/", authMiddleware, roleMiddleware(["admin", "superadmin", "worker"]), async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    
    if (status) {
      query.status = status;
    }

    const collections = await Collection.find(query)
      .populate("user", "name email")
      .populate("assignedWorker", "name email")
      .sort({ createdAt: -1 });
    
    res.json(collections);
  } catch (err) {
    console.error("Error fetching collections:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get Available Collections (Not assigned - for workers)
router.get("/available", authMiddleware, roleMiddleware(["worker"]), async (req, res) => {
  try {
    const collections = await Collection.find({
      $or: [
        { assignedWorker: { $exists: false } },
        { assignedWorker: null },
        { status: "Scheduled" }
      ]
    })
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    
    res.json(collections);
  } catch (err) {
    console.error("Error fetching available collections:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get Single Collection
router.get("/:id", authMiddleware, roleMiddleware(["admin", "superadmin", "worker"]), async (req, res) => {
  try {
    const collection = await Collection.findById(req.params.id)
      .populate("user", "name email")
      .populate("assignedWorker", "name email");
    
    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }
    
    res.json(collection);
  } catch (err) {
    console.error("Error fetching collection:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update Collection (Admin/Worker)
router.put("/:id", authMiddleware, roleMiddleware(["admin", "superadmin", "worker"]), async (req, res) => {
  try {
    const { status, assignedWorker, notes } = req.body;
    const collection = await Collection.findById(req.params.id);
    
    if (!collection) {
      return res.status(404).json({ message: "Collection not found" });
    }

    // If worker is self-assigning, use their own ID
    let finalAssignedWorker = assignedWorker;
    if (req.user.role === "worker" && (assignedWorker === "self" || assignedWorker === req.user.id)) {
      finalAssignedWorker = req.user.id;
    }

    if (status) {
      collection.status = status;
      if (status === "Completed") {
        collection.completedAt = new Date();
      }
    }
    if (finalAssignedWorker) {
      collection.assignedWorker = finalAssignedWorker;
      if (collection.status === "Scheduled") {
        collection.status = "Assigned";
      }
    }
    if (notes) {
      collection.notes = notes;
    }

    await collection.save();
    const populated = await Collection.findById(collection._id)
      .populate("user", "name email")
      .populate("assignedWorker", "name email");
    res.json(populated);
  } catch (err) {
    console.error("Error updating collection:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Add Worker (Admin/Superadmin only)
router.post("/worker", authMiddleware, roleMiddleware(["admin", "superadmin"]), async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const bcrypt = require("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const worker = new User({
      name,
      email,
      password: hashedPassword,
      role: "worker",
    });

    await worker.save();
    res.status(201).json({ message: "Worker created successfully", worker: { id: worker._id, name, email, role: worker.role } });
  } catch (err) {
    console.error("Error creating worker:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get All Workers
router.get("/workers/all", authMiddleware, roleMiddleware(["admin", "superadmin"]), async (req, res) => {
  try {
    const workers = await User.find({ role: "worker" }).select("name email _id createdAt");
    res.json(workers);
  } catch (err) {
    console.error("Error fetching workers:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;

