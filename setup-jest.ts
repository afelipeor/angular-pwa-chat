import 'jest-preset-angular/setup-jest';
import { TextDecoder, TextEncoder } from 'util';

// Polyfill for TextEncoder/TextDecoder
Object.assign(global, { TextDecoder, TextEncoder });

// Mock Notification API
Object.defineProperty(window, 'Notification', {
  value: class MockNotification {
    static permission = 'granted';
    static requestPermission = jest.fn(() => Promise.resolve('granted'));
    constructor(title: string, options?: NotificationOptions) {}
  },
  writable: true,
});

// Mock Service Worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: jest.fn(() => Promise.resolve()),
    ready: Promise.resolve({
      showNotification: jest.fn(),
    }),
  },
  writable: true,
});

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1,
  OPEN: 1,
}));

// CSS and SCSS mocks
Object.defineProperty(window, 'CSS', { value: null });
Object.defineProperty(window, 'getComputedStyle', {
  value: () => {
    return {
      display: 'none',
      appearance: ['-webkit-appearance'],
    };
  },
});

Object.defineProperty(document, 'doctype', {
  value: '<!DOCTYPE html>',
});

Object.defineProperty(document.body.style, 'transform', {
  value: () => {
    return {
      enumerable: true,
      configurable: true,
    };
  },
});

import { TestBed } from '@angular/core/testing';
import { AuthService, User } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let mockUser: User;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
    mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      status: 'online',
    };
  });

  afterEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should set current user and store in localStorage', () => {
      service.login(mockUser);

      expect(service.getCurrentUser()).toEqual(mockUser);
      expect(localStorage.getItem('currentUser')).toEqual(
        JSON.stringify(mockUser)
      );
    });

    it('should emit user through currentUser$ observable', (done) => {
      service.currentUser$.subscribe((user) => {
        if (user) {
          expect(user).toEqual(mockUser);
          done();
        }
      });

      service.login(mockUser);
    });
  });

  describe('logout', () => {
    beforeEach(() => {
      service.login(mockUser);
    });

    it('should clear current user and localStorage', () => {
      service.logout();

      expect(service.getCurrentUser()).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
    });

    it('should emit null through currentUser$ observable', (done) => {
      let callCount = 0;
      service.currentUser$.subscribe((user) => {
        callCount++;
        if (callCount === 2) {
          // First call is the login, second is logout
          expect(user).toBeNull();
          done();
        }
      });

      service.logout();
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when user is logged in', () => {
      service.login(mockUser);
      expect(service.isLoggedIn()).toBe(true);
    });

    it('should return false when user is not logged in', () => {
      service.logout();
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user when logged in', () => {
      service.login(mockUser);
      expect(service.getCurrentUser()).toEqual(mockUser);
    });

    it('should return null when not logged in', () => {
      service.logout();
      expect(service.getCurrentUser()).toBeNull();
    });
  });
});
