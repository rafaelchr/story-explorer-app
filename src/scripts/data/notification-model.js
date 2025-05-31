class NotificationModel {
  constructor() {
    this.baseUrl = "https://story-api.dicoding.dev/v1"; // Your API base URL
  }

  async subscribe(token, subscription) {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.toJSON().keys.p256dh,
            auth: subscription.toJSON().keys.auth,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error subscribing to push notification:", error);
      throw error;
    }
  }

  async unsubscribe(token, endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}/notifications/subscribe`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ endpoint }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error unsubscribing from push notification:", error);
      throw error;
    }
  }
}

export default NotificationModel;