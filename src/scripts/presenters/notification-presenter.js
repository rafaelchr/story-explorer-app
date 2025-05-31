import NotificationHelper from '../utils/notification-helper';
import NotificationModel from '../data/notification-model';

export default class NotificationPresenter {
  constructor(view) {
    this.view = view;
    this.NotificationModel = new NotificationModel();
    this.serviceWorkerRegistration = null;
  }

  async init() {
    if (!NotificationHelper.isPushNotificationSupported()) {
      this.view.showNotificationUnsupported();
      return;
    }

    this.serviceWorkerRegistration = await NotificationHelper.registerServiceWorker();
    if (!this.serviceWorkerRegistration) {
      this.view.showNotificationUnsupported();
      return;
    }

    await this.checkSubscriptionStatus();
  }

  async checkSubscriptionStatus() {
    const subscription = await NotificationHelper.getSubscription();
    if (subscription) {
      this.view.showUnsubscribeButton();
    } else {
      this.view.showSubscribeButton();
    }
  }

  async handleSubscribe() {
    const permission = await NotificationHelper.requestPermission();
    if (permission !== 'granted') {
      this.view.showNotificationPermissionDenied();
      return;
    }

    const subscription = await NotificationHelper.subscribeUserToPush(this.serviceWorkerRegistration);
    if (subscription) {
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        try {
          await this.NotificationModel.subscribe(authToken, subscription);
          this.view.showNotificationSuccess('Berhasil berlangganan notifikasi!');
          this.view.showUnsubscribeButton();
        } catch (error) {
          console.error('Error sending subscription to backend:', error);
          this.view.showNotificationError('Gagal berlangganan notifikasi. Silakan coba lagi.');
          // If sending to backend fails, unsubscribe locally to avoid inconsistencies
          await NotificationHelper.unsubscribeUserFromPush(this.serviceWorkerRegistration);
          this.view.showSubscribeButton();
        }
      } else {
        this.view.showNotificationError('Autentikasi diperlukan untuk berlangganan notifikasi.');
        await NotificationHelper.unsubscribeUserFromPush(this.serviceWorkerRegistration);
        this.view.showSubscribeButton();
      }
    } else {
      this.view.showNotificationError('Gagal berlangganan notifikasi.');
    }
  }

  async handleUnsubscribe() {
    const subscription = await NotificationHelper.getSubscription();
    if (!subscription) {
      this.view.showNotificationError('Anda tidak berlangganan notifikasi.');
      this.view.showSubscribeButton();
      return;
    }

    const authToken = localStorage.getItem('authToken');
    if (authToken) {
      try {
        await this.NotificationModel.unsubscribe(authToken, subscription.endpoint);
        await NotificationHelper.unsubscribeUserFromPush(this.serviceWorkerRegistration);
        this.view.showNotificationSuccess('Berhasil berhenti berlangganan notifikasi.');
        this.view.showSubscribeButton();
      } catch (error) {
        console.error('Error sending unsubscription to backend:', error);
        this.view.showNotificationError('Gagal berhenti berlangganan notifikasi. Silakan coba lagi.');
      }
    } else {
      this.view.showNotificationError('Autentikasi diperlukan untuk berhenti berlangganan notifikasi.');
    }
  }
}