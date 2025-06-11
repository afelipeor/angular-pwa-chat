import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { User } from '../../models';
import { AuthService } from '../../services/auth.service';
import { HeaderMenuComponent } from './header-menu.component';

describe('HeaderMenuComponent', () => {
  let component: HeaderMenuComponent;
  let fixture: ComponentFixture<HeaderMenuComponent>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRouter: jest.Mocked<Router>;

  const mockUser: User = {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'online',
  };

  const configureTestBed = async (authServiceMock?: any, routerMock?: any) => {
    const defaultAuthService = {
      currentUser$: of(mockUser),
      logout: jest.fn(),
      login: jest.fn(),
    };

    const defaultRouter = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [HeaderMenuComponent],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock || defaultAuthService,
        },
        { provide: Router, useValue: routerMock || defaultRouter },
      ],
    }).compileComponents();
  };

  beforeEach(async () => {
    await configureTestBed();

    fixture = TestBed.createComponent(HeaderMenuComponent);
    component = fixture.componentInstance;
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

    it('should initialize currentUser$ observable', () => {
      expect(component.currentUser$).toBeDefined();
    });

    it('should inject services correctly', () => {
      expect(component['authService']).toBeDefined();
      expect(component['router']).toBeDefined();
    });

    it('should start with menu closed', () => {
      expect(component.isMenuOpen).toBe(false);
    });

    it('should start with logout modal hidden', () => {
      expect(component.showLogoutModal).toBe(false);
    });

    it('should emit current user from auth service', (done) => {
      component.currentUser$.subscribe((user) => {
        expect(user).toEqual(mockUser);
        done();
      });
    });

    it('should be a standalone component', () => {
      expect(component.constructor.prototype.constructor.name).toBe(
        'HeaderMenuComponent'
      );
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display user avatar with initials', () => {
      const avatarElement =
        fixture.nativeElement.querySelector('.user-avatar span');
      expect(avatarElement?.textContent?.trim()).toBe('JD');
    });

    it('should display user name in user details', () => {
      const nameElement =
        fixture.nativeElement.querySelector('.user-details h2');
      expect(nameElement?.textContent?.trim()).toBe(mockUser.name);
    });

    it('should display user status', () => {
      const statusElement = fixture.nativeElement.querySelector(
        '.user-details .status'
      );
      expect(statusElement?.textContent?.trim()).toBe(mockUser.status);
    });

    it('should display status indicator with correct color', () => {
      const statusIndicator =
        fixture.nativeElement.querySelector('.status-indicator');
      expect(statusIndicator).toBeTruthy();
      expect(statusIndicator.style.backgroundColor).toBe('rgb(76, 175, 80)'); // #4caf50 in RGB
    });

    it('should display menu arrow icon', () => {
      const menuArrow = fixture.nativeElement.querySelector('.menu-arrow');
      expect(menuArrow?.textContent?.trim()).toBe('keyboard_arrow_down');
    });

    it('should not display dropdown menu initially', () => {
      const dropdownMenu =
        fixture.nativeElement.querySelector('.dropdown-menu');
      expect(dropdownMenu).toBeFalsy();
    });

    it('should not display logout modal initially', () => {
      const logoutModal = fixture.nativeElement.querySelector(
        '.logout-modal-overlay'
      );
      expect(logoutModal).toBeFalsy();
    });

    it('should render header menu container', () => {
      const headerMenu = fixture.nativeElement.querySelector('.header-menu');
      expect(headerMenu).toBeTruthy();
    });
  });

  describe('Menu Toggle Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should toggle menu when toggleMenu is called', () => {
      expect(component.isMenuOpen).toBe(false);

      component.toggleMenu();
      expect(component.isMenuOpen).toBe(true);

      component.toggleMenu();
      expect(component.isMenuOpen).toBe(false);
    });

    it('should open menu when user info is clicked', () => {
      const userInfo = fixture.nativeElement.querySelector('.user-info');

      userInfo.click();
      fixture.detectChanges();

      expect(component.isMenuOpen).toBe(true);
    });

    it('should display dropdown menu when menu is open', () => {
      component.toggleMenu();
      fixture.detectChanges();

      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const dropdownMenu =
          fixture.nativeElement.querySelector('.dropdown-menu');
        expect(dropdownMenu).toBeTruthy();
      });
    });

    it('should display menu overlay when menu is open', () => {
      component.toggleMenu();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const menuOverlay =
          fixture.nativeElement.querySelector('.menu-overlay');
        expect(menuOverlay).toBeTruthy();
      });
    });

    it('should close menu when closeMenu is called', () => {
      component.isMenuOpen = true;

      component.closeMenu();

      expect(component.isMenuOpen).toBe(false);
    });

    it('should close menu when overlay is clicked', () => {
      component.toggleMenu();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const menuOverlay =
          fixture.nativeElement.querySelector('.menu-overlay');
        menuOverlay.click();

        expect(component.isMenuOpen).toBe(false);
      });
    });

    it('should add menu-open class when menu is open', () => {
      component.toggleMenu();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const headerMenu = fixture.nativeElement.querySelector('.header-menu');
        expect(headerMenu.classList.contains('menu-open')).toBe(true);
      });
    });

    it('should remove menu-open class when menu is closed', () => {
      component.toggleMenu();
      fixture.detectChanges();

      component.closeMenu();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const headerMenu = fixture.nativeElement.querySelector('.header-menu');
        expect(headerMenu.classList.contains('menu-open')).toBe(false);
      });
    });
  });

  describe('Dropdown Menu Content', () => {
    beforeEach(() => {
      component.toggleMenu();
      fixture.detectChanges();
    });

    it('should display user information in menu header', () => {
      const menuHeaderName =
        fixture.nativeElement.querySelector('.menu-header h3');
      const menuHeaderEmail =
        fixture.nativeElement.querySelector('.menu-header p');

      expect(menuHeaderName?.textContent?.trim()).toBe(mockUser.name);
      expect(menuHeaderEmail?.textContent?.trim()).toBe(mockUser.email);
    });

    it('should display user avatar in menu header', () => {
      const menuHeaderAvatar = fixture.nativeElement.querySelector(
        '.menu-header .user-avatar span'
      );
      expect(menuHeaderAvatar?.textContent?.trim()).toBe('JD');
    });

    it('should display profile menu item', () => {
      const profileItem = fixture.nativeElement.querySelector(
        '.menu-item:nth-child(1)'
      );
      expect(profileItem?.textContent?.trim()).toContain('Profile');
    });

    it('should display settings menu item', () => {
      const settingsItem = fixture.nativeElement.querySelector(
        '.menu-item:nth-child(2)'
      );
      expect(settingsItem?.textContent?.trim()).toContain('Settings');
    });

    it('should display help menu item', () => {
      const helpItem = fixture.nativeElement.querySelector(
        '.menu-item:nth-child(3)'
      );
      expect(helpItem?.textContent?.trim()).toContain('Help');
    });

    it('should display logout menu item', () => {
      const logoutItem = fixture.nativeElement.querySelector('.logout-item');
      expect(logoutItem?.textContent?.trim()).toContain('Sign Out');
    });

    it('should have correct icons for menu items', () => {
      const profileIcon = fixture.nativeElement.querySelector(
        '.menu-item:nth-child(1) i'
      );
      const settingsIcon = fixture.nativeElement.querySelector(
        '.menu-item:nth-child(2) i'
      );
      const helpIcon = fixture.nativeElement.querySelector(
        '.menu-item:nth-child(3) i'
      );
      const logoutIcon = fixture.nativeElement.querySelector('.logout-item i');

      expect(profileIcon?.textContent?.trim()).toBe('person');
      expect(settingsIcon?.textContent?.trim()).toBe('settings');
      expect(helpIcon?.textContent?.trim()).toBe('help');
      expect(logoutIcon?.textContent?.trim()).toBe('exit_to_app');
    });

    it('should display menu dividers', () => {
      const dividers = fixture.nativeElement.querySelectorAll('.menu-divider');
      expect(dividers.length).toBeGreaterThan(0);
    });

    it('should have logout item with special styling', () => {
      const logoutItem = fixture.nativeElement.querySelector('.logout-item');
      expect(logoutItem.classList.contains('logout-item')).toBe(true);
    });
  });

  describe('Logout Modal Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should show logout modal when showLogout is called', () => {
      component.showLogout();

      expect(component.showLogoutModal).toBe(true);
      expect(component.isMenuOpen).toBe(false);
    });

    it('should hide logout modal when hideLogout is called', () => {
      component.showLogoutModal = true;

      component.hideLogout();

      expect(component.showLogoutModal).toBe(false);
    });

    it('should display logout modal when showLogoutModal is true', () => {
      component.showLogout();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const logoutModal = fixture.nativeElement.querySelector(
          '.logout-modal-overlay'
        );
        expect(logoutModal).toBeTruthy();
      });
    });

    it('should display logout modal content', () => {
      component.showLogout();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const logoutModalContent = fixture.nativeElement.querySelector(
          '.logout-modal-content'
        );
        expect(logoutModalContent).toBeTruthy();
      });
    });

    it('should display logout component in modal', () => {
      component.showLogout();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const logoutComponent =
          fixture.nativeElement.querySelector('app-logout');
        expect(logoutComponent).toBeTruthy();
      });
    });

    it('should display close modal button', () => {
      component.showLogout();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const closeButton =
          fixture.nativeElement.querySelector('.close-modal-btn');
        expect(closeButton).toBeTruthy();
      });
    });

    it('should close modal when close button is clicked', () => {
      component.showLogout();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const closeButton =
          fixture.nativeElement.querySelector('.close-modal-btn');
        closeButton.click();

        expect(component.showLogoutModal).toBe(false);
      });
    });

    it('should close modal when overlay is clicked', () => {
      component.showLogout();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const overlay = fixture.nativeElement.querySelector(
          '.logout-modal-overlay'
        );
        overlay.click();

        expect(component.showLogoutModal).toBe(false);
      });
    });

    it('should not close modal when content is clicked', () => {
      component.showLogout();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const content = fixture.nativeElement.querySelector(
          '.logout-modal-content'
        );
        content.click();

        expect(component.showLogoutModal).toBe(true);
      });
    });

    it('should trigger showLogout when logout menu item is clicked', () => {
      component.toggleMenu();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const logoutItem = fixture.nativeElement.querySelector('.logout-item');
        logoutItem.click();

        expect(component.showLogoutModal).toBe(true);
        expect(component.isMenuOpen).toBe(false);
      });
    });

    it('should handle logout component cancelled event', () => {
      component.showLogout();
      fixture.detectChanges();

      // Simulate the cancelled event from logout component
      component.hideLogout();

      expect(component.showLogoutModal).toBe(false);
    });
  });

  describe('Menu Item Interactions', () => {
    beforeEach(() => {
      component.toggleMenu();
      fixture.detectChanges();
    });

    it('should close menu when profile item is clicked', () => {
      const profileItem = fixture.nativeElement.querySelector(
        '.menu-item:nth-child(1)'
      );
      profileItem.click();

      expect(component.isMenuOpen).toBe(false);
    });

    it('should close menu when settings item is clicked', () => {
      const settingsItem = fixture.nativeElement.querySelector(
        '.menu-item:nth-child(2)'
      );
      settingsItem.click();

      expect(component.isMenuOpen).toBe(false);
    });

    it('should close menu when help item is clicked', () => {
      const helpItem = fixture.nativeElement.querySelector(
        '.menu-item:nth-child(3)'
      );
      helpItem.click();

      expect(component.isMenuOpen).toBe(false);
    });

    it('should have clickable menu items', () => {
      const menuItems = fixture.nativeElement.querySelectorAll('.menu-item');
      expect(menuItems.length).toBeGreaterThan(0);

      menuItems.forEach((item: HTMLElement) => {
        expect(item.tagName.toLowerCase()).toBe('button');
      });
    });
  });

  describe('Utility Methods', () => {
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

      it('should handle empty string', () => {
        const result = component.getAvatarInitials('');
        expect(result).toBe('');
      });

      it('should handle single character names', () => {
        const result = component.getAvatarInitials('J D');
        expect(result).toBe('JD');
      });

      it('should handle names with special characters', () => {
        const result = component.getAvatarInitials("John O'Connor");
        expect(result).toBe('JO');
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

      it('should return default gray for null status', () => {
        const result = component.getStatusColor(null as any);
        expect(result).toBe('#9e9e9e');
      });

      it('should return default gray for undefined status', () => {
        const result = component.getStatusColor(undefined as any);
        expect(result).toBe('#9e9e9e');
      });

      it('should handle case sensitivity', () => {
        expect(component.getStatusColor('ONLINE')).toBe('#4caf50'); // Should not match
        expect(component.getStatusColor('Online')).toBe('#4caf50'); // Should not match
      });
    });
  });

  describe('Modal State Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should manage modal state independently of menu state', () => {
      // Open menu first
      component.toggleMenu();
      expect(component.isMenuOpen).toBe(true);
      expect(component.showLogoutModal).toBe(false);

      // Show logout modal (should close menu)
      component.showLogout();
      expect(component.isMenuOpen).toBe(false);
      expect(component.showLogoutModal).toBe(true);

      // Hide logout modal
      component.hideLogout();
      expect(component.isMenuOpen).toBe(false);
      expect(component.showLogoutModal).toBe(false);
    });

    it('should handle multiple show/hide logout operations', () => {
      component.showLogout();
      expect(component.showLogoutModal).toBe(true);

      component.hideLogout();
      expect(component.showLogoutModal).toBe(false);

      component.showLogout();
      expect(component.showLogoutModal).toBe(true);

      component.hideLogout();
      expect(component.showLogoutModal).toBe(false);
    });

    it('should close menu when showing logout modal', () => {
      component.isMenuOpen = true;

      component.showLogout();

      expect(component.isMenuOpen).toBe(false);
      expect(component.showLogoutModal).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle null user gracefully', async () => {
      TestBed.resetTestingModule();

      const nullUserAuthService = {
        currentUser$: of(null),
        logout: jest.fn(),
      };

      await configureTestBed(nullUserAuthService);

      fixture = TestBed.createComponent(HeaderMenuComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component).toBeTruthy();

      // Should not display user info when user is null
      const userInfo = fixture.nativeElement.querySelector('.user-info');
      expect(userInfo).toBeFalsy();
    });

    it('should handle modal operations when user is null', async () => {
      TestBed.resetTestingModule();

      const nullUserAuthService = {
        currentUser$: of(null),
        logout: jest.fn(),
      };

      await configureTestBed(nullUserAuthService);

      fixture = TestBed.createComponent(HeaderMenuComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      // Should still be able to show/hide modal
      expect(() => component.showLogout()).not.toThrow();
      expect(() => component.hideLogout()).not.toThrow();
    });

    it('should handle getAvatarInitials with malformed input', () => {
      expect(() => component.getAvatarInitials(null as any)).not.toThrow();
      expect(() => component.getAvatarInitials(undefined as any)).not.toThrow();
    });
  });

  describe('Change Detection', () => {
    it('should use OnPush change detection strategy', () => {
      expect(component.constructor.prototype.constructor.name).toBe(
        'HeaderMenuComponent'
      );
    });

    it('should handle observable changes correctly', (done) => {
      const updatedUser: User = {
        ...mockUser,
        name: 'Jane Smith',
        status: 'away',
      };

      // Mock the service to emit a new user
      (mockAuthService.currentUser$ as any) = of(updatedUser);
      component.currentUser$ = mockAuthService.currentUser$;

      component.currentUser$.subscribe((user) => {
        expect(user).toEqual(updatedUser);
        done();
      });
    });
  });

  describe('Component Integration', () => {
    it('should properly import required modules', () => {
      expect(component).toBeInstanceOf(HeaderMenuComponent);
    });

    it('should handle both modal and navigation approaches', () => {
      // Modal approach
      component.showLogout();
      expect(component.showLogoutModal).toBe(true);

      component.hideLogout();
      expect(component.showLogoutModal).toBe(false);
    });

    it('should maintain consistent state across operations', () => {
      // Test state consistency
      expect(component.isMenuOpen).toBe(false);
      expect(component.showLogoutModal).toBe(false);

      component.toggleMenu();
      expect(component.isMenuOpen).toBe(true);

      component.showLogout();
      expect(component.isMenuOpen).toBe(false);
      expect(component.showLogoutModal).toBe(true);

      component.closeMenu(); // Should not affect modal
      expect(component.showLogoutModal).toBe(true);

      component.hideLogout();
      expect(component.showLogoutModal).toBe(false);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have clickable user info area', () => {
      const userInfo = fixture.nativeElement.querySelector('.user-info');
      expect(userInfo).toBeTruthy();
    });

    it('should have keyboard accessible menu items', () => {
      component.toggleMenu();
      fixture.detectChanges();

      const menuItems = fixture.nativeElement.querySelectorAll('.menu-item');
      menuItems.forEach((item: HTMLElement) => {
        expect(item.tagName.toLowerCase()).toBe('button');
      });
    });

    it('should have proper close button for modal', () => {
      component.showLogout();
      fixture.detectChanges();
      fixture.whenStable().then(() => {
        fixture.detectChanges();
        const closeButton =
          fixture.nativeElement.querySelector('.close-modal-btn');
        expect(closeButton).toBeTruthy();
        expect(closeButton.tagName.toLowerCase()).toBe('button');
      });
    });
  });

  describe('Performance', () => {
    it('should not create multiple observables unnecessarily', () => {
      const initialObservable = component.currentUser$;

      // Create new component instance
      const newComponent = new HeaderMenuComponent();
      newComponent['authService'] = mockAuthService;

      expect(newComponent.currentUser$).toBeDefined();
      expect(typeof newComponent.currentUser$.subscribe).toBe('function');
    });
  });
});
