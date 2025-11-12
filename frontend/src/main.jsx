import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import axios from 'axios'

// Configure axios to use VITE_API_BASE when present (for LAN or deployed backend)
const API_BASE = import.meta.env.VITE_API_BASE || ''
if (API_BASE) axios.defaults.baseURL = API_BASE

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
