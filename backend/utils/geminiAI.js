const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate educational content using Gemini AI
 */
async function generateEducationalContent(topic) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Generate educational content about waste management and proper disposal for the topic: "${topic}".
    
    Provide:
    1. A comprehensive explanation (200-300 words)
    2. 5 practical tips
    3. Environmental impact information
    
    Format the response as JSON with keys: content, tips (array), impact`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON, fallback to structured text
    try {
      return JSON.parse(text);
    } catch {
      return {
        content: text,
        tips: [],
        impact: ""
      };
    }
  } catch (error) {
    console.error("Error generating educational content:", error);
    throw new Error("Failed to generate educational content");
  }
}

/**
 * Generate quiz questions using Gemini AI
 */
async function generateQuizQuestions(topic, numQuestions = 5) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Generate ${numQuestions} multiple-choice quiz questions about waste management and recycling for the topic: "${topic}".

    Each question should have:
    - A clear question
    - 4 options
    - The index (0-3) of the correct answer
    - A brief explanation of why the answer is correct

    Format the response as a JSON array of objects with keys: question, options (array of 4 strings), correctAnswer (number 0-3), explanation.
    
    Make questions educational and practical for users learning about proper waste disposal and recycling.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Extract JSON from markdown code blocks if present
    let jsonText = text;
    if (text.includes('```json')) {
      jsonText = text.split('```json')[1].split('```')[0].trim();
    } else if (text.includes('```')) {
      jsonText = text.split('```')[1].split('```')[0].trim();
    }
    
    try {
      const questions = JSON.parse(jsonText);
      return Array.isArray(questions) ? questions : [];
    } catch {
      console.error("Failed to parse quiz questions JSON");
      return [];
    }
  } catch (error) {
    console.error("Error generating quiz questions:", error);
    throw new Error("Failed to generate quiz questions");
  }
}

/**
 * Generate environmental impact explanation
 */
async function generateImpactExplanation(wasteType, quantity) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `Explain the environmental impact of properly recycling ${quantity} ${wasteType} items.
    
    Include:
    - CO2 emissions saved (estimate)
    - Resources conserved
    - Environmental benefits
    
    Keep it concise (2-3 sentences) and inspiring.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating impact explanation:", error);
    return "Great job recycling! Every item properly disposed helps protect our environment.";
  }
}

module.exports = {
  generateEducationalContent,
  generateQuizQuestions,
  generateImpactExplanation
};
