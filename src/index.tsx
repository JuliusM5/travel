import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/index.css';
import App from './App';
import { notificationService } from './services/notificationService';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Initialize notifications and service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // Initialize notification service
      const notificationsEnabled = await notificationService.initialize();
      console.log('Notifications enabled:', notificationsEnabled);
      
      // Enable background sync if available
      if (notificationsEnabled) {
        await notificationService.enableBackgroundSync();
      }
    } catch (error) {
      console.error('Failed to initialize service worker:', error);
    }
  });
}