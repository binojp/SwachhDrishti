const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI;

// Simple in-memory cache for Gemini results
const geminiCache = new Map();

/**
 * Generates a hash for the image file for caching
 */
const getFileHash = (filePath) => {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash("md5");
  hashSum.update(fileBuffer);
  return hashSum.digest("hex");
};

const getGenAI = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
};

/**
 * Runs YOLOv11 detection via Python script
 */
const runYoloDetection = (imagePath) => {
  return new Promise((resolve, reject) => {
    const pythonPath = "python"; // Assumes python is in PATH
    const scriptPath = path.join(__dirname, "yolo_detector.py");
    const modelPath = path.join(__dirname, "../models/wastemodel.pt");

    const pyProcess = spawn(pythonPath, [scriptPath, imagePath, modelPath]);

    let output = "";
    let error = "";

    pyProcess.stdout.on("data", (data) => {
      output += data.toString();
    });

    pyProcess.stderr.on("data", (data) => {
      error += data.toString();
    });

    pyProcess.on("close", (code) => {
      if (code !== 0) {
        console.error("YOLO Process Error:", error);
        return resolve({ success: false, error: "YOLO detection failed" });
      }
      try {
        const result = JSON.parse(output.trim());
        resolve(result);
      } catch (err) {
        console.error("Failed to parse YOLO output:", output);
        resolve({ success: false, error: "Invalid output from YOLO script" });
      }
    });
  });
};

/**
 * Runs Gemini analysis for deep context
 */
const runGeminiAnalysis = async (imagePath, yoloDetections) => {
  try {
    const fileHash = getFileHash(imagePath);
    if (geminiCache.has(fileHash)) {
      console.log("Gemini: Returning cached result for:", fileHash);
      return geminiCache.get(fileHash);
    }

    console.log("Starting Gemini Analysis for:", imagePath);
    // Use gemini-flash-latest which is in the list of available models for this key
    const model = getGenAI().getGenerativeModel({ model: "gemini-flash-latest" });

    
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Image file not found at ${imagePath}`);
    }
    const imageBuffer = fs.readFileSync(imagePath);
    
    const prompt = `
      Analyze this image for waste management and environmental impact.
      
      Provide a comprehensive JSON analysis of the waste shown.
      
      Return ONLY valid JSON in this format:
      {
        "is_waste": boolean,
        "item_type": "plastic" | "organic" | "glass" | "metal" | "paper" | "electronics" | "hazardous" | "Other",
        "condition": "Scrap" | "Recyclable" | "Hazardous",
        "estimated_value_credits": number (10-500),
        "carbon_saved_kg": number,
        "description": "Short description of the waste item and its environmental impact",
        "suggested_action": "Safe disposal method"
      }
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: "image/jpeg"
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    console.log("Gemini Raw Response Received");
    
    let cleanedText = text.trim();
    if (cleanedText.includes("```")) {
      const match = cleanedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match) cleanedText = match[1];
    }

    try {
      const parsedResult = JSON.parse(cleanedText);
      geminiCache.set(fileHash, parsedResult);
      return parsedResult;
    } catch (parseErr) {
      console.error("JSON Parsing Error. Raw response was:", text);
      const fallbackMatch = cleanedText.match(/\{[\s\S]*\}/);
      if (fallbackMatch) {
         const fallbackResult = JSON.parse(fallbackMatch[0]);
         geminiCache.set(fileHash, fallbackResult);
         return fallbackResult;
      }
      throw parseErr;
    }
  } catch (err) {
    console.error("Gemini Critical Error:", err.message);
    return { error: err.message };
  }
};

/**
 * Combined AI Analysis (YOLO + Gemini)
 */
const analyzeWasteImage = async (imagePath) => {
  console.log("Starting Combined AI Analysis...");
  
  // 1. Run YOLO (Fast Local Detection) - DISABLED FOR RAILWAY
  let yoloResult = { success: false, detections: [], message: "YOLO Disabled" };
  /*
  try {
    yoloResult = await runYoloDetection(imagePath);
  } catch (err) {
    console.error("YOLO Execution Error:", err.message);
  }
  */

  // 2. Run Gemini (Deep Semantic Analysis)
  const geminiResult = await runGeminiAnalysis(imagePath, yoloResult.detections || []);


  if (geminiResult.error) {
    return {
      success: false,
      error: geminiResult.error,
      yolo: yoloResult,
      timestamp: new Date()
    };
  }

  return {
    success: true,
    yolo: yoloResult,
    gemini: geminiResult,
    timestamp: new Date()
  };
};

module.exports = { analyzeWasteImage };
