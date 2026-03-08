const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const Report = require("../models/Report");
const User = require("../models/User");
const Collection = require("../models/Collection");
const { analyzeWasteImage } = require("../utils/aiService");
const router = express.Router();

// Helper function to calculate points based on waste type and severity
const calculatePoints = (wasteType, severity) => {
  // Base points by waste type
  const wasteTypePoints = {
    Plastic: 30,
    Electronics: 50,
    Metal: 25,
    Glass: 20,
    Paper: 15,
    Organic: 10,
    Mixed: 15,
    Other: 15,
  };

  // Multiplier by severity
  const severityMultiplier = {
    Low: 1,
    Medium: 1.5,
    High: 2,
    "Not specified": 1,
  };

  const basePoints = wasteTypePoints[wasteType] || 15;
  const multiplier = severityMultiplier[severity] || 1;
  return Math.round(basePoints * multiplier);
};

// Helper function to find an available worker
const findAvailableWorker = async () => {
  try {
    // Get all workers
    const allWorkers = await User.find({ role: "worker" }).select("_id name email");
    
    if (allWorkers.length === 0) {
      return null; // No workers available
    }

    // Find workers with no active assignments
    const availableWorkers = [];
    
    for (const worker of allWorkers) {
      // Check for active reports (not resolved or rejected)
      const activeReports = await Report.countDocuments({
        assignedWorker: worker._id,
        status: { $nin: ["Resolved", "Rejected"] }
      });

      // Check for active collections (not completed or cancelled)
      const activeCollections = await Collection.countDocuments({
        assignedWorker: worker._id,
        status: { $nin: ["Completed", "Cancelled"] }
      });

      // Worker is available if they have no active assignments
      if (activeReports === 0 && activeCollections === 0) {
        availableWorkers.push(worker);
      }
    }

    // If no completely free workers, find worker with least assignments
    if (availableWorkers.length === 0) {
      const workerLoads = [];
      
      for (const worker of allWorkers) {
        const activeReports = await Report.countDocuments({
          assignedWorker: worker._id,
          status: { $nin: ["Resolved", "Rejected"] }
        });

        const activeCollections = await Collection.countDocuments({
          assignedWorker: worker._id,
          status: { $nin: ["Completed", "Cancelled"] }
        });

        const totalLoad = activeReports + activeCollections;
        workerLoads.push({ worker, load: totalLoad });
      }

      // Sort by load and return worker with least load
      workerLoads.sort((a, b) => a.load - b.load);
      return workerLoads.length > 0 ? workerLoads[0].worker._id : null;
    }

    // Return first available worker (or randomly select for load balancing)
    // For now, return the first one. Can be enhanced with round-robin or random selection
    return availableWorkers.length > 0 ? availableWorkers[0]._id : null;
  } catch (err) {
    console.error("Error finding available worker:", err.message);
    return null; // Return null on error, report will remain unassigned
  }
};

// Ensure Uploads directory exists
const uploadDir = path.join(__dirname, "../Uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer configuration for media uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|mp4|webm/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only JPEG/PNG images and MP4/WebM videos are allowed"));
  },
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "No token provided or invalid format" });
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

