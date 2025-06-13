import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private configService: ConfigService,
    private usersService: UsersService
  ) {
    this.initializeWebPush();
  }

  private initializeWebPush() {
    try {
      const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
      const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
      const subject =
        this.configService.get<string>('VAPID_SUBJECT') ||
        'mailto:admin@angular-chat.com';

      if (!publicKey || !privateKey) {
        this.logger.warn(
          'VAPID keys not configured. Push notifications will be disabled.'
        );
        return;
      }

      // Validate key lengths
      if (publicKey.length !== 88) {
        this.logger.error(
          'VAPID public key should be 65 bytes (88 characters in base64url)'
        );
        return;
      }

      if (privateKey.length !== 44) {
        this.logger.error(
          'VAPID private key should be 32 bytes (44 characters in base64url)'
        );
        return;
      }

      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.logger.log('Web Push notifications configured successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize web push: ${error.message}`);
    }
  }

  async subscribeUser(userId: string, subscription: any): Promise<void> {
    try {
      await this.usersService.addDeviceToken(
        userId,
        JSON.stringify(subscription)
      );
      this.logger.log(`User ${userId} subscribed to push notifications`);
    } catch (error) {
      this.logger.error(`Failed to subscribe user ${userId}: ${error.message}`);
      throw error;
    }
  }

  async unsubscribeUser(userId: string, subscription: any): Promise<void> {
    try {
      await this.usersService.removeDeviceToken(
        userId,
        JSON.stringify(subscription)
      );
      this.logger.log(`User ${userId} unsubscribed from push notifications`);
    } catch (error) {
      this.logger.error(
        `Failed to unsubscribe user ${userId}: ${error.message}`
      );
      throw error;
    }
  }

  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    try {
      const user = await this.usersService.findOne(userId);

      if (!user.deviceTokens || user.deviceTokens.length === 0) {
        this.logger.debug(`No device tokens found for user ${userId}`);
        return;
      }

      const payload = JSON.stringify({
        title,
        body,
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        data: {
          ...data,
          url: data?.chatId ? `/chat/${data.chatId}` : '/',
          timestamp: Date.now(),
        },
        actions: [
          {
            action: 'open',
            title: 'Open Chat',
          },
          {
            action: 'close',
            title: 'Close',
          },
        ],
      });

      const promises = user.deviceTokens.map(async (tokenString) => {
        try {
          const subscription = JSON.parse(tokenString);
          await webpush.sendNotification(subscription, payload);
          this.logger.debug(`Notification sent successfully to user ${userId}`);
        } catch (error) {
          this.logger.error(
            `Failed to send notification to user ${userId}: ${error.message}`
          );
          // Remove invalid subscription
          await this.usersService.removeDeviceToken(userId, tokenString);
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      this.logger.error(
        `Error sending notification to user ${userId}: ${error.message}`
      );
    }
  }

  async sendNotificationToChat(
    chatId: string,
    title: string,
    body: string,
    excludeUserId?: string,
    data?: any
  ): Promise<void> {
    try {
      // This would require ChatsService to get chat participants
      // For now, we'll just log that this feature needs implementation
      this.logger.warn('sendNotificationToChat not fully implemented yet');
    } catch (error) {
      this.logger.error(
        `Error sending notification to chat ${chatId}: ${error.message}`
      );
    }
  }

  getVapidPublicKey(): string {
    return this.configService.get<string>('VAPID_PUBLIC_KEY') || '';
  }
}
