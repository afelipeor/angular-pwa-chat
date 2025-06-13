import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
export declare class NotificationsService {
    private configService;
    private usersService;
    private readonly logger;
    constructor(configService: ConfigService, usersService: UsersService);
    private initializeWebPush;
    subscribeUser(userId: string, subscription: any): Promise<void>;
    unsubscribeUser(userId: string, subscription: any): Promise<void>;
    sendNotificationToUser(userId: string, title: string, body: string, data?: any): Promise<void>;
    sendNotificationToChat(chatId: string, title: string, body: string, excludeUserId?: string, data?: any): Promise<void>;
    getVapidPublicKey(): string;
}
