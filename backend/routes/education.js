const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const EducationalContent = require("../models/EducationalContent");
const Quiz = require("../models/Quiz");
const { generateEducationalContent, generateQuizQuestions, generateImpactExplanation } = require("../utils/geminiAI");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

router.get("/content", authenticateToken, async (req, res) => {
  try {
    const content = await EducationalContent.find().sort({ createdAt: -1 });
    
    const user = await User.findById(req.user.id);
    const completedModuleIds = user.educationProgress?.completedModules || [];
    
    const contentWithProgress = content.map(module => ({
      ...module.toObject(),
      completed: completedModuleIds.some(id => id.toString() === module._id.toString())
    }));
    
    res.json(contentWithProgress);
  } catch (error) {
    console.error("Error fetching educational content:", error);
    res.status(500).json({ message: "Failed to fetch educational content" });
  }
});

router.get("/content/:id", authenticateToken, async (req, res) => {
  try {
    const content = await EducationalContent.findById(req.params.id);
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }
    res.json(content);
  } catch (error) {
    console.error("Error fetching content:", error);
    res.status(500).json({ message: "Failed to fetch content" });
  }
});

router.post("/content/:id/complete", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const content = await EducationalContent.findById(req.params.id);
    
    if (!content) {
      return res.status(404).json({ message: "Content not found" });
    }
    
    const alreadyCompleted = user.educationProgress?.completedModules?.some(
      id => id.toString() === content._id.toString()
    );
    
    if (alreadyCompleted) {
      return res.json({ message: "Module already completed", pointsEarned: 0 });
    }
    
    if (!user.educationProgress) {
      user.educationProgress = { completedModules: [], quizzesTaken: [], learningStreak: 0 };
    }
    
    user.educationProgress.completedModules.push(content._id);
    user.totalPoints += content.points;
    user.pointsRemaining += content.points;
    user.monthlyPoints += content.points;
    
    await user.save();
    
    res.json({ 
      message: "Module completed successfully!", 
      pointsEarned: content.points,
      totalPoints: user.totalPoints
    });
  } catch (error) {
    console.error("Error completing module:", error);
    res.status(500).json({ message: "Failed to complete module" });
  }
});

