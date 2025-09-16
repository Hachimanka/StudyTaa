import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// --- Initialize Gemini AI ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- StudyTa AI context with plain text instructions ---
const STUDYTA_CONTEXT = `
You are the StudyTa AI assistant.
StudyTa is a learning platform for students.

Features:
- Create and join study groups
- Share notes, flashcards, and quizzes
- Track progress and scores
- Answer questions about StudyTa features

Important instructions:
- Always respond in **plain, clean text**.
- Do NOT use markdown, symbols, or formatting characters.
- Make the reply **easy to read** and aligned for chat UI.
- Provide step-by-step instructions clearly.

Here are a few examples:

Example 1:
Q: How do I join a study group?
A: Go to Groups, browse the available study groups, click Join, and confirm your choice.

Example 2:
Q: How do I create a flashcard?
A: Go to Flashcards, click Add, fill in the question and answer fields, and save.

Example 3:
Q: How do I track my progress?
A: Go to Dashboard, open the Progress tab, and view your scores and completion status.
`;

// --- AI endpoint ---
app.post("/api/ai", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    const fullPrompt = STUDYTA_CONTEXT + "\nUser: " + prompt;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(fullPrompt);

    // Clean AI reply
    const reply = result?.response?.text?.()?.replace(/\*\*/g, "") || "No reply from AI";

    res.json({ reply });
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "AI request failed", details: err.message });
  }
});

// --- Test route ---
app.get("/", (req, res) => {
  res.send("✅ StudyTa backend running with clean AI replies!");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
