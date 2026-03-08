const express = require("express");
const router = express.Router();
const Route = require("../models/Route");
const Bin = require("../models/Bin");
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const {
  findFullBins,
  findNearestWorker,
  optimizeRoute,
  groupBinsByProximity,
} = require("../utils/routeOptimizer.js");

// Auth middleware
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

// Role middleware
const roleMiddleware = (roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

/* ================= ADMIN ROUTES ================= */

// Get all routes
router.get("/admin/truck-routes", authMiddleware, roleMiddleware(["admin", "superadmin"]), async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};
    
    const routes = await Route.find(query)
      .populate("bins", "name placeName latitude longitude level wasteType")
      .populate("assignedWorker", "name email")
      .sort({ createdAt: -1 });
    
    res.json(routes);
  } catch (err) {
    console.error("Error fetching routes:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Create optimized route for full bins
router.post("/admin/truck-routes/create", authMiddleware, roleMiddleware(["admin", "superadmin"]), async (req, res) => {
  try {
    const { threshold = 90 } = req.body;

    const fullBins = await findFullBins(threshold);

    if (fullBins.length === 0) {
      return res.status(404).json({ message: "No bins above threshold" });
    }

    const binGroups = groupBinsByProximity(fullBins, 5);
    const createdRoutes = [];

    for (const group of binGroups) {
      const worker = await findNearestWorker(group);

      const { bins: optimizedBins, totalDistance } = await optimizeRoute(group);

      const routeData = {
        bins: optimizedBins.map(bin => bin._id),
        totalDistance,
        status: "Pending"
      };

      if (worker) {
        routeData.assignedWorker = worker._id;
      }

      const route = new Route(routeData);
      await route.save();

      await route.populate("bins", "name placeName latitude longitude level wasteType");
      await route.populate("assignedWorker", "name email");

      createdRoutes.push(route);
    }

    res.status(201).json({
      message: `Created ${createdRoutes.length} optimized routes`,
      routes: createdRoutes
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Route creation failed" });
  }
});

// Get route details
router.get("/admin/truck-routes/:id", authMiddleware, roleMiddleware(["admin", "superadmin"]), async (req, res) => {
  try {
    const route = await Route.findById(req.params.id)
      .populate("bins", "name placeName latitude longitude level wasteType status")
      .populate("assignedWorker", "name email");
    
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }
    
    res.json(route);
  } catch (err) {
    console.error("Error fetching route:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Manually assign route to worker
router.patch("/admin/truck-routes/:id/assign", authMiddleware, roleMiddleware(["admin", "superadmin"]), async (req, res) => {
  try {
    const { workerId } = req.body;
    
    if (!workerId) {
      return res.status(400).json({ message: "Worker ID is required" });
    }

    const worker = await User.findById(workerId);
    if (!worker || worker.role !== "worker") {
      return res.status(404).json({ message: "Worker not found" });
    }

    const route = await Route.findById(req.params.id);
    if (!route) {
      return res.status(404).json({ message: "Route not found" });
    }

    route.assignedWorker = workerId;
    await route.save();

    await route.populate("bins", "name placeName latitude longitude level wasteType");
    await route.populate("assignedWorker", "name email");

    res.json({ message: "Route assigned successfully", route });
  } catch (err) {
    console.error("Error assigning route:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

/* ================= WORKER ROUTES ================= */

// Get assigned routes for logged-in worker
router.get("/worker/assigned-routes", authMiddleware, roleMiddleware(["worker"]), async (req, res) => {
  try {
    const routes = await Route.find({
      assignedWorker: req.user.id,
      status: { $in: ["Pending", "In Progress"] },
    })
      .populate("bins", "name placeName latitude longitude level wasteType status")
      .sort({ createdAt: -1 });
    
    res.json(routes);
  } catch (err) {
    console.error("Error fetching worker routes:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Get route details for worker
router.get("/worker/routes/:id", authMiddleware, roleMiddleware(["worker"]), async (req, res) => {
  try {
    const route = await Route.findOne({
      _id: req.params.id,
      assignedWorker: req.user.id,
    }).populate("bins", "name placeName latitude longitude level wasteType status");
    
    if (!route) {
      return res.status(404).json({ message: "Route not found or not assigned to you" });
    }
    
    res.json(route);
  } catch (err) {
    console.error("Error fetching route:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update route status
router.patch("/worker/routes/:id/status", authMiddleware, roleMiddleware(["worker"]), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!["In Progress", "Completed"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const route = await Route.findOne({
      _id: req.params.id,
      assignedWorker: req.user.id,
    });
    
    if (!route) {
      return res.status(404).json({ message: "Route not found or not assigned to you" });
    }

    route.status = status;
    
    if (status === "In Progress" && !route.startedAt) {
      route.startedAt = new Date();
    }
    
    if (status === "Completed") {
      route.completedAt = new Date();
      
      // Update all bins in the route to Empty status
      await Bin.updateMany(
        { _id: { $in: route.bins } },
        { $set: { level: 0, status: "Empty" } }
      );
    }

    await route.save();
    await route.populate("bins", "name placeName latitude longitude level wasteType status");

    res.json({ message: "Route status updated", route });
  } catch (err) {
    console.error("Error updating route status:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
