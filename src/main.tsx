import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ToastProvider } from './components/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <App />
      </ToastProvider>
    </ErrorBoundary>
  </StrictMode>
);
