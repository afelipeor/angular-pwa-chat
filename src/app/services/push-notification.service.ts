import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { SwPush } from '@angular/service-worker';
import { EMPTY, catchError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PushNotificationService {
  private readonly VAPID_PUBLIC_KEY =
    'BKxUrVbKnAXkGAhCPLhwTr1VNhHcHVxl5v1xVP_qfTSgXvd0OKnO8PJlqfQEz3SjhKvhVFUJTK1MPTL5UjJ5zsg';

  private readonly swPush = inject(SwPush);
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl || 'http://localhost:3001/api';

  /**
   * Subscribe to push notifications
   * @returns Promise that resolves when subscription is complete
   */
  subscribeToNotifications(): Promise<void> {
    if (!this.swPush.isEnabled) {
      console.warn('Push notifications are not enabled');
      return Promise.resolve();
    }

    return this.swPush
      .requestSubscription({
        serverPublicKey: this.VAPID_PUBLIC_KEY,
      })
      .then((subscription: PushSubscription) => {
        console.log('Push subscription successful:', subscription);
        this.sendSubscriptionToServer(subscription);
      })
      .catch((error: Error) => {
        console.error('Could not subscribe to notifications:', error);
        throw error;
      });
  }

  getVapidPublicKey(): string {
    return this.VAPID_PUBLIC_KEY;
  }

  /**
   * Send subscription to server
   * @param subscription - The push subscription object
   */
  private sendSubscriptionToServer(subscription: PushSubscription): void {
    const subscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
      },
    };

    // Get auth token from localStorage
    const token = localStorage.getItem('token');

    if (!token) {
      console.warn('No auth token found, cannot subscribe to notifications');
      return;
    }

    this.http
      .post(`${this.apiUrl}/notifications/subscribe`, subscriptionData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .pipe(
        catchError((error) => {
          console.error('Failed to send subscription to server:', error);
          return EMPTY;
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Subscription sent to server successfully:', response);
        },
      });
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
  /**
   * Show a notification to the user
   * @param title - Notification title
   * @param body - Notification body
   * @param data - Optional data payload
   */
  showNotification(
    title: string,
    body: string,
    data?: Record<string, unknown>
  ): void {
    console.log('Attempting to show notification:', title, body);

    if (!('Notification' in window)) {
      console.warn('Notifications are not supported in this browser');
      return;
    }

    console.log('Notification permission:', Notification.permission);

    if (Notification.permission === 'granted') {
      try {
        const notification = new Notification(title, {
          body,
          icon: '/assets/icons/icon-192x192.png',
          badge: '/assets/icons/icon-72x72.png',
          data,
          requireInteraction: false, // Auto dismiss
          silent: false,
        });

        console.log('Notification created successfully:', notification);

        // Auto-close notification after 5 seconds
        setTimeout(() => {
          notification.close();
        }, 5000);

        // Handle notification click
        notification.onclick = () => {
          console.log('Notification clicked');
          window.focus();
          notification.close();
        };
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    } else if (Notification.permission === 'default') {
      console.warn(
        'Notification permission not requested yet, requesting now...'
      );
      this.requestNotificationPermission().then((permission) => {
        if (permission === 'granted') {
          this.showNotification(title, body, data);
        }
      });
    } else {
      console.warn('Notification permission denied');
    }
  }

  /**
   * Request notification permission from the user
   * @returns Promise that resolves with the permission status
   */
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications are not supported in this browser');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission;
    } catch (error: unknown) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Check if notifications are supported and permitted
   * @returns boolean indicating if notifications are available
   */
  isNotificationSupported(): boolean {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  /**
   * Get current notification permission status
   * @returns current permission status
   */
  getNotificationPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }
}
