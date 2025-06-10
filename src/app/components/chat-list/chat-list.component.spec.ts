import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AuthService, User } from '../../services/auth.service';
import { Chat, ChatService } from '../../services/chat.service';
import { ChatListComponent } from './chat-list.component';

describe('ChatListComponent', () => {
  let component: ChatListComponent;
  let fixture: ComponentFixture<ChatListComponent>;
  let mockChatService: jest.Mocked<ChatService>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRouter: jest.Mocked<Router>;

  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    status: 'online',
  };

  const mockChats: Chat[] = [
    {
      id: '1',
      name: 'Alice Johnson',
      participants: [
        mockUser,
        {
          id: '2',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          status: 'online',
        },
      ],
      unreadCount: 2,
      isGroup: false,
      lastMessage: {
        id: '1',
        content: 'Hello there!',
        timestamp: new Date(),
        sender: {
          id: '2',
          name: 'Alice Johnson',
          email: 'alice@example.com',
          status: 'online',
        },
        chatId: '1',
        type: 'text',
      },
    },
    {
      id: '2',
      name: 'Team Discussion',
      participants: [mockUser],
      unreadCount: 0,
      isGroup: true,
    },
  ];

  beforeEach(async () => {
    const chatServiceMock = {
      selectChat: jest.fn(),
      chats$: of(mockChats),
    } as jest.Mocked<Partial<ChatService>>;

    const authServiceMock = {
      currentUser$: of(mockUser),
    } as jest.Mocked<Partial<AuthService>>;

    const routerMock = {
      navigate: jest.fn(),
    } as jest.Mocked<Partial<Router>>;

    await TestBed.configureTestingModule({
      imports: [ChatListComponent],
      providers: [
        { provide: ChatService, useValue: chatServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatListComponent);
    component = fixture.componentInstance;
    mockChatService = TestBed.inject(ChatService) as jest.Mocked<ChatService>;
    mockAuthService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    mockRouter = TestBed.inject(Router) as jest.Mocked<Router>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display user information in header', () => {
    fixture.detectChanges();

    const userNameElement =
      fixture.nativeElement.querySelector('.user-details h2');
    const userStatusElement = fixture.nativeElement.querySelector(
      '.user-details .status'
    );

    expect(userNameElement?.textContent?.trim()).toBe(mockUser.name);
    expect(userStatusElement?.textContent?.trim()).toBe(mockUser.status);
  });

  it('should display chat list', () => {
    fixture.detectChanges();

    const chatItems = fixture.nativeElement.querySelectorAll('.chat-item');
    expect(chatItems.length).toBe(mockChats.length);
  });

  it('should display unread count badge when there are unread messages', () => {
    fixture.detectChanges();

    const unreadBadges =
      fixture.nativeElement.querySelectorAll('.unread-count');
    expect(unreadBadges.length).toBe(1);
    expect(unreadBadges[0].textContent?.trim()).toBe('2');
  });

  it('should display group indicator for group chats', () => {
    fixture.detectChanges();

    const groupIndicators =
      fixture.nativeElement.querySelectorAll('.group-indicator');
    expect(groupIndicators.length).toBe(1);
  });

  it('should open chat when chat item is clicked', () => {
    fixture.detectChanges();

    const firstChatItem = fixture.nativeElement.querySelector('.chat-item');
    firstChatItem.click();

    expect(mockChatService.selectChat).toHaveBeenCalledWith(mockChats[0]);
    expect(mockRouter.navigate).toHaveBeenCalledWith([
      '/chat',
      mockChats[0].id,
    ]);
  });

  describe('openChat', () => {
    it('should select chat and navigate to chat room', () => {
      const chat = mockChats[0];

      component.openChat(chat);

      expect(mockChatService.selectChat).toHaveBeenCalledWith(chat);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/chat', chat.id]);
    });
  });

  describe('getLastMessageTime', () => {
    it('should return "now" for messages less than 1 minute old', () => {
      const timestamp = new Date(Date.now() - 30000); // 30 seconds ago
      expect(component.getLastMessageTime(timestamp)).toBe('now');
    });

    it('should return minutes for messages less than 1 hour old', () => {
      const timestamp = new Date(Date.now() - 1800000); // 30 minutes ago
      expect(component.getLastMessageTime(timestamp)).toBe('30m');
    });

    it('should return hours for messages less than 1 day old', () => {
      const timestamp = new Date(Date.now() - 7200000); // 2 hours ago
      expect(component.getLastMessageTime(timestamp)).toBe('2h');
    });

    it('should return days for messages older than 1 day', () => {
      const timestamp = new Date(Date.now() - 172800000); // 2 days ago
      expect(component.getLastMessageTime(timestamp)).toBe('2d');
    });

    it('should return empty string for undefined timestamp', () => {
      expect(component.getLastMessageTime(undefined)).toBe('');
    });
  });

  describe('getAvatarInitials', () => {
    it('should return initials for single name', () => {
      expect(component.getAvatarInitials('John')).toBe('J');
    });

    it('should return initials for full name', () => {
      expect(component.getAvatarInitials('John Doe')).toBe('JD');
    });

    it('should return initials for multiple names', () => {
      expect(component.getAvatarInitials('John Michael Doe')).toBe('JMD');
    });

    it('should handle empty string', () => {
      expect(component.getAvatarInitials('')).toBe('');
    });
  });
});
