// backend/geminiConfig.js
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Gemini with your API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default genAI;
