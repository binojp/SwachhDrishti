const express = require("express");
const router = express.Router();
const Report = require("../models/Report");
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

const roleMiddleware = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

// Get Recent Reports (Worker)
router.get("/reports", authMiddleware, roleMiddleware(["worker", "admin", "superadmin"]), async (req, res) => {
  try {
    const { status, limit = 50 } = req.query;
    let query = {};
    
    if (status) {
      query.status = status;
    }

    const reports = await Report.find(query)
      .populate("user", "name email")
      .populate("assignedWorker", "name email")
      .populate("verifiedBy", "name email")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));
    
    res.json(reports);
  } catch (err) {
    console.error("Error fetching reports:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get Assigned Reports (Worker)
router.get("/reports/assigned", authMiddleware, roleMiddleware(["worker"]), async (req, res) => {
  try {
    const reports = await Report.find({ assignedWorker: req.user.id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    
    res.json(reports);
  } catch (err) {
    console.error("Error fetching assigned reports:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get Assigned Collections (Worker)
router.get("/collections/assigned", authMiddleware, roleMiddleware(["worker"]), async (req, res) => {
  try {
    const collections = await Collection.find({ assignedWorker: req.user.id })
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    
    res.json(collections);
  } catch (err) {
    console.error("Error fetching assigned collections:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Verify Report Photo
router.post("/reports/:id/verify", authMiddleware, roleMiddleware(["worker", "admin", "superadmin"]), async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    
    report.photoVerified = true;
    report.verifiedBy = req.user.id;
    report.verifiedAt = new Date();
    await report.save();
    
    res.json({ message: "Report verified successfully", report });
  } catch (err) {
    console.error("Error verifying report:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update Report Status (Worker)
router.put("/reports/:id/status", authMiddleware, roleMiddleware(["worker", "admin", "superadmin"]), async (req, res) => {
  try {
    const { status } = req.body;
    if (!["Pending", "Review", "Resolved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    
    // If worker, only allow if assigned to them
    if (req.user.role === "worker" && report.assignedWorker && report.assignedWorker.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not assigned to this report" });
    }
    
    report.status = status;
    await report.save();
    
    res.json(report);
  } catch (err) {
    console.error("Error updating report status:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Assign Report to Worker (Admin/Worker can self-assign)
router.post("/reports/:id/assign", authMiddleware, roleMiddleware(["admin", "superadmin", "worker"]), async (req, res) => {
  try {
    const { workerId } = req.body;
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    
    // If worker, they can only assign to themselves
    const assignTo = req.user.role === "worker" ? req.user.id : workerId;
    
    report.assignedWorker = assignTo;
    await report.save();
    
    res.json({ message: "Report assigned successfully", report });
  } catch (err) {
    console.error("Error assigning report:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;



