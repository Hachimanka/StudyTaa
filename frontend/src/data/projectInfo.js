// Project summary for AI prompts and developer reference
const PROJECT_INFO = "Lemivon — project summary\n\n" +
"Overview\n" +
"- Monorepo with two main folders: 'backend/' (Express + Node + MongoDB) and 'frontend/' (Vite + React).\n" +
"- Primary purpose: study productivity app with features for calendar events, flashcards, summaries, a user library, and focus music.\n\n" +
"Frontend\n" +
"- Location: 'frontend/'\n" +
"- Stack: Vite + React, Tailwind/CSS, many components under 'frontend/src/components' and pages under 'frontend/src/pages'.\n" +
"- Key pages: 'Calendar.jsx' (image OCR -> event extraction -> preview -> save), 'Flashcards.jsx', 'Summarize.jsx', 'Library.jsx', 'Music.jsx', 'Dashboard.jsx'.\n" +
"- Contexts: 'AuthContext', 'SettingsContext', 'MusicContext', 'ReminderContext' manage global state.\n" +
"- Uploads: frontend posts to backend endpoints '/api/image/ocr', '/api/events', '/api/pdf/extract-text', '/api/ai'.\n\n" +
"Backend\n" +
"- Location: 'backend/'\n" +
"- Stack: Express, Mongoose models, tesseract.js usage for OCR, optional 'sharp' for preprocessing (if added), PDF extraction with 'pdf2json'.\n" +
"- Key routes: '/api/image/ocr' (image OCR), '/api/pdf/extract-text' (PDF text extraction), '/api/ai' (proxy to Gemini/OpenAI/other generative AI), '/api/events' (calendar events), '/api/library' (file/library endpoints), '/api/sessions' (study sessions if present), '/api/stt' (server-side STT stub).\n" +
"- AI config: backend reads GEMINI_API_KEY from env; AI context and prompt templates are defined in backend/server.js (constant STUDYTA_CONTEXT). If GEMINI_API_KEY is missing or invalid, AI endpoints return clear error guidance.\n\n" +
"OCR & Calendar Flow (important details)\n" +
"- User uploads an image in Calendar page -> frontend POST '/api/image/ocr'.\n" +
"- Backend runs Tesseract (server-side) and returns raw text.\n" +
"- Frontend 'Calendar.jsx' formats raw OCR text (functions: formatOCRText, enhanceImageOCRText, preprocessTextForAI) and runs local heuristics (extractDayEventPairs, comprehensiveDateExtraction) to find day + title patterns.\n" +
"- If initial OCR is poor, frontend performs a canvas-based enhancement and retries '/api/image/ocr' with enhanced image.\n" +
"- If AI fails to extract events, frontend can run client-side tesseract.js fallback (dynamic loader) and re-run local parsing or call AI again.\n" +
"- Final events are shown in a preview modal and saved via POST '/api/events' (requires auth token in localStorage). The app expects 'Authorization: Bearer <user._id>' as the token format.\n\n" +
"AI Prompting\n" +
"- Backend has a default STUDYTA_CONTEXT that frames AI as the app assistant; this can be extended with project-specific facts.\n" +
"- Frontend builds prompts for '/api/ai' including cleaned OCR text and instructions; you can prepend PROJECT_INFO to these prompts to reduce hallucination.\n\n" +
"Authentication & Persistence\n" +
"- Auth token stored in localStorage.token (frontend uses this to set Authorization headers).\n" +
"- Backend uses Mongoose and expects MONGO_URI env var.\n\n" +
"Deployment & Env\n" +
"- Frontend env: VITE_API_BASE (backend base URL used at runtime)\n" +
"- Backend env: MONGO_URI, GEMINI_API_KEY, EMAIL_USER, EMAIL_PASS, FRONTEND_BASE, BACKEND_BASE.\n\n" +
"Developer Notes\n" +
"- To make AI replies align with reality, keep a small, authoritative PROJECT_INFO string (this file) and prepend it to AI prompts in ChatWidget.jsx or before calls to /api/ai.\n" +
"- If chat UI was edited and later reverted, prefer adding a server-side injection in backend/server.js where STUDYTA_CONTEXT is defined: extend STUDYTA_CONTEXT with PROJECT_INFO text for consistent server-side grounding.\n" +
"- For OCR difficulties on colorful/complex calendar images, prefer a two-pass approach: server Tesseract + image preprocessing ('sharp') and a client-side Tesseract fallback. Also add local regex heuristics for day+title extraction before relying on AI.\n\n" +
"How to use this file\n" +
"- Import PROJECT_INFO in frontend/src/components/ChatWidget.jsx or in frontend/src/pages/Calendar.jsx and include it at the top of prompts sent to /api/ai to ensure AI knows exactly what the project supports.\n\n" +
"End of summary.";

export default PROJECT_INFO;
