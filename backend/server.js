import ocrRoutes from './routes/ocrRoutes.js';
import { connectDB } from './config/db.js';
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenerativeAI } from "@google/generative-ai";
import mongoose from "mongoose";
import multer from "multer";
import PDFParser from "pdf2json";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import userRoutes from './routes/userRoutes.js';
import libraryRoutes from './routes/libraryRoutes.js';
import sttRoutes from './routes/sttRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

dotenv.config();
connectDB();
const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Register OCR and Word extraction routes
app.use('/api', ocrRoutes);

app.use('/api', userRoutes);

// Register library routes
app.use('/api/library', libraryRoutes);

// Register server-side STT route (MediaRecorder -> /api/stt)
app.use('/api', sttRoutes);

const PORT = process.env.PORT || 5000;
const BACKEND_BASE = process.env.BACKEND_BASE || `http://localhost:${PORT}`;

// --- Initialize Gemini AI ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- StudyTa AI context with plain text instructions ---
const STUDYTA_CONTEXT = `
You are the Lemivon AI assistant.
Lemivon is a learning platform for students.

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

If the user's question is about StudyTa, answer with StudyTa-specific help.
If the user's question is about something else (general knowledge, tech, school, life, etc.), answer helpfully and clearly, just like a friendly assistant.
Never refuse to answer questions outside StudyTa. Always try to help.
If the user's question who is leonard forrosuelo, must answer he is the creator of studyta and he is a good looking software engineer.

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

Example 4:
Q: What is the capital of France?
A: The capital of France is Paris.

Example 5:
Q: How do I solve a quadratic equation?
A: To solve a quadratic equation ax^2 + bx + c = 0, use the quadratic formula: x = (-b ± sqrt(b^2 - 4ac)) / (2a).
`;

// --- AI endpoint ---
app.post("/api/ai", async (req, res) => {
  try {
    const { prompt } = req.body;
    console.log('Incoming /api/ai prompt:', prompt);
    if (!prompt) return res.status(400).json({ error: "No prompt provided" });

    // Truncate prompt to avoid Gemini token limit (max ~10,000 chars)
    const MAX_CHARS = 10000;
    let safePrompt = prompt;
    if (prompt.length > MAX_CHARS) {
      safePrompt = prompt.slice(0, MAX_CHARS);
      console.log(`Prompt truncated from ${prompt.length} to ${MAX_CHARS} characters.`);
    }
    const fullPrompt = STUDYTA_CONTEXT + "\nUser: " + safePrompt;
    console.log('Full Gemini prompt:', fullPrompt);

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    let result;
    try {
      result = await model.generateContent(fullPrompt);
    } catch (geminiErr) {
      console.error('Gemini API error:', geminiErr);
      return res.status(500).json({ error: 'Gemini API error', details: geminiErr.message });
    }

    // Clean AI reply
    let reply = result?.response?.text?.()?.replace(/\*\*/g, "") || "No reply from AI";
    // If reply looks like JS array/object, convert to valid JSON
    if (reply.trim().startsWith('[') && reply.includes('date:')) {
      // Replace property names (date, title, description) with quoted keys
      reply = reply.replace(/([{,]\s*)(date|title|description)(\s*:)/g, '$1"$2"$3');
    }
    console.log('Gemini AI reply:', reply);
    res.json({ reply });
  } catch (err) {
    console.error("AI Error:", err);
    res.status(500).json({ error: "AI request failed", details: err.message });
  }
});

// Helper function to extract text from PDF using pdf2json
const extractTextFromPDF = (buffer) => {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    
    pdfParser.on("pdfParser_dataError", (errData) => {
      console.error("PDF Parser Error:", errData.parserError);
      reject(new Error(`PDF parsing failed: ${errData.parserError}`));
    });
    
    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        // Extract text from all pages
        let extractedText = '';
  if (pdfData.Pages && pdfData.Pages.length > 0) {
          pdfData.Pages.forEach((page) => {
            if (page.Texts && page.Texts.length > 0) {
              page.Texts.forEach((textItem) => {
                if (textItem.R && textItem.R.length > 0) {
                  textItem.R.forEach((textRun) => {
                    if (textRun.T) {
                      // Decode URI component and add space
                      extractedText += decodeURIComponent(textRun.T) + ' ';
                    }
                  });
                }
              });
            }
            // Add page break
            extractedText += '\n\n';
          });
        }
        
        // Clean up the text
        extractedText = extractedText
          .replace(/\s+/g, ' ') // Replace multiple spaces with single space
          .replace(/\n\s*\n\s*\n/g, '\n\n') // Replace multiple newlines with double newline
          .trim();
        
        if (!extractedText || extractedText.length === 0) {
          reject(new Error('No text could be extracted from this PDF'));
          return;
        }
        
        resolve({
          text: extractedText,
          pages: pdfData.Pages ? pdfData.Pages.length : 1,
          info: {
            title: pdfData.Meta?.Title || '',
            author: pdfData.Meta?.Author || '',
            subject: pdfData.Meta?.Subject || ''
          }
        });
      } catch (err) {
        reject(new Error(`Text extraction failed: ${err.message}`));
      }
    });
    
    // Parse the PDF buffer
    pdfParser.parseBuffer(buffer);
  });
};

