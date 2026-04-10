import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'
import { fetchLsns, setBaseUrl, setUseMock } from '@/api';

async function init() {
  const useMock = import.meta.env.VITE_USE_MOCK_API;
  const baseUrl = import.meta.env.VITE_API_Base_URL;

  // Set initial state from env
  setUseMock(useMock === 'true' || import.meta.env.DEV);
  if (baseUrl) {
    setBaseUrl(baseUrl);
  }

  // Only prompt if we're not using mock and no env var is set
  if (!useMock && !baseUrl) {
    let success = false;
    while (!success) {
      const url = prompt('Please enter backend API base URL');
      if (url) {
        setBaseUrl(url);
        try {
          await fetchLsns();
          success = true;
        } catch (err) {
          alert(`Failed to connect to backend at ${url}: ${err}. Please try again.`);
        }
      } else {
        // user clicked cancel or entered empty string, keep asking
        alert('Base URL is required to connect to backend.');
      }
    }
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}

init();
