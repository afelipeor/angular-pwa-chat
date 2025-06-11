import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Chat } from '../models';
import { AuthService } from './auth.service';
import { ChatService } from './chat.service';
import { PushNotificationService } from './push-notification.service';

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockPushService: jest.Mocked<PushNotificationService>;

  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    status: 'online' as const,
  };

  beforeEach(() => {
    const authServiceMock = {
      getCurrentUser: jest.fn(),
    } as jest.Mocked<Partial<AuthService>>;

    const pushServiceMock = {
      showNotification: jest.fn(),
    } as jest.Mocked<Partial<PushNotificationService>>;

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: authServiceMock },
        { provide: PushNotificationService, useValue: pushServiceMock },
      ],
    });

    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
    mockAuthService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    mockPushService = TestBed.inject(
      PushNotificationService
    ) as jest.Mocked<PushNotificationService>;

    mockAuthService.getCurrentUser.mockReturnValue(mockUser);
  });

  afterEach(() => {
    httpMock.verify();
    jest.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('selectChat', () => {
    it('should set selected chat and load messages', (done) => {
      const mockChat: Chat = {
        id: '1',
        name: 'Test Chat',
        participants: [mockUser],
        unreadCount: 1,
        isGroup: false,
      };

      service.selectedChat$.subscribe((chat) => {
        if (chat) {
          expect(chat).toEqual(mockChat);
          done();
        }
      });

      service.selectChat(mockChat);
    });

    it('should mark chat as read when selected', (done) => {
      const mockChat: Chat = {
        id: '1',
        name: 'Test Chat',
        participants: [mockUser],
        unreadCount: 3,
        isGroup: false,
      };

      service.chats$.subscribe((chats) => {
        const selectedChat = chats.find((c) => c.id === '1');
        if (selectedChat && selectedChat.unreadCount === 0) {
          expect(selectedChat.unreadCount).toBe(0);
          done();
        }
      });

      service.selectChat(mockChat);
    });
  });

  describe('createNewChat', () => {
    it('should create a new chat with participants', (done) => {
      const participants = [
        {
          id: '2',
          name: 'User 2',
          email: 'user2@example.com',
          status: 'online' as const,
        },
      ];

      const newChat = service.createNewChat(participants, 'New Chat');

      service.chats$.subscribe((chats) => {
        const createdChat = chats.find((c) => c.id === newChat.id);
        if (createdChat) {
          expect(createdChat.name).toBe('New Chat');
          expect(createdChat.participants).toContain(mockUser);
          expect(createdChat.participants).toContain(participants[0]);
          done();
        }
      });
    });

    it('should create group chat when multiple participants', () => {
      const participants = [
        {
          id: '2',
          name: 'User 2',
          email: 'user2@example.com',
          status: 'online' as const,
        },
        {
          id: '3',
          name: 'User 3',
          email: 'user3@example.com',
          status: 'online' as const,
        },
      ];

      const newChat = service.createNewChat(participants);

      expect(newChat.isGroup).toBe(true);
    });

    it('should create individual chat when one participant', () => {
      const participants = [
        {
          id: '2',
          name: 'User 2',
          email: 'user2@example.com',
          status: 'online' as const,
        },
      ];

      const newChat = service.createNewChat(participants);

      expect(newChat.isGroup).toBe(false);
    });
  });

  describe('sendMessage', () => {
    it('should add message to messages list', (done) => {
      const chatId = '1';
      const content = 'Test message';

      service.messages$.subscribe((messages) => {
        const newMessage = messages.find((m) => m.content === content);
        if (newMessage) {
          expect(newMessage.sender).toEqual(mockUser);
          expect(newMessage.chatId).toBe(chatId);
          expect(newMessage.type).toBe('text');
          done();
        }
      });

      service.sendMessage(content, chatId);
    });

    it('should update last message in chat', (done) => {
      const chatId = '1';
      const content = 'Test message';

      // First create a chat with the given ID
      service.createNewChat([], 'Test Chat');

      setTimeout(() => {
        service.chats$.subscribe((chats) => {
          const updatedChat = chats.find((c) => c.id === chatId);
          if (updatedChat && updatedChat.lastMessage?.content === content) {
            expect(updatedChat.lastMessage.content).toBe(content);
            done();
          }
        });

        service.sendMessage(content, chatId);
      }, 0);
    });

    it('should not send message when user is not logged in', () => {
      mockAuthService.getCurrentUser.mockReturnValue(null);
      const messagesSpy = jest.spyOn(service.messages$, 'subscribe');

      service.sendMessage('Test', '1');

      expect(messagesSpy).not.toHaveBeenCalled();
      messagesSpy.mockRestore();
    });
  });
});
