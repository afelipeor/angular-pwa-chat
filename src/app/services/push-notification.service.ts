import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { SwPush } from '@angular/service-worker';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  readonly VAPID_PUBLIC_KEY =
    'BKxUrVbKnAXkGAhCPLhwTr1VNhHcHVxl5v1xVP_qfTSgXvd0OKnO8PJlqfQEz3SjhKvhVFUJTK1MPTL5UjJ5zsg';

  constructor(private swPush: SwPush, private http: HttpClient) {}

  subscribeToNotifications(): void {
    if (!this.swPush.isEnabled) {
      console.log('Push notifications are not enabled');
      return;
    }

    this.swPush
      .requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC_KEY,
      })
      .then((sub) => {
        console.log('Push subscription:', sub);
        this.sendSubscriptionToServer(sub);
      })
      .catch((err) =>
        console.error('Could not subscribe to notifications', err)
      );
  }

  private sendSubscriptionToServer(subscription: PushSubscription): void {
    // In a real app, send this subscription to your backend
    console.log('Subscription sent to server:', subscription);
  }

  showNotification(title: string, body: string, data?: any): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        data,
      });
    }
  }

  requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return Promise.resolve('denied');
    }
    return Notification.requestPermission();
  }
}
