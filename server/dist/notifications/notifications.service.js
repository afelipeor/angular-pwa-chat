"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const webpush = require("web-push");
const users_service_1 = require("../users/users.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(configService, usersService) {
        this.configService = configService;
        this.usersService = usersService;
        this.logger = new common_1.Logger(NotificationsService_1.name);
        this.initializeWebPush();
    }
    initializeWebPush() {
        try {
            const publicKey = this.configService.get('VAPID_PUBLIC_KEY');
            const privateKey = this.configService.get('VAPID_PRIVATE_KEY');
            const subject = this.configService.get('VAPID_SUBJECT') ||
                'mailto:admin@angular-chat.com';
            if (!publicKey || !privateKey) {
                this.logger.warn('VAPID keys not configured. Push notifications will be disabled.');
                return;
            }
            if (publicKey.length !== 88) {
                this.logger.error('VAPID public key should be 65 bytes (88 characters in base64url)');
                return;
            }
            if (privateKey.length !== 44) {
                this.logger.error('VAPID private key should be 32 bytes (44 characters in base64url)');
                return;
            }
            webpush.setVapidDetails(subject, publicKey, privateKey);
            this.logger.log('Web Push notifications configured successfully');
        }
        catch (error) {
            this.logger.error(`Failed to initialize web push: ${error.message}`);
        }
    }
    async subscribeUser(userId, subscription) {
        try {
            await this.usersService.addDeviceToken(userId, JSON.stringify(subscription));
            this.logger.log(`User ${userId} subscribed to push notifications`);
        }
        catch (error) {
            this.logger.error(`Failed to subscribe user ${userId}: ${error.message}`);
            throw error;
        }
    }
    async unsubscribeUser(userId, subscription) {
        try {
            await this.usersService.removeDeviceToken(userId, JSON.stringify(subscription));
            this.logger.log(`User ${userId} unsubscribed from push notifications`);
        }
        catch (error) {
            this.logger.error(`Failed to unsubscribe user ${userId}: ${error.message}`);
            throw error;
        }
    }
    async sendNotificationToUser(userId, title, body, data) {
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
                }
                catch (error) {
                    this.logger.error(`Failed to send notification to user ${userId}: ${error.message}`);
                    await this.usersService.removeDeviceToken(userId, tokenString);
                }
            });
            await Promise.allSettled(promises);
        }
        catch (error) {
            this.logger.error(`Error sending notification to user ${userId}: ${error.message}`);
        }
    }
    async sendNotificationToChat(chatId, title, body, excludeUserId, data) {
        try {
            this.logger.warn('sendNotificationToChat not fully implemented yet');
        }
        catch (error) {
            this.logger.error(`Error sending notification to chat ${chatId}: ${error.message}`);
        }
    }
    getVapidPublicKey() {
        return this.configService.get('VAPID_PUBLIC_KEY') || '';
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        users_service_1.UsersService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map