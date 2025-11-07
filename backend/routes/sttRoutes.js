import express from 'express';
import multer from 'multer';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/stt - accepts an audio file (field name: audio) and returns a transcript
router.post('/stt', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) return res.status(400).json({ error: 'No audio file uploaded. Use field name `audio`.' });

    // If OPENAI_API_KEY is not configured, return a helpful message so deployments are aware
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(501).json({ error: 'STT not configured on server. Set OPENAI_API_KEY (or another STT provider) to enable server-side transcription.' });
    }

    // Prepare FormData for OpenAI Whisper endpoint
    // Node 18+ has global FormData and Blob
    const formData = new FormData();
    // Create a Blob from the uploaded buffer
    const audioBlob = new Blob([req.file.buffer], { type: req.file.mimetype || 'application/octet-stream' });
    formData.append('file', audioBlob, req.file.originalname || 'recording.webm');
    formData.append('model', 'whisper-1');

    const resp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: formData
    });

    if (!resp.ok) {
      const txt = await resp.text().catch(() => '')
      console.error('OpenAI STT error', resp.status, txt)
      return res.status(502).json({ error: 'STT provider error', details: txt || resp.statusText });
    }

    const json = await resp.json();
    // OpenAI Whisper returns { text: 'transcription...' }
    const transcript = json.text || json.transcript || '';
    return res.json({ transcript });
  } catch (err) {
    console.error('STT error', err);
    res.status(500).json({ error: 'STT failed', details: err.message });
  }
});

export default router;
