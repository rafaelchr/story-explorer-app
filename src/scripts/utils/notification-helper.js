const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

const NotificationHelper = {
  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported in this browser.');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      // console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  },

  async requestPermission() {
    const permission = await Notification.requestPermission();
    if (permission === 'denied') {
      console.log('Notification permission denied.');
    } else if (permission === 'default') {
      console.log('Notification permission dismissed.');
    } else {
      console.log('Notification permission granted.');
    }
    return permission;
  },

  async subscribeUserToPush(registration) {
    if (!('PushManager' in window)) {
      console.log('Push Messaging not supported.');
      return null;
    }

    try {
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
      const options = {
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      };
      const subscription = await registration.pushManager.subscribe(options);
      console.log('User is subscribed:', subscription);
      return subscription;
    } catch (err) {
      console.error('Failed to subscribe the user: ', err);
      return null;
    }
  },

  async unsubscribeUserFromPush(registration) {
    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('User is unsubscribed.');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to unsubscribe the user: ', err);
      return false;
    }
  },

  async getSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return null;
    }
    const registration = await navigator.serviceWorker.ready;
    return registration.pushManager.getSubscription();
  },

  isPushNotificationSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  },
};

export default NotificationHelper;