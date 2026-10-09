import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

// Support direct URL hits on GitHub Pages without hash (e.g. /reset-password?token=... or /google-login-success)
if (window.location.pathname.includes('/reset-password') && !window.location.hash.includes('/reset-password')) {
  const token = new URLSearchParams(window.location.search).get('token');
  const targetHash = token ? `#/reset-password?token=${encodeURIComponent(token)}` : '#/reset-password';
  const basePath = window.location.pathname.replace(/\/reset-password.*$/, '/');
  window.history.replaceState(null, '', basePath + targetHash);
} else if (window.location.pathname.includes('/google-login-success') && !window.location.hash.includes('/google-login-success')) {
  const basePath = window.location.pathname.replace(/\/google-login-success.*$/, '/');
  window.history.replaceState(null, '', basePath + '#/google-login-success');
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <App />
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>
)