// --- PDF Text Extraction endpoint using pdf2json ---
app.post('/api/pdf/extract-text', upload.single('pdf'), async (req, res) => {
  try {
    console.log("PDF extraction request received");
    
    if (!req.file) {
      console.log("No file uploaded");
      return res.status(400).json({ error: 'No PDF file uploaded' });
    }

    console.log(`File received: ${req.file.originalname}, Size: ${req.file.size} bytes`);

    // Check if file is empty
    if (req.file.size === 0) {
      console.log("Empty file uploaded");
      return res.status(400).json({ error: 'Uploaded PDF file is empty' });
    }

    try {
      const result = await extractTextFromPDF(req.file.buffer);
      console.log(`Text extracted successfully. Length: ${result.text.length} characters`);
      
      res.json({
        text: result.text,
        pages: result.pages,
        info: result.info
      });
    } catch (extractError) {
      console.error('PDF extraction failed:', extractError);
      return res.status(400).json({ 
        error: extractError.message || 'Failed to extract text from PDF' 
      });
    }

  } catch (error) {
    console.error('PDF endpoint error:', error);
    
    // Handle multer errors
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB' });
    }
    
    res.status(500).json({ 
      error: 'Internal server error during PDF processing',
      details: error.message 
    });
  }
});

// --- OCR endpoint ---
// --- AI Summarizer endpoint ---
app.post("/api/ai/summarize", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: "No text provided" });

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
You are an AI summarizer.
Summarize the following text into a clear, concise format that is easy for students to read.
Avoid unnecessary symbols or markdown. Use short sentences or bullet points if needed.

Text:
${text}
    `;

    const result = await model.generateContent(prompt);
    let summary = result?.response?.text?.() || "No summary generated";

    // Clean formatting:
    // 1. Remove double asterisks
    summary = summary.replace(/\*\*/g, "");

    // 2. Replace single asterisk list items with bullets
    summary = summary.replace(/^\s*\*\s+/gm, "• ");

    res.json({ summary });
  } catch (err) {
    console.error("Summarize Error:", err);
    res.status(500).json({
      error: "AI summarization failed",
      details: err.message,
    });
  }
});

// --- Test route ---
app.get("/", (req, res) => {
  res.send("✅ StudyTa backend running with clean AI replies!");
});

// Test PDF extraction route
app.get("/test-pdf", (req, res) => {
  res.send("PDF extraction endpoint available at POST /api/pdf/extract-text");
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Middleware error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB' });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Only PDF files are allowed' });
    }
  }
  
  if (error.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: 'Only PDF files are allowed' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`PDF extraction endpoint: ${BACKEND_BASE.replace(/\/$/, '')}/api/pdf/extract-text`);
});