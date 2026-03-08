const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Report = require("../models/Report");
const router = express.Router();

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

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Only allow public registration for 'user' and 'industry'
  const userRole = (role === "industry") ? "industry" : "user";

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ 
      name, 
      email, 
      password: hashedPassword,
      role: userRole 
    });
    await user.save();


    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.status(201).json({ token, user: { id: user._id, name, email, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post(
  "/admin/add", 
  async (req, res) => {
    const { name, email, password, role } = req.body;
    
    if (!name || !email || !password || !["admin", "worker"].includes(role)) {
      return res.status(400).json({ 
        message: "All fields are required and role must be 'admin' or 'worker'" 
      });
    }

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        name,
        email,
        password: hashedPassword,
        role,
      });
      await user.save();
      res.status(201).json({ message: `${role.charAt(0).toUpperCase() + role.slice(1)} created` });
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
    res.json({
      token,
      user: { id: user._id, name: user.name, email, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.post(
  "/admin",
  authMiddleware,
  roleMiddleware(["superadmin"]),
  async (req, res) => {
    const { email } = req.body;

    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.role === "admin") {
        return res.status(400).json({ message: "User is already an admin" });
      }

      user.role = "admin";
      await user.save();
      res.json({
        message: "User promoted to admin",
        user: { id: user._id, email, role: user.role },
      });
    } catch (err) {
      res.status(500).json({ message: "Server error", error: err.message });
    }
  }
);

router.post("/setup-superadmin", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingSuperadmin = await User.findOne({ role: "superadmin" });
    if (existingSuperadmin) {
      return res.status(400).json({ message: "Superadmin already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const superadmin = new User({
      name,
      email,
      password: hashedPassword,
      role: "superadmin",
    });
    await superadmin.save();

    res.status(201).json({ message: "Superadmin created successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/user", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("name email role totalPoints monthlyPoints pointsRemaining redeemedRewards educationProgress")
      .populate("educationProgress.completedModules");
      
    if (!user) return res.status(404).json({ message: "User not found" });

    const totalUsers = await User.countDocuments();
    const reports = await Report.find({ user: req.user.id });
    
    const reportsTotal = reports.reduce(
      (sum, r) => sum + (r.pointsAwarded || (r.severity === "High" ? 50 : r.severity === "Medium" ? 25 : 10)),
      0
    );

    const educationPoints = (user.educationProgress?.completedModules || []).reduce((sum, module) => sum + (module.points || 50), 0);
    const quizPoints = (user.educationProgress?.quizzesTaken || []).reduce((sum, q) => sum + (q.pointsEarned || 0), 0);
    
    const Campaign = require("../models/Campaign");
    const campaigns = await Campaign.find({ "participants.user": req.user.id, "participants.status": "Present" });
    const campaignPoints = campaigns.reduce((sum, c) => sum + (c.pointsAwarded || 50), 0);

    const calculatedTotal = reportsTotal + educationPoints + quizPoints + campaignPoints;

    const now = new Date();
    const reportsMonthly = reports.reduce((sum, r) => {
      const d = new Date(r.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        ? sum + (r.pointsAwarded || (r.severity === "High" ? 50 : r.severity === "Medium" ? 25 : 10))
        : sum;
    }, 0);
    
    const campaignPointsMonthly = campaigns.reduce((sum, c) => {
      const d = new Date(c.date); // Using campaign date for monthly points
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        ? sum + (c.pointsAwarded || 50)
        : sum;
    }, 0);

    const calculatedMonthly = reportsMonthly + campaignPointsMonthly; 

    const redeemedPoints = (user.redeemedRewards || []).reduce((sum, r) => sum + r.points, 0);
    const pointsRemaining = Math.max(0, calculatedTotal - redeemedPoints);

    user.totalPoints = calculatedTotal;
    user.monthlyPoints = calculatedMonthly;
    user.pointsRemaining = pointsRemaining;
    await user.save();

    const allUsers = await User.find({ role: "user" }).select("totalPoints");
    const sortedUsers = allUsers
      .map((u) => ({ id: u._id.toString(), totalPoints: u.totalPoints || 0 }))
      .sort((a, b) => b.totalPoints - a.totalPoints);
    const rank = sortedUsers.findIndex((u) => u.id === req.user.id.toString()) + 1 || totalUsers;

    const stats = {
      id: user._id,
      name: user.name || "User",
      city: user.city || "Unknown",
      rank,
      totalUsers,
      totalPoints: calculatedTotal,
      monthlyPoints: calculatedMonthly,
      pointsRemaining: pointsRemaining,
      redeemedRewards: user.redeemedRewards || [],
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/dashboard-stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const RawMaterialRequest = require("../models/RawMaterialRequest");
    const stats = {
      reportsToday: await Report.countDocuments({
        createdAt: { $gte: today, $lt: tomorrow },
      }),
      needReview: await Report.countDocuments({ status: "Reported" }),
      resolvedToday: await Report.countDocuments({
        status: "Resolved",
        updatedAt: { $gte: today, $lt: tomorrow },
      }),
      totalActiveUsers: await User.countDocuments({ role: "user" }),
      pendingMarketplace: await RawMaterialRequest.countDocuments({ status: "Pending" }),
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/top-members", async (req, res) => {
  try {
    const users = await User.find({ role: "user" }).select("name email totalPoints monthlyPoints");
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const topMembers = await Promise.all(
      users.map(async (user) => {
        const reports = await Report.find({ user: user._id });
        const Campaign = require("../models/Campaign");
        const userCampaigns = await Campaign.find({ "participants.user": user._id, "participants.status": "Present" });
        
        const reportsPoints = reports.reduce(
          (sum, report) => sum + (report.pointsAwarded || (report.severity === "High" ? 50 : report.severity === "Medium" ? 25 : 10)),
          0
        );
        const campaignPoints = userCampaigns.reduce((sum, c) => sum + (c.pointsAwarded || 50), 0);
        
        // Note: Education/Quiz points should ideally be here too, but let's stick to reports + campaigns for now 
        // as the original code was slightly simplified.
        const totalPoints = reportsPoints + campaignPoints;
        
        const monthlyReportsPoints = reports
          .filter((report) => {
            const reportDate = new Date(report.createdAt);
            return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
          })
          .reduce(
            (sum, report) => sum + (report.pointsAwarded || (report.severity === "High" ? 50 : report.severity === "Medium" ? 25 : 10)),
            0
          );
        
        const monthlyCampaignPoints = userCampaigns
          .filter((c) => {
            const d = new Date(c.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
          })
          .reduce((sum, c) => sum + (c.pointsAwarded || 50), 0);

        const monthlyPoints = monthlyReportsPoints + monthlyCampaignPoints;
        
        const reportsThisMonth = reports.filter(
          (report) => {
            const reportDate = new Date(report.createdAt);
            return reportDate.getMonth() === currentMonth && reportDate.getFullYear() === currentYear;
          }
        ).length;
        
        return {
          id: user._id.toString(),
          name: user.name || user.email,
          points: monthlyPoints, 
          totalPoints: totalPoints,
          reportsThisMonth,
        };
      })
    );
    const sortedMembers = topMembers
      .sort((a, b) => b.points - a.points)
      .slice(0, 10)
      .map((member, index) => ({ ...member, rank: index + 1 }));
    res.json(sortedMembers);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get("/fines", async (req, res) => {
  try {
    const fineDetails = [
      {
        id: "1",
        violationType: "Illegal Dumping",
        amount: 5000,
        description: "Dumping waste in unauthorized areas",
        issuedToday: 3,
        totalCollected: 45000,
      },
      {
        id: "2",
        violationType: "Littering",
        amount: 500,
        description: "Throwing waste on streets/public places",
        issuedToday: 12,
        totalCollected: 28500,
      },
      {
        id: "3",
        violationType: "Improper Segregation",
        amount: 1000,
        description: "Not segregating waste properly",
        issuedToday: 8,
        totalCollected: 15000,
      },
      {
        id: "4",
        violationType: "Overflowing Private Bins",
        amount: 2000,
        description: "Not maintaining private waste containers",
        issuedToday: 2,
        totalCollected: 12000,
      },
    ];
    res.json(fineDetails);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

router.get(
  "/admin/dashboard",
  authMiddleware,
  roleMiddleware(["admin", "superadmin"]),
  (req, res) => {
    res.json({ message: "Welcome to the Admin Dashboard" });
  }
);

module.exports = router;