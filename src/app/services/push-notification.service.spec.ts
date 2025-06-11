import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { SwPush } from '@angular/service-worker';
import { PushNotificationService } from './push-notification.service';

describe('PushNotificationService', () => {
  let service: PushNotificationService;
  let mockSwPush: jest.Mocked<SwPush>;

  beforeEach(() => {
    const swPushMock = {
      isEnabled: true,
      requestSubscription: jest.fn(),
    } as jest.Mocked<Partial<SwPush>>;

    TestBed.configureTestingModule({
      providers: [
        { provide: SwPush, useValue: swPushMock },
        provideHttpClient(),
      ],
    });

    service = TestBed.inject(PushNotificationService);
    mockSwPush = TestBed.inject(SwPush) as jest.Mocked<SwPush>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('subscribeToNotifications', () => {
    it('should request subscription when SwPush is enabled', async () => {
      const mockSubscription = {} as PushSubscription;
      mockSwPush.requestSubscription.mockResolvedValue(mockSubscription);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.subscribeToNotifications();

      expect(mockSwPush.requestSubscription).toHaveBeenCalledWith({
        serverPublicKey: service.getVapidPublicKey(),
      });

      consoleSpy.mockRestore();
    });

    it('should log message when SwPush is not enabled', () => {
      Object.defineProperty(mockSwPush, 'isEnabled', { value: false });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      service.subscribeToNotifications();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Push notifications are not enabled'
      );
      consoleSpy.mockRestore();
    });

    it('should handle subscription errors', async () => {
      mockSwPush.requestSubscription.mockRejectedValue('Error');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      service.subscribeToNotifications();

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(consoleSpy).toHaveBeenCalledWith(
        'Could not subscribe to notifications',
        'Error'
      );
      consoleSpy.mockRestore();
    });
  });

  describe('showNotification', () => {
    it('should create notification when permission is granted', () => {
      const mockNotification = jest.fn();
      (global as any).Notification = mockNotification;
      Object.defineProperty(Notification, 'permission', { value: 'granted' });

      service.showNotification('Test Title', 'Test Body');

      expect(mockNotification).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        data: undefined,
      });
    });

    it('should not create notification when permission is denied', () => {
      const mockNotification = jest.fn();
      (global as any).Notification = mockNotification;
      Object.defineProperty(Notification, 'permission', { value: 'denied' });

      service.showNotification('Test Title', 'Test Body');

      expect(mockNotification).not.toHaveBeenCalled();
    });
  });

  describe('requestNotificationPermission', () => {
    it('should request permission and return promise', async () => {
      const mockRequestPermission = jest
        .fn()
        .mockResolvedValue('granted' as NotificationPermission);
      Object.defineProperty(Notification, 'requestPermission', {
        value: mockRequestPermission,
      });

      const result = await service.requestNotificationPermission();

      expect(result).toBe('granted');
      expect(mockRequestPermission).toHaveBeenCalled();
    });

    it('should return denied when Notification is not supported', async () => {
      delete (global as any).Notification;

      const result = await service.requestNotificationPermission();

      expect(result).toBe('denied');
    });
  });
});
