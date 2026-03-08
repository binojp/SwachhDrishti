const mongoose = require("mongoose");

const quizSchema = new mongoose.Schema({
  topic: { 
    type: String, 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  questions: [{
    question: { 
      type: String, 
      required: true 
    },
    options: [{ 
      type: String, 
      required: true 
    }],
    correctAnswer: { 
      type: Number, 
      required: true 
    }, // index of correct option
    explanation: { 
      type: String 
    }
  }],
  passingScore: { 
    type: Number, 
    default: 80 
  }, // percentage
  points: { 
    type: Number, 
    default: 100 
  },
  perfectScoreBonus: { 
    type: Number, 
    default: 50 
  },
  generatedBy: { 
    type: String, 
    enum: ["AI", "Manual"],
    default: "Manual"
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.models.Quiz || mongoose.model("Quiz", quizSchema);
