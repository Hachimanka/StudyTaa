# Deploying StudyTaa (Frontend → Vercel, Backend → Render)

This document contains step-by-step instructions to deploy the StudyTaa project (monorepo) with the frontend served on Vercel and backend on Render. It includes the exact env vars/secrets to set, GitHub Actions notes, and how to test voice (Web Speech API) across devices.

---

## Overview
- Frontend: `frontend/` (Vite + React) → Deploy to Vercel (automatic HTTPS)
- Backend: `backend/` (Express + Node) → Deploy to Render (HTTPS)
- CI: GitHub Actions included (optional). The repo has two workflows under `.github/workflows/`:
  - `frontend-deploy.yml` (build & deploy to Vercel via CLI)
  - `backend-deploy.yml` (run backend tests and trigger Render deploy via API)

Keep the repo as a monorepo. Vercel and Render both support deploying from a subdirectory.

---

## Before you start
1. Ensure the code is pushed to GitHub and you have admin access to the repository.
2. Create accounts on:
   - Vercel (https://vercel.com)
   - Render (https://render.com)
3. Create the following secrets (we'll reference them in the steps):
   - `VITE_API_BASE` (frontend build time): your backend API base URL, e.g. `https://api.yourdomain.com`
   - `VERCEL_TOKEN` (Vercel CLI token) — see Vercel settings
   - `RENDER_API_KEY` (Render API key)
   - `RENDER_SERVICE_ID` (Render service ID for your backend service)

You will also need backend-specific env vars (set in Render service settings):
- `MONGO_URI` — your MongoDB connection string
- `GEMINI_API_KEY` — or other AI provider keys
- `EMAIL_USER` / `EMAIL_PASS` — SMTP credentials (if used)
- `FRONTEND_BASE` — your frontend base URL (e.g., `https://app.yourdomain.com`) used for email links
- `BACKEND_BASE` — (optional) the public backend URL `https://api.yourdomain.com`

Add these secrets into GitHub repository Settings → Secrets if you want GitHub Actions to use them.

---

## 1) Deploy frontend to Vercel (recommended)
A. Create a new project in Vercel
1. In Vercel Dashboard → New Project → Import Git Repository → choose your StudyTaa repo.
2. When Vercel asks for the root, set "Root Directory" to `/frontend`.
3. Under "Build & Output Settings" (if needed):
   - Build Command: `npm run build`
   - Output Directory: `dist`

B. Environment Variables (Project Settings → Environment Variables)
- `VITE_API_BASE` = `https://api.yourbackend.com` (your Render backend URL)

C. Deploy
- Vercel will build automatically on each push to the configured branch. You can also run a manual deploy from the Vercel UI.

Notes:
- Vercel provides HTTPS by default. This is required for Web Speech API to work on real devices (not localhost).
- If you prefer Vercel to build for you instead of the GitHub Action, you can disable the frontend Action or keep it for redundancy.

---

## 2) Deploy backend to Render
A. Create a new Web Service on Render
1. In Render Dashboard → New → Web Service → Connect to GitHub repo → select StudyTaa.
2. Set the "Root Directory" to `/backend`.
3. Runtime: Node (use the default or specify Node 18+) and the start command (if present in `package.json`) e.g. `node server.js` or `npm start`.

B. Environment
- Add the required env vars in Render's Environment tab (Key/Value):
  - `MONGO_URI`, `GEMINI_API_KEY`, `EMAIL_USER`, `EMAIL_PASS`
  - `FRONTEND_BASE` = `https://app.yourfrontend.com`
  - `BACKEND_BASE` = `https://api.yourbackend.com` (optional)

C. Deploy
- Render will start a build and deploy. After successful deploy you'll get a secure `https://...onrender.com` URL — use this as `VITE_API_BASE` in Vercel.

D. CORS note
- Ensure your backend `server.js` accepts requests from the frontend origin. Example (in `backend/server.js` near your `cors()` call):
```js
const FRONTEND_BASE = process.env.FRONTEND_BASE || 'http://localhost:5173';
app.use(cors({ origin: FRONTEND_BASE, credentials: true }));
```
Adjust accordingly if you want multiple origins.

---

## 3) GitHub Actions (already added)
Workflows were added at `.github/workflows/`:
- `frontend-deploy.yml` builds the frontend and runs `vercel --prod` with `VERCEL_TOKEN`.
- `backend-deploy.yml` installs backend deps, runs tests (if any), and triggers a Render deploy using `RENDER_API_KEY` + `RENDER_SERVICE_ID`.

GitHub Secrets to set (Settings → Secrets → Actions):
- `VITE_API_BASE` (only if using Action during build)
- `VERCEL_TOKEN` (Vercel deploy via CLI)
- `RENDER_API_KEY` (optional if you want workflow to trigger Render)
- `RENDER_SERVICE_ID` (Render service ID)

If you prefer Vercel's native Git integration to handle builds, set the Vercel project to `/frontend` and keep `VITE_API_BASE` in Vercel settings (no Action needed for frontend).

---

## 4) Testing voice (Web Speech API) across devices
Requirements:
- The frontend must be served over HTTPS (Vercel meets this).
- Browser support: Chrome/Edge on desktop and Android provide SpeechRecognition. iOS Safari historically lacks Web Speech API support; use a fallback (see Optional section below).

A. Quick test after deploy
1. Visit your frontend URL: `https://app.yourfrontend.com`.
2. Open the Chat widget and click the microphone.
3. The browser should prompt to allow microphone access; allow it.
4. Speak a command like "open the library". The widget should transcribe and perform action.

B. If you see "Voice recognition error: not-allowed"
- Check the site is HTTPS. If not, redeploy on Vercel or use ngrok for dev testing.
- Check site-specific microphone permission (click padlock → Site settings → Microphone → Allow).
- If the user earlier denied permissions, they must re-enable it in browser settings.

C. Testing from other devices
- Use the public Vercel URL and open it on each device. Microphone permission prompts will appear on each device.
- For dev LAN testing, use ngrok to expose your local frontend over HTTPS and set `VITE_API_BASE` to your local backend tunnel.
  ```powershell
  # example: run in terminal where frontend dev server runs
  ngrok http 5173
  # take the https://... ngrok URL and use it on device
  ```

---

## 5) Optional: Add server-side STT fallback for iOS / unsupported browsers
iOS Safari may not support the Web Speech API. Implementing a fallback using `MediaRecorder` + server-side STT (Whisper/Google) ensures voice works everywhere.

High level:
1. Client records audio via `navigator.mediaDevices.getUserMedia` and `MediaRecorder`.
2. Upload the audio blob to backend endpoint `POST /api/stt`.
3. Backend forwards audio to STT service (OpenAI Whisper API, Google Speech-to-Text) and returns the transcript.
4. Client receives transcript and continues as if SpeechRecognition produced it.

I can implement a minimal recorder + endpoint stub for you (requires an STT provider API key).

---

## Artifacts added to this repository
I added several optional deployment and tooling artifacts to help local testing and alternative deployments:

- `backend/Dockerfile` — Docker image for the backend (Node 18).
- `frontend/Dockerfile` — Docker multi-stage build to produce a static bundle served by nginx.
- `docker-compose.yml` — Brings up `mongo` + `backend` for local testing.
- `frontend/vercel.json` — Minimal Vercel config for the frontend subdirectory.
- `backend/render.yaml` — Example Render manifest for the backend service.
- `.env.example` — Template of env vars used by frontend/backend and CI.
- `backend/routes/sttRoutes.js` — Server-side STT endpoint that accepts `multipart/form-data` audio uploads at `POST /api/stt`. When `OPENAI_API_KEY` is present it attempts transcription via OpenAI Whisper; otherwise it returns a helpful 501 message.

How to try Docker compose locally (quick):

```powershell
# from repo root
docker compose up --build
# backend will be available at http://localhost:5000 and Mongo at mongodb://localhost:27017
```

Note: The `docker-compose.yml` only includes the backend and a MongoDB service for local testing. The frontend is typically deployed on Vercel; use the frontend Dockerfile or `serve -s dist` for container testing if desired.

---

## 6) Environment summary (what to set in provider dashboards)
Frontend (Vercel project env):
- `VITE_API_BASE` = `https://api.yourbackend.com`

Backend (Render service env):
- `MONGO_URI`
- `GEMINI_API_KEY`
- `EMAIL_USER`, `EMAIL_PASS` (if using email)
- `FRONTEND_BASE` = `https://app.yourfrontend.com`
- `BACKEND_BASE` = `https://api.yourbackend.com` (optional)

GitHub repository secrets (for Actions):
- `VERCEL_TOKEN`
- `VITE_API_BASE` (if building in Actions)
- `RENDER_API_KEY` (optional)
- `RENDER_SERVICE_ID` (optional)

---

## 7) Troubleshooting
- Mic permission errors: check HTTPS origin and site permission. For "not-allowed" call out the browser site settings.
- CORS errors: ensure the backend `cors()` allows your frontend origin.
- Deploy build failures: inspect Vercel/Render logs. Typical causes: missing env vars, build target incorrectly set to project root, wrong Node version.

---

## 8) Helpful commands (PowerShell)
Build and run frontend locally (dev):
```powershell
cd frontend
npm install
npm run dev
```
Build frontend for production locally:
```powershell
cd frontend
npm ci
npm run build
# serve dist with a static server (optional)
npm install -g serve
serve -s dist
```
Build and run backend locally:
```powershell
cd backend
npm install
# run dev or start
npm run dev  # if you have a dev script
node server.js
```
Expose local frontend to HTTPS (ngrok):
```powershell
# requires ngrok installed and authtoken set
ngrok http 5173
```

---

If you want, I can:
- Produce `README-DEPLOY.md` (this file) in the repo — done.
- Add a small `./.env.example` with the env var names (I can create it next).
- Implement the MediaRecorder + `/api/stt` fallback — tell me which STT provider you'd like (OpenAI Whisper API or Google Speech-to-Text) and I will wire a working stub.

Which next step should I take for you? (Create `.env.example`, implement the STT fallback, or add GitHub Action tweaks?)
