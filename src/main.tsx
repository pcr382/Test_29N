import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Registrar Service Worker únicamente en la app compilada (PROD), no en la vista previa
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[PWA] Error al registrar Service Worker:', err);
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
