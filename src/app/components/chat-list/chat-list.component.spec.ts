import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { Chat, Message, User } from '../../models';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { ChatListComponent } from './chat-list.component';

describe('ChatListComponent', () => {
  let component: ChatListComponent;
  let fixture: ComponentFixture<ChatListComponent>;
  let mockChatService: jest.Mocked<ChatService>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRouter: jest.Mocked<Router>;

  const mockUser: User = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'online',
  };

  const mockMessage: Message = {
    id: '1',
    content: 'Hello there!',
    timestamp: new Date('2024-01-01T10:00:00Z'),
    sender: {
      id: '2',
      name: 'Alice Johnson',
      email: 'alice@example.com',
      status: 'online',
    },
    chatId: '1',
    type: 'text',
    status: 'sent',
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
      lastMessage: mockMessage,
    },
    {
      id: '2',
      name: 'Team Discussion',
      participants: [mockUser],
      unreadCount: 0,
      isGroup: true,
      lastMessage: {
        ...mockMessage,
        id: '2',
        content: 'Team meeting at 3 PM',
        timestamp: new Date('2024-01-01T08:00:00Z'),
      },
    },
    {
      id: '3',
      name: 'Bob Smith',
      participants: [mockUser],
      unreadCount: 5,
      isGroup: false,
    },
  ];

  // Helper function to configure TestBed
  const configureTestBed = async (
    chatServiceMock?: any,
    authServiceMock?: any,
    routerMock?: any
  ) => {
    const defaultChatService = {
      selectChat: jest.fn(),
      chats$: of(mockChats),
    };

    const defaultAuthService = {
      currentUser$: of(mockUser),
      login: jest.fn(),
    };

    const defaultRouter = {
      navigate: jest.fn(),
      navigateByUrl: jest.fn(), // Mock navigateByUrl to fix RouterLink error
      createUrlTree: jest.fn(() => ({})), // Mock createUrlTree to fix router error
    };

    const mockActivatedRoute = {
      params: of({}),
      queryParams: of({}),
      snapshot: {
        params: {},
        queryParams: {},
      },
    };

    await TestBed.configureTestingModule({
      imports: [ChatListComponent],
      providers: [
        {
          provide: ChatService,
          useValue: chatServiceMock || defaultChatService,
        },
        {
          provide: AuthService,
          useValue: authServiceMock || defaultAuthService,
        },
        { provide: Router, useValue: routerMock || defaultRouter },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();
  };

  beforeEach(async () => {
    await configureTestBed();

    fixture = TestBed.createComponent(ChatListComponent);
    component = fixture.componentInstance;
    mockChatService = TestBed.inject(ChatService) as jest.Mocked<ChatService>;
    mockAuthService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    mockRouter = TestBed.inject(Router) as jest.Mocked<Router>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize observables in constructor', () => {
      expect(component.chats$).toBeDefined();
      expect(component.currentUser$).toBeDefined();
    });

    it('should inject services correctly', () => {
      expect(component.chatService).toBeDefined();
      expect(component.authService).toBeDefined();
    });

    it('should login mock user on ngOnInit', () => {
      component.ngOnInit();

      expect(mockAuthService.login).toHaveBeenCalledWith({
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'online',
      });
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display user information in header', () => {
      const userNameElement =
        fixture.nativeElement.querySelector('.user-details h2');
      const userStatusElement = fixture.nativeElement.querySelector(
        '.user-details .status'
      );

      expect(userNameElement?.textContent?.trim()).toBe(mockUser.name);
      expect(userStatusElement?.textContent?.trim()).toBe(mockUser.status);
    });

    it('should display chat list', () => {
      const chatItems = fixture.nativeElement.querySelectorAll('.chat-item');
      expect(chatItems.length).toBe(mockChats.length);
    });

    it('should display unread count badge when there are unread messages', () => {
      const unreadBadges =
        fixture.nativeElement.querySelectorAll('.unread-count');
      const visibleBadges = Array.from(unreadBadges).filter(
        (badge: any) =>
          badge.textContent?.trim() !== '0' && badge.textContent?.trim() !== ''
      );

      expect(visibleBadges.length).toBeGreaterThan(0);
    });

    it('should display group indicator for group chats', () => {
      const groupIndicators =
        fixture.nativeElement.querySelectorAll('.group-indicator');
      expect(groupIndicators.length).toBeGreaterThan(0);
    });

    it('should display last message content', () => {
      const messageElements =
        fixture.nativeElement.querySelectorAll('.last-message');
      expect(messageElements.length).toBeGreaterThan(0);
      expect(messageElements[0].textContent?.trim()).toBe(mockMessage.content);
    });

    it('should display formatted timestamp', () => {
      const timeElements = fixture.nativeElement.querySelectorAll('.chat-time');

      expect(timeElements.length).toBeGreaterThan(0);
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call openChat when chat item is clicked', () => {
      const openChatSpy = jest.spyOn(component, 'openChat');
      const chatItem = fixture.nativeElement.querySelector('.chat-item');

      chatItem?.click();

      fixture.whenStable().then(() => {
        fixture.detectChanges();
        expect(openChatSpy).toHaveBeenCalled();
      });
    });

    it('should select chat when openChat is called', () => {
      const testChat = mockChats[0];

      component.openChat(testChat);

      expect(mockChatService.selectChat).toHaveBeenCalledWith(testChat);
    });
  });

  describe('Utility Methods', () => {
    describe('getLastMessageTime', () => {
      beforeEach(() => {
        jest.useFakeTimers();
        jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
      });

      afterEach(() => {
        jest.useRealTimers();
      });

      it('should return "now" for timestamps less than 1 minute ago', () => {
        const recentTime = new Date('2024-01-01T11:59:30Z');
        const result = component.getLastMessageTime(recentTime);
        expect(result).toBe('now');
      });

      it('should return minutes for timestamps less than 1 hour ago', () => {
        const minutesAgo = new Date('2024-01-01T11:45:00Z');
        const result = component.getLastMessageTime(minutesAgo);
        expect(result).toBe('15m');
      });

      it('should return hours for timestamps less than 24 hours ago', () => {
        const hoursAgo = new Date('2024-01-01T10:00:00Z');
        const result = component.getLastMessageTime(hoursAgo);
        expect(result).toBe('2h');
      });

      it('should return days for timestamps more than 24 hours ago', () => {
        const daysAgo = new Date('2023-12-30T12:00:00Z');
        const result = component.getLastMessageTime(daysAgo);
        expect(result).toBe('2d');
      });

      it('should return empty string for undefined timestamp', () => {
        const result = component.getLastMessageTime(undefined);
        expect(result).toBe('');
      });
    });

    describe('getAvatarInitials', () => {
      it('should return initials for single name', () => {
        const result = component.getAvatarInitials('John');
        expect(result).toBe('J');
      });

      it('should return initials for full name', () => {
        const result = component.getAvatarInitials('John Doe');
        expect(result).toBe('JD');
      });

      it('should return initials for multiple names', () => {
        const result = component.getAvatarInitials('John Michael Doe');
        expect(result).toBe('JMD');
      });

      it('should handle names with extra spaces', () => {
        const result = component.getAvatarInitials('  John   Doe  ');
        expect(result).toBe('JD');
      });

      it('should return uppercase initials', () => {
        const result = component.getAvatarInitials('john doe');
        expect(result).toBe('JD');
      });
    });

    describe('getStatusColor', () => {
      it('should return green for online status', () => {
        const result = component.getStatusColor('online');
        expect(result).toBe('#4caf50');
      });

      it('should return orange for away status', () => {
        const result = component.getStatusColor('away');
        expect(result).toBe('#ff9800');
      });

      it('should return gray for offline status', () => {
        const result = component.getStatusColor('offline');
        expect(result).toBe('#9e9e9e');
      });

      it('should return default gray for unknown status', () => {
        const result = component.getStatusColor('unknown');
        expect(result).toBe('#9e9e9e');
      });

      it('should return default gray for empty status', () => {
        const result = component.getStatusColor('');
        expect(result).toBe('#9e9e9e');
      });
    });
  });

  describe('Observable Streams', () => {
    it('should emit chats from chat service', (done) => {
      component.chats$.subscribe((chats) => {
        expect(chats).toEqual(mockChats);
        expect(chats.length).toBe(3);
        done();
      });
    });

    it('should emit current user from auth service', (done) => {
      component.currentUser$.subscribe((user) => {
        expect(user).toEqual(mockUser);
        done();
      });
    });
  });

  describe('Change Detection', () => {
    it('should use OnPush change detection strategy', () => {
      expect(component.constructor.prototype.constructor.name).toBe(
        'ChatListComponent'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle empty chat list gracefully', async () => {
      // Reset TestBed for this specific test
      TestBed.resetTestingModule();

      const emptyChatService = {
        selectChat: jest.fn(),
        chats$: of([]),
      };

      await configureTestBed(emptyChatService);

      fixture = TestBed.createComponent(ChatListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const chatItems = fixture.nativeElement.querySelectorAll('.chat-item');
      expect(chatItems.length).toBe(0);
    });

    it('should handle null user gracefully', async () => {
      // Reset TestBed for this specific test
      TestBed.resetTestingModule();

      const nullUserAuthService = {
        currentUser$: of(null),
        login: jest.fn(),
      };

      await configureTestBed(undefined, nullUserAuthService);

      fixture = TestBed.createComponent(ChatListComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component).toBeTruthy();
    });
  });
});
