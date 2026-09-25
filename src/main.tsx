import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './context/LanguageContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Safely register PWA service worker without risking root module execution crashes
try {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    import('virtual:pwa-register')
      .then(({ registerSW }) => {
        registerSW({ immediate: true });
      })
      .catch((swErr) => {
        console.warn('PWA ServiceWorker registration notice (offline cache ready):', swErr);
      });
  }
} catch (e) {
  console.warn('ServiceWorker not initialized:', e);
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
}

