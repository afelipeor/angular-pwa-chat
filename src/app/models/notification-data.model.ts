export interface NotificationData {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    data?: Record<string, unknown>;
    tag?: string;
    requireInteraction?: boolean;
  }
