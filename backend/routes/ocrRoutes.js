
import express from 'express';
import multer from 'multer';
import Tesseract from 'tesseract.js';
import path from 'path';
import fs from 'fs';
import mammoth from 'mammoth';
import sharp from 'sharp';
import { fileURLToPath } from 'url';


// ...existing code...

const router = express.Router();

// Resolve an absolute uploads directory next to this file (../uploads)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../uploads');

// Ensure uploads directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage with absolute destination and stable filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, '_');
    cb(null, `${Date.now()}_${base}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB for images/docs
});

// POST /api/word/extract-text
router.post('/word/extract-text', upload.single('word'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No Word file uploaded' });
  }
  try {
    const wordPath = path.resolve(req.file.path);
    const result = await mammoth.extractRawText({ path: wordPath });
    fs.unlinkSync(wordPath); // Clean up uploaded file
    res.json({ text: result.value });
  } catch (err) {
    res.status(500).json({ error: 'Word extraction failed', details: err.message });
  }
});

// POST /api/image/ocr
router.post('/image/ocr', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image uploaded' });
  }
  try {
    const imagePath = path.resolve(req.file.path);
    // Allow tesseract to cache traineddata locally to avoid repeated downloads
    const tessCache = path.join(uploadsDir, '.tess-cache');
    if (!fs.existsSync(tessCache)) fs.mkdirSync(tessCache, { recursive: true });
    // Try OCR on original image first
    let combinedText = '';
    try {
      const { data: { text: rawText } } = await Tesseract.recognize(imagePath, 'eng', {
        cachePath: tessCache,
        langPath: uploadsDir,
        logger: () => {},
      });
      if (rawText && rawText.trim()) combinedText += rawText + '\n';
    } catch (err) {
      // continue to enhanced attempt
      console.warn('Tesseract original pass failed:', err?.message || err);
    }

    // Create an enhanced (grayscale + contrast + sharpen) copy and OCR that too
    const enhancedPath = imagePath + '_enhanced.png';
    try {
      await sharp(imagePath)
        .grayscale()
        .normalise()
        .linear(1.2, -10)
        .sharpen()
        .toFile(enhancedPath);

      try {
        const { data: { text: enhancedText } } = await Tesseract.recognize(enhancedPath, 'eng', {
          cachePath: tessCache,
          langPath: uploadsDir,
          logger: () => {},
        });
        if (enhancedText && enhancedText.trim()) combinedText += enhancedText;
      } catch (err2) {
        console.warn('Tesseract enhanced pass failed:', err2?.message || err2);
      }
    } catch (enhErr) {
      console.warn('Image enhancement failed:', enhErr?.message || enhErr);
    }

    // Clean up uploaded files
    try { if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath); } catch(_) {}
    try { if (fs.existsSync(enhancedPath)) fs.unlinkSync(enhancedPath); } catch(_) {}

    // If both passes produced nothing, return an error; otherwise return combined text
    if (!combinedText || !combinedText.trim()) {
      return res.status(500).json({ error: 'OCR produced no text' });
    }
    res.json({ text: combinedText });
  } catch (err) {
    // Attempt to clean up file on failure
    try { if (req.file?.path) fs.unlinkSync(req.file.path); } catch (_) {}
    res.status(500).json({ error: 'OCR failed', details: err.message || 'Unknown error' });
  }
});

export default router;
