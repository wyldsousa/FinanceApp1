import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/service-worker.js')
      .then((registration) => {
        console.log('[PWA] Service Worker registered:', registration.scope);
        
        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version available');
                // Optionally show update notification
                if (confirm('Nova versão disponível! Deseja atualizar?')) {
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('[PWA] Service Worker registration failed:', error);
      });
  });
}

// Handle beforeinstallprompt for PWA installation
let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Store the event for later use
  deferredPrompt = e;
  console.log('[PWA] Install prompt available');
});

// Export function to trigger install prompt
export function triggerInstall() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted install');
      } else {
        console.log('[PWA] User dismissed install');
      }
      deferredPrompt = null;
    });
  }
}

// Check if app is installed
window.addEventListener('appinstalled', () => {
  console.log('[PWA] App installed');
  deferredPrompt = null;
});

// Online/Offline detection
window.addEventListener('online', () => {
  console.log('[PWA] App is online');
});

window.addEventListener('offline', () => {
  console.log('[PWA] App is offline');
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
