import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = express.Router();

// Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const modelName = process.env.GEMINI_MODEL || "gemini-1.5-pro";
const model = genAI.getGenerativeModel({ model: modelName });

// POST /api/ai
router.post("/", async (req, res) => {
  try {
    // Debug log for env
    console.log('Gemini API Key:', process.env.GEMINI_API_KEY);
    console.log('Gemini Model:', modelName);
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    const result = await model.generateContent(prompt);
    let reply = "";
    try {
      reply = result?.response?.text?.() || "";
    } catch (e) {
      console.error("Gemini response parse error:", e);
      reply = "[Error: Could not parse Gemini response]";
    }
    if (!reply) reply = "[Error: No reply from Gemini AI]";
    res.json({ reply });
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "AI request failed", details: err?.message || err });
  }
});

export default router;
