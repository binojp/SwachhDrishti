const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
  bins: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bin",
      required: true,
    },
  ],
  assignedWorker: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed", "Cancelled"],
    default: "Pending",
  },
  totalDistance: {
    type: Number,
    default: 0,
  },
  startLocation: {
    latitude: { type: Number },
    longitude: { type: Number },
  },
  createdAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  completedAt: { type: Date },
  updatedAt: { type: Date, default: Date.now },
});

routeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.models.Route || mongoose.model("Route", routeSchema);
