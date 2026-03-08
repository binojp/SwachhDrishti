const mongoose = require("mongoose");

const binSchema = new mongoose.Schema({
  name: { type: String, required: true },
  placeName: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  level: { 
    type: Number, 
    required: true, 
    min: 0, 
    max: 100,
    default: 0 
  },
  capacity: { 
    type: Number, 
    default: 100 
  },
  wasteType: {
    type: String,
    enum: [
      "plastic",
      "organic",
      "glass",
      "metal",
      "paper",
      "electronics",
      "hazardous",
      "Mixed",
      "Other",
    ],
    default: "Other",
  },
  status: {
    type: String,
    enum: ["Empty", "Low", "Medium", "Full", "Overflowing"],
    default: "Empty",
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

binSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  
  // Auto-update status based on level
  if (this.level >= 90) {
    this.status = "Overflowing";
  } else if (this.level >= 70) {
    this.status = "Full";
  } else if (this.level >= 40) {
    this.status = "Medium";
  } else if (this.level > 0) {
    this.status = "Low";
  } else {
    this.status = "Empty";
  }
  
  next();
});

module.exports = mongoose.models.Bin || mongoose.model("Bin", binSchema);