const FALLBACK_QUIZZES = {
  "battery-disposal": [
    {
      question: "Which of these materials in batteries is most toxic to soil?",
      options: ["Iron", "Lead", "Aluminum", "Copper"],
      correctAnswer: 1,
      explanation: "Lead is a heavy metal that can severely contaminate soil and groundwater."
    },
    {
      question: "What should you do with rechargeable batteries?",
      options: ["Throw in trash", "Incinerate them", "Take to recycling center", "Bury them"],
      correctAnswer: 2,
      explanation: "Rechargeable batteries contain valuable materials and should be recycled safely."
    },
    {
      question: "Why should you never throw batteries in regular trash?",
      options: ["They are too heavy", "They leak chemicals", "They are made of gold", "They smell bad"],
      correctAnswer: 1,
      explanation: "Batteries contain harmful chemicals that can leak and pollute the environment."
    }
  ],
  "phone-laptop-recycling": [
    {
      question: "What is the first step before recycling a phone or laptop?",
      options: ["Smash the screen", "Delete your personal data", "Paint it a new color", "Pour water on it"],
      correctAnswer: 1,
      explanation: "Data security is critical; always perform a factory reset to protect your privacy."
    },
    {
      question: "Which valuable metal can be recovered from 1 million recycled phones?",
      options: ["Silver", "Plastic", "Paper", "Wood"],
      correctAnswer: 0,
      explanation: "Recycling phones allows for the recovery of gold, silver, copper, and palladium."
    }
  ],
  "cable-charger-management": [
    {
      question: "Which valuable metal is commonly found inside cables?",
      options: ["Copper", "Steel", "Zinc", "Nickel"],
      correctAnswer: 0,
      explanation: "Cables contain high-quality copper wire which is highly recyclable."
    }
  ],
  "environmental-impact": [
    {
      question: "What percentage of global waste is currently properly recycled?",
      options: ["17%", "50%", "80%", "100%"],
      correctAnswer: 0,
      explanation: "Currently, only a small fraction of waste is documented as properly collected and recycled."
    }
  ],
  "plastic-recycling": [
    {
      question: "Which plastic type is most commonly used for water bottles and is highly recyclable?",
      options: ["PVC", "HDPE", "PET", "PP"],
      correctAnswer: 2,
      explanation: "PET (Polyethylene Terephthalate) is the most common plastic for beverage bottles and is widely recycled."
    },
    {
      question: "What does the number inside the recycling triangle on plastic products represent?",
      options: ["How many times it was recycled", "The type of plastic resin", "The price of the item", "The year it was made"],
      correctAnswer: 1,
      explanation: "The Resin Identification Code (RIC) system identifies the type of plastic resin used in the product."
    }
  ],
  "organic-waste": [
    {
      question: "What is the primary environmental benefit of composting food waste?",
      options: ["Makes soil smell better", "Reduces methane emissions from landfills", "Creates new plastic", "Produces electricity"],
      correctAnswer: 1,
      explanation: "Composting prevents organic matter from decomposing anaerobically in landfills, which produces methane, a potent greenhouse gas."
    }
  ],
  "sorting-techniques": [
    {
      question: "Which of these should be done to containers before placing them in recycling bins?",
      options: ["Crush them", "Rince to remove food residue", "Paint them", "Fill them with paper"],
      correctAnswer: 1,
      explanation: "Rinsing prevents contamination of other recyclables and improves the quality of recovered materials."
    }
  ],
  "hazardous-materials": [
    {
      question: "Which toxic metal is commonly found in older CRT television screens?",
      options: ["Iron", "Lead", "Aluminum", "Silver"],
      correctAnswer: 1,
      explanation: "CRT screens contain significant amounts of lead to shield viewers from X-rays."
    }
  ],
  "circular-economy": [
    {
      question: "What is the main goal of a circular economy?",
      options: ["To sell more products", "To eliminate waste and keep materials in use", "To use more plastic", "To increase landfill size"],
      correctAnswer: 1,
      explanation: "A circular economy aims to decouple economic activity from the consumption of finite resources and design waste out of the system."
    }
  ]
};

router.get("/quiz/:topic", authenticateToken, async (req, res) => {
  try {
    const { topic } = req.params;
    
    let quiz = await Quiz.findOne({ topic }).sort({ createdAt: -1 });
    
    if (!quiz || req.query.regenerate === "true") {
      let questions = [];
      try {
        questions = await generateQuizQuestions(topic, 5);
      } catch (aiError) {
        console.error("AI Quiz Generation failed, using fallbacks:", aiError.message);
      }
      
      if (!questions || questions.length === 0) {
        questions = FALLBACK_QUIZZES[topic] || FALLBACK_QUIZZES["battery-disposal"];
      }
      
      quiz = new Quiz({
        topic,
        title: `${topic.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())} Quiz`,
        questions,
        passingScore: 80,
        points: 100,
        perfectScoreBonus: 50,
        generatedBy: questions.length > 3 ? "AI" : "Manual"
      });
      
      await quiz.save();
    }
    
    const quizForUser = {
      _id: quiz._id,
      topic: quiz.topic,
      title: quiz.title,
      questions: quiz.questions.map(q => ({
        question: q.question,
        options: q.options
      })),
      passingScore: quiz.passingScore,
      points: quiz.points,
      perfectScoreBonus: quiz.perfectScoreBonus
    };
    
    res.json(quizForUser);
  } catch (error) {
    console.error("Error fetching quiz:", error);
    res.status(500).json({ message: "Failed to fetch quiz" });
  }
});

