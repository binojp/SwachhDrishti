const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const reportRoutes = require("./routes/reports");
const path = require("path");
const https = require("https");
const fs = require("fs");
const userRouter = require("./routes/user");
const profileRoutes = require("./routes/profile");
const collectionRoutes = require("./routes/collections");
const workerRoutes = require("./routes/worker");
const binRoutes = require("./routes/bins");
const truckRoutes = require("./routes/truckroutes");
const educationRoutes = require("./routes/education");
const campaignRoutes = require("./routes/campaigns");
const marketplaceRoutes = require("./routes/marketplace");



const app = express();
app.use(express.json());
app.use(cors());
app.use("/uploads", express.static(path.join(__dirname, "Uploads")));

mongoose
  .connect(process.env.MONGO_URI) // Remove the object with useNewUrlParser and useUnifiedTopology
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));
  
app.use("/api", authRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/user", userRouter);
app.use("/api/profile", profileRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api/bins", binRoutes);
app.use("/api", truckRoutes);
app.use("/api/education", educationRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/marketplace", marketplaceRoutes);


const PORT = process.env.PORT || 5000;

// Change 'server' to 'app'
app.listen(PORT, "0.0.0.0", () =>
  console.log(`Server running on port ${PORT}`),
);