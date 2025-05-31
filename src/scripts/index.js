// index.js
// CSS imports
import '../styles/styles.css';

import App from './pages/app';
import NotificationHelper from './utils/notification-helper'; // Import NotificationHelper

document.addEventListener('DOMContentLoaded', async () => {
  // Register the service worker early
  if (NotificationHelper.isPushNotificationSupported()) {
    await NotificationHelper.registerServiceWorker();
  }

  const app = new App({
    content: document.querySelector('#main-content'),
    drawerButton: document.querySelector('#drawer-button'),
    navigationDrawer: document.querySelector('#navigation-drawer'),
  });
  await app.renderPage();

  window.addEventListener('hashchange', async () => {
    await app.renderPage();
  });

  // Skip link functionality (existing code)
  const skipLink = document.getElementById('skip-to-content');
  if (skipLink) {
    skipLink.addEventListener('click', (event) => {
      event.preventDefault();
      const target = document.getElementById('main-section');
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }
});