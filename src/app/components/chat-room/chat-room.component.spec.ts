import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of } from 'rxjs';
import { User } from '../../models';
import { AuthService } from '../../services/auth.service';
import { ChatService, Message } from '../../services/chat.service';
import { ChatRoomComponent } from './chat-room.component';

describe('ChatRoomComponent', () => {
  let component: ChatRoomComponent;
  let fixture: ComponentFixture<ChatRoomComponent>;
  let mockChatService: jest.Mocked<ChatService>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRouter: jest.Mocked<Router>;
  let mockActivatedRoute: any;

  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    status: 'online',
  };

  const mockMessages: Message[] = [
    {
      id: '1',
      content: 'Hello!',
      timestamp: new Date(),
      sender: {
        id: '2',
        name: 'Other User',
        email: 'other@example.com',
        status: 'online',
      },
      chatId: '1',
      type: 'text',
    },
    {
      id: '2',
      content: 'Hi there!',
      timestamp: new Date(),
      sender: mockUser,
      chatId: '1',
      type: 'text',
    },
  ];

  beforeEach(async () => {
    const chatServiceMock = {
      sendMessage: jest.fn(),
      messages$: of(mockMessages),
      chats$: of([
        {
          id: '1',
          name: 'Test Chat',
          participants: [mockUser],
          unreadCount: 0,
          isGroup: false,
        },
      ]),
    } as jest.Mocked<Partial<ChatService>>;

    const authServiceMock = {
      getCurrentUser: jest.fn(),
      currentUser$: of(mockUser),
    } as jest.Mocked<Partial<AuthService>>;

    const routerMock = {
      navigate: jest.fn(),
    } as jest.Mocked<Partial<Router>>;

    mockActivatedRoute = {
      params: of({ id: '1' }),
    };

    await TestBed.configureTestingModule({
      imports: [ChatRoomComponent],
      providers: [
        { provide: ChatService, useValue: chatServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatRoomComponent);
    component = fixture.componentInstance;
    mockChatService = TestBed.inject(ChatService) as jest.Mocked<ChatService>;
    mockAuthService = TestBed.inject(AuthService) as jest.Mocked<AuthService>;
    mockRouter = TestBed.inject(Router) as jest.Mocked<Router>;

    mockAuthService.getCurrentUser.mockReturnValue(mockUser);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load chat details on init', () => {
    fixture.detectChanges();

    expect(component.chatId).toBe('1');
    expect(component.chatName).toBe('Test Chat');
    expect(component.isGroup).toBe(false);
  });

  it('should display messages', () => {
    fixture.detectChanges();

    const messageElements = fixture.nativeElement.querySelectorAll('.message');
    expect(messageElements.length).toBe(mockMessages.length);
  });

  it('should mark own messages with own-message class', () => {
    fixture.detectChanges();

    const ownMessages = fixture.nativeElement.querySelectorAll(
      '.message.own-message'
    );
    expect(ownMessages.length).toBe(1); // Only one message from mockUser
  });

  it('should send message when send button is clicked', () => {
    component.newMessage = 'Test message';

    component.sendMessage();

    expect(mockChatService.sendMessage).toHaveBeenCalledWith(
      'Test message',
      '1'
    );
    expect(component.newMessage).toBe('');
  });

  it('should not send empty message', () => {
    component.newMessage = '   ';

    component.sendMessage();

    expect(mockChatService.sendMessage).not.toHaveBeenCalled();
  });

  it('should navigate back when back button is clicked', () => {
    component.goBack();

    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  describe('isOwnMessage', () => {
    it('should return true for own messages', () => {
      const ownMessage = mockMessages[1]; // Message from mockUser
      expect(component.isOwnMessage(ownMessage)).toBe(true);
    });

    it('should return false for other messages', () => {
      const otherMessage = mockMessages[0]; // Message from other user
      expect(component.isOwnMessage(otherMessage)).toBe(false);
    });
  });

  describe('getMessageTime', () => {
    it('should format time correctly', () => {
      const testDate = new Date('2023-01-01T10:30:00');
      const result = component.getMessageTime(testDate);

      expect(result).toMatch(/^\d{1,2}:\d{2}$/);
    });
  });
});