router.post("/quiz/submit", authenticateToken, async (req, res) => {
  try {
    const { quizId, answers } = req.body;
    
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    
    let correctCount = 0;
    const results = quiz.questions.map((q, index) => {
      const isCorrect = answers[index] === q.correctAnswer;
      if (isCorrect) correctCount++;
      
      return {
        question: q.question,
        userAnswer: answers[index],
        correctAnswer: q.correctAnswer,
        isCorrect,
        explanation: q.explanation
      };
    });
    
    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;
    
    let pointsEarned = 0;
    if (passed) {
      pointsEarned = quiz.points;
      if (score === 100) {
        pointsEarned += quiz.perfectScoreBonus;
      }
    }
    
    const user = await User.findById(req.user.id);
    
    if (!user.educationProgress) {
      user.educationProgress = { completedModules: [], quizzesTaken: [], learningStreak: 0 };
    }
    
    const alreadyTaken = user.educationProgress.quizzesTaken?.some(
      qt => qt.quizId.toString() === quizId
    );
    
    if (!alreadyTaken && pointsEarned > 0) {
      user.totalPoints += pointsEarned;
      user.pointsRemaining += pointsEarned;
      user.monthlyPoints += pointsEarned;
    }
    
    user.educationProgress.quizzesTaken.push({
      quizId: quiz._id,
      score,
      pointsEarned: alreadyTaken ? 0 : pointsEarned,
      completedAt: new Date()
    });
    
    const today = new Date().setHours(0, 0, 0, 0);
    const lastActivity = user.educationProgress.lastActivityDate 
      ? new Date(user.educationProgress.lastActivityDate).setHours(0, 0, 0, 0)
      : null;
    
    if (lastActivity) {
      const daysDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
      if (daysDiff === 1) {
        user.educationProgress.learningStreak += 1;
      } else if (daysDiff > 1) {
        user.educationProgress.learningStreak = 1;
      }
    } else {
      user.educationProgress.learningStreak = 1;
    }
    
    user.educationProgress.lastActivityDate = new Date();
    
    await user.save();
    
    res.json({
      score,
      passed,
      correctCount,
      totalQuestions: quiz.questions.length,
      pointsEarned: alreadyTaken ? 0 : pointsEarned,
      alreadyTaken,
      results,
      totalPoints: user.totalPoints,
      learningStreak: user.educationProgress.learningStreak
    });
  } catch (error) {
    console.error("Error submitting quiz:", error);
    res.status(500).json({ message: "Failed to submit quiz" });
  }
});

router.get("/progress", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("educationProgress.completedModules")
      .populate("educationProgress.quizzesTaken.quizId");
    
    const progress = user.educationProgress || {
      completedModules: [],
      quizzesTaken: [],
      learningStreak: 0,
      lastActivityDate: null
    };
    
    res.json(progress);
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ message: "Failed to fetch progress" });
  }
});

router.post("/generate-content", authenticateToken, async (req, res) => {
  try {
    const { topic, title, difficulty } = req.body;
    
    const user = await User.findById(req.user.id);
    if (user.role !== "admin" && user.role !== "superadmin") {
      return res.status(403).json({ message: "Only admins can generate content" });
    }
    
    const aiContent = await generateEducationalContent(topic);
    
    const newContent = new EducationalContent({
      title: title || `${topic.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())} Guide`,
      topic,
      content: aiContent.content,
      tips: aiContent.tips || [],
      difficulty: difficulty || "beginner",
      points: 50,
      estimatedTime: 5
    });
    
    await newContent.save();
    
    res.json({ message: "Content generated successfully", content: newContent });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ message: "Failed to generate content" });
  }
});

router.get("/impact", authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    const co2Saved = (user.totalPoints / 10).toFixed(1); 
    const treesEquivalent = (user.totalPoints / 100).toFixed(1); 
    const itemsRecycled = Math.floor(user.totalPoints / 50); 
    
    res.json({
      co2Saved,
      treesEquivalent,
      itemsRecycled,
      totalPoints: user.totalPoints,
      learningStreak: user.educationProgress?.learningStreak || 0
    });
  } catch (error) {
    console.error("Error fetching impact:", error);
    res.status(500).json({ message: "Failed to fetch impact" });
  }
});

module.exports = router;
