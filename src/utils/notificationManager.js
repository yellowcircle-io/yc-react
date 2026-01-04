/**
 * Notification Manager - Stub implementation
 * Provides in-memory notification storage for the Unity Notes app
 */

export const NotificationType = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

class NotificationManager {
  constructor() {
    this.notifications = [];
    this.subscribers = [];
    this.idCounter = 0;
  }

  addNotification(message, type = NotificationType.INFO, duration = 5000) {
    const notification = {
      id: ++this.idCounter,
      message,
      type,
      timestamp: Date.now(),
      duration,
    };
    this.notifications.push(notification);
    this._notify();

    if (duration > 0) {
      setTimeout(() => this.removeNotification(notification.id), duration);
    }

    return notification.id;
  }

  removeNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this._notify();
  }

  getAll() {
    return [...this.notifications];
  }

  clear() {
    this.notifications = [];
    this._notify();
  }

  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  _notify() {
    this.subscribers.forEach(cb => cb(this.getAll()));
  }
}

const notificationManager = new NotificationManager();
export default notificationManager;