// Create Report
router.post("/", authMiddleware, upload.array("media", 2), async (req, res) => {
  const { title, description, type, latitude, longitude, location, severity, wasteType } =
    req.body;

  // Validate input
  if (!title || !description || !type || !req.files || req.files.length === 0) {
    return res.status(400).json({
      message:
        "Title, description, type, and at least one media file are required",
    });
  }

  if (!["report", "cleanup"].includes(type)) {
    return res.status(400).json({ message: "Invalid report type" });
  }

  if (type === "report" && req.files.length > 1) {
    return res
      .status(400)
      .json({ message: "Report type allows only one media file" });
  }

  if (type === "report" && !["Low", "Medium", "High"].includes(severity)) {
    return res.status(400).json({ message: "Invalid severity level" });
  }

  try {
    const mediaUrls = req.files.map((file) => `/Uploads/${file.filename}`);
    
    // Calculate points based on waste type and severity
    const finalWasteType = wasteType || "Mixed";
    const finalSeverity = type === "report" ? severity : "Not specified";
    const pointsAwarded = calculatePoints(finalWasteType, finalSeverity);

    // Try to automatically assign an available worker
    const assignedWorkerId = await findAvailableWorker();
    
    const report = new Report({
      title,
      description,
      type,
      wasteType: finalWasteType,
      latitude: latitude ? parseFloat(latitude) : undefined,
      longitude: longitude ? parseFloat(longitude) : undefined,
      location: location || "Location not provided",
      mediaUrls,
      user: req.user.id,
      status: "Reported",
      severity: finalSeverity,
      pointsAwarded,
      assignedWorker: assignedWorkerId || undefined, // Assign worker if available
    });
    await report.save();

    // Update user points (both monthly and total)
    const user = await User.findById(req.user.id);
    if (user) {
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const reportDate = new Date(report.createdAt);
      const isCurrentMonth = reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;

      user.totalPoints = (user.totalPoints || 0) + pointsAwarded;
      user.pointsRemaining = (user.pointsRemaining || 0) + pointsAwarded;
      
      if (isCurrentMonth) {
        user.monthlyPoints = (user.monthlyPoints || 0) + pointsAwarded;
      }
      
      await user.save();
    }

    // Populate assigned worker if exists
    if (report.assignedWorker) {
      await report.populate("assignedWorker", "name email _id");
    }

    res.status(201).json({
      message: report.assignedWorker 
        ? "Report created successfully and assigned to a worker" 
        : "Report created successfully. No workers available for automatic assignment.",
      report: {
        _id: report._id,
        title: report.title,
        description: report.description,
        type: report.type,
        wasteType: report.wasteType,
        latitude: report.latitude,
        longitude: report.longitude,
        location: report.location,
        mediaUrls: report.mediaUrls,
        user: report.user,
        status: report.status,
        severity: report.severity,
        pointsAwarded: report.pointsAwarded,
        assignedWorker: report.assignedWorker || null,
        createdAt: report.createdAt,
      },
    });
  } catch (err) {
    console.error("Error creating report:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// AI Analysis Endpoint
router.post("/analyze", authMiddleware, upload.single("media"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Image file is required" });
  }

  try {
    const filePath = req.file.path;
    const analysis = await analyzeWasteImage(filePath);
    
    // Cleanup: We can keep the image for the actual report later, 
    // but the analysis just needs the path.
    
    res.json(analysis);
  } catch (err) {
    console.error("Analysis route error:", err);
    res.status(500).json({ message: "AI Analysis failed", error: err.message });
  }
});

// Get All Reports (Public)
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    let query = { user: { $ne: null } };
    if (status) {
      if (status === "pending") {
        query.status = { $in: ["Pending", "Reported"] };
      } else if (["review", "resolved", "rejected"].includes(status)) {
        query.status = status.charAt(0).toUpperCase() + status.slice(1);
      }
    }
    const reports = await Report.find(query)
      .populate("user", "name email _id")
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    console.error("Error fetching reports:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get Report Hotspots (Top reported locations)
router.get("/hotspots", authMiddleware, roleMiddleware(["admin", "superadmin"]), async (req, res) => {
  try {
    const hotspots = await Report.aggregate([
      { $match: { location: { $ne: "Location not provided" } } },
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    res.json(hotspots);
  } catch (err) {
    console.error("Error fetching hotspots:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get Single Report

router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("user", "name email _id")
      .populate("assignedWorker", "name email _id")
      .populate("verifiedBy", "name email _id")
      .populate("replies.uploadedBy", "name email _id");
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.json(report);
  } catch (err) {
    console.error("Error fetching report:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update Report Status
router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(["admin", "superadmin", "worker"]),
  async (req, res) => {
    const { status, assignedWorker } = req.body;
    if (status && !["Pending", "Review", "Resolved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    try {
      const report = await Report.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      if (status) report.status = status;
      if (assignedWorker) report.assignedWorker = assignedWorker;
      await report.save();
      res.json(report);
    } catch (err) {
      console.error("Error updating report:", err.message);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Verify Report Photo (Worker only)
router.post(
  "/:id/verify",
  authMiddleware,
  roleMiddleware(["worker", "admin", "superadmin"]),
  async (req, res) => {
    try {
      const report = await Report.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      report.photoVerified = true;
      report.verifiedBy = req.user.id;
      report.verifiedAt = new Date();
      await report.save();
      res.json(report);
    } catch (err) {
      console.error("Error verifying report:", err.message);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

// Upload Reply Images
router.post(
  "/:id/reply",
  authMiddleware,
  roleMiddleware(["admin", "superadmin"]),
  upload.array("media", 2),
  async (req, res) => {
    const { type } = req.body;
    if (!type || !["before", "after"].includes(type)) {
      return res
        .status(400)
        .json({ message: "Reply type must be 'before' or 'after'" });
    }
    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one media file is required" });
    }
    try {
      const report = await Report.findById(req.params.id);
      if (!report) {
        return res.status(404).json({ message: "Report not found" });
      }
      const mediaUrls = req.files.map((file) => `/Uploads/${file.filename}`);
      report.replies.push({
        mediaUrls,
        type,
        uploadedBy: req.user.id,
      });
      await report.save();
      res.json(report);
    } catch (err) {
      console.error("Error adding reply:", err.message);
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);


module.exports = router;
