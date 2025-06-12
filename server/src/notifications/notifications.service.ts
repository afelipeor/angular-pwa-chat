import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { UsersService } from '../user/users.service';

@Injectable()
export class NotificationsService {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const vapidKeys = {
      publicKey: this.configService.get<string>('VAPID_PUBLIC_KEY') ||
        'BKxUrVbKnAXkGAhCPLhwTr1VNhHcHVxl5v1xVP_qfTSgXvd0OKnO8PJlqfQEz3SjhKvhVFUJTK1MPTL5UjJ5zsg',
      privateKey: this.configService.get<string>('VAPID_PRIVATE_KEY') ||
        'your-vapid-private-key-here',
    };

    webpush.setVapidDetails(
      'mailto:admin@angular-chat.com',
      vapidKeys.publicKey,
      vapidKeys.privateKey,
    );
  }

  async subscribeUser(userId: string, subscription: any): Promise<void> {
    // Store subscription in user's device tokens
    await this.usersService.addDeviceToken(userId, JSON.stringify(subscription));
  }

  async unsubscribeUser(userId: string, subscription: any): Promise<void> {
    await this.usersService.removeDeviceToken(userId, JSON.stringify(subscription));
  }

  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    data?: any,
  ): Promise<void> {
    try {
      const user = await this.usersService.findOne(userId);

      if (!user.deviceTokens || user.deviceTokens.length === 0) {
        console.log(`No device tokens found for user ${userId}`);
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
        },
      });

      const promises = user.deviceTokens.map(async (tokenString) => {
        try {
          const subscription = JSON.parse(tokenString);
          await webpush.sendNotification(subscription, payload);
        } catch (error) {
          console.error(`Failed to send notification to token:`, error);
          // Remove invalid token
          await this.usersService.removeDeviceToken(userId, tokenString);
        }
      });

      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  async sendNewMessageNotification(
    recipientIds: string[],
    senderName: string,
    chatName: string,
    messageContent: string,
    chatId: string,
  ): Promise<void> {
    const title = chatName || `${senderName}`;
    const body = `${senderName}: ${messageContent}`;

    const promises = recipientIds.map(userId =>
      this.sendNotificationToUser(userId, title, body, { chatId })
    );

    await Promise.allSettled(promises);
  }
}
