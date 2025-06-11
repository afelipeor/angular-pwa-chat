import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { User } from '../../models';
import { AuthService } from '../../services/auth.service';
import { ChatService } from '../../services/chat.service';
import { NewChatComponent } from './new-chat.component';

describe('NewChatComponent', () => {
  let component: NewChatComponent;
  let fixture: ComponentFixture<NewChatComponent>;
  let mockChatService: jest.Mocked<ChatService>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRouter: jest.Mocked<Router>;

  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    status: 'online',
  };

  beforeEach(async () => {
    const chatServiceMock = {
      createNewChat: jest.fn(),
    } as jest.Mocked<Partial<ChatService>>;

    const authServiceMock = {
      currentUser$: of(mockUser),
    } as jest.Mocked<Partial<AuthService>>;

    const routerMock = {
      navigate: jest.fn(),
    } as jest.Mocked<Partial<Router>>;

    await TestBed.configureTestingModule({
      imports: [NewChatComponent],
      providers: [
        { provide: ChatService, useValue: chatServiceMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: Router, useValue: routerMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewChatComponent);
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

  it('should initialize with contacts', () => {
    component.ngOnInit();
    expect(component.contacts.length).toBeGreaterThan(0);
  });

  it('should display header with correct title', () => {
    fixture.detectChanges();

    const headerTitle = fixture.nativeElement.querySelector('.header-info h2');
    expect(headerTitle?.textContent?.trim()).toBe('New Chat');
  });

  it('should disable create button when no contacts selected', () => {
    fixture.detectChanges();

    const createButton = fixture.nativeElement.querySelector('.create-button');
    expect(createButton.disabled).toBe(true);
  });

  it('should show search input', () => {
    fixture.detectChanges();

    const searchInput = fixture.nativeElement.querySelector('.search-input');
    expect(searchInput).toBeTruthy();
    expect(searchInput.placeholder).toBe('Search contacts...');
  });

  it('should filter contacts based on search term', () => {
    component.ngOnInit();
    component.searchTerm = 'Alice';

    const filtered = component.filteredContacts;
    expect(filtered.length).toBe(1);
    expect(filtered[0].name).toBe('Alice Johnson');
  });

  it('should toggle contact selection', () => {
    component.ngOnInit();
    const contact = component.contacts[0];

    expect(component.selectedContacts.length).toBe(0);

    component.toggleContactSelection(contact);
    expect(component.selectedContacts.length).toBe(1);
    expect(component.selectedContacts[0]).toBe(contact);
    expect(contact.selected).toBe(true);

    component.toggleContactSelection(contact);
    expect(component.selectedContacts.length).toBe(0);
    expect(contact.selected).toBe(false);
  });

  it('should create chat and navigate', () => {
    const mockChat = {
      id: 'new-chat-id',
      name: 'New Chat',
      participants: [],
      unreadCount: 0,
      isGroup: false,
    };

    mockChatService.createNewChat.mockReturnValue(mockChat);

    component.selectedContacts = [component.contacts[0]];
    component.createChat();

    expect(mockChatService.createNewChat).toHaveBeenCalledWith(
      [component.contacts[0]],
      undefined
    );
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/chat', 'new-chat-id']);
  });

  it('should navigate back when back button clicked', () => {
    component.goBack();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
  });

  describe('getAvatarInitials', () => {
    it('should return correct initials', () => {
      expect(component.getAvatarInitials('John Doe')).toBe('JD');
      expect(component.getAvatarInitials('Alice')).toBe('A');
      expect(component.getAvatarInitials('Mary Jane Watson')).toBe('MJW');
    });
  });

  describe('getStatusColor', () => {
    it('should return correct colors for different statuses', () => {
      expect(component.getStatusColor('online')).toBe('#4caf50');
      expect(component.getStatusColor('away')).toBe('#ff9800');
      expect(component.getStatusColor('offline')).toBe('#9e9e9e');
      expect(component.getStatusColor('unknown')).toBe('#9e9e9e');
    });
  });
});
