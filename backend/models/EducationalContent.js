const mongoose = require("mongoose");

const educationalContentSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  topic: { 
    type: String, 
    required: true,
    enum: [
      "battery-disposal",
      "phone-laptop-recycling",
      "cable-charger-management",
      "environmental-impact",
      "plastic-recycling",
      "organic-waste",
      "sorting-techniques",
      "hazardous-materials",
      "circular-economy"
    ]
  },
  content: { 
    type: String, 
    required: true 
  },
  difficulty: { 
    type: String, 
    enum: ["beginner", "intermediate", "advanced"],
    default: "beginner"
  },
  points: { 
    type: Number, 
    default: 50 
  },
  estimatedTime: { 
    type: Number, 
    default: 5 
  },
  imageUrl: { 
    type: String 
  },
  tips: [{ 
    type: String 
  }],
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.models.EducationalContent || mongoose.model("EducationalContent", educationalContentSchema);
