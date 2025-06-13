import { NotificationsService } from './notifications.service';
declare class SubscriptionDto {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getVapidPublicKey(): {
        publicKey: string;
    };
    subscribe(subscription: SubscriptionDto, req: any): Promise<{
        message: string;
    }>;
    unsubscribe(subscription: SubscriptionDto, req: any): Promise<{
        message: string;
    }>;
}
export {};
