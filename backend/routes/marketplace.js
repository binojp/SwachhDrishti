const express = require("express");
const router = express.Router();
const RawMaterialRequest = require("../models/RawMaterialRequest");
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

// Industry: Create a request
router.post("/request", authMiddleware, roleMiddleware(["industry", "admin", "superadmin"]), async (req, res) => {
  const { materialType, quantity, description } = req.body;

  if (!materialType || !quantity) {
    return res.status(400).json({ message: "Material type and quantity are required" });
  }

  try {
    const newRequest = new RawMaterialRequest({
      industry: req.user.id,
      materialType,
      quantity,
      description,
    });
    await newRequest.save();
    res.status(201).json({ message: "Request created successfully", request: newRequest });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Admin: Get all requests
router.get("/requests", authMiddleware, roleMiddleware(["admin", "superadmin"]), async (req, res) => {
  try {
    const requests = await RawMaterialRequest.find()
      .populate("industry", "name email")
      .sort({ requestedAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Industry: Get their own requests
router.get("/my-requests", authMiddleware, roleMiddleware(["industry"]), async (req, res) => {
  try {
    const requests = await RawMaterialRequest.find({ industry: req.user.id })
      .sort({ requestedAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Admin: Update request status
router.patch("/request/:id", authMiddleware, roleMiddleware(["admin", "superadmin"]), async (req, res) => {
  const { status } = req.body;
  if (!["Accepted", "Transferred", "Rejected", "Pending"].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    const request = await RawMaterialRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    request.status = status;
    request.updatedAt = Date.now();
    await request.save();
    res.json({ message: `Request status updated to ${status}`, request });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
