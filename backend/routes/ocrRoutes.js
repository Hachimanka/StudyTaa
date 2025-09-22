
import express from 'express';
import multer from 'multer';
import Tesseract from 'tesseract.js';
import path from 'path';
import fs from 'fs';
import mammoth from 'mammoth';


// ...existing code...

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

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
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng');
    fs.unlinkSync(imagePath); // Clean up uploaded file
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: 'OCR failed', details: err.message });
  }
});

export default router;
