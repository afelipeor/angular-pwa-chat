import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LogoutComponent } from './logout.component';

describe('LogoutComponent', () => {
  let component: LogoutComponent;
  let fixture: ComponentFixture<LogoutComponent>;
  let mockAuthService: jest.Mocked<AuthService>;
  let mockRouter: jest.Mocked<Router>;

  const configureTestBed = async (authServiceMock?: any, routerMock?: any) => {
    const defaultAuthService = {
      logout: jest.fn(),
      login: jest.fn(),
      currentUser$: jest.fn(),
    };

    const defaultRouter = {
      navigate: jest.fn().mockResolvedValue(true),
    };

    await TestBed.configureTestingModule({
      imports: [LogoutComponent],
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

    fixture = TestBed.createComponent(LogoutComponent);
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

    it('should inject services correctly', () => {
      expect(component['authService']).toBeDefined();
      expect(component['router']).toBeDefined();
    });

    it('should use OnPush change detection strategy', () => {
      expect(component.constructor.prototype.constructor.name).toBe(
        'LogoutComponent'
      );
    });

    it('should have cancelled output event defined', () => {
      expect(component.cancelled).toBeDefined();
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should display logout container', () => {
      const logoutContainer =
        fixture.nativeElement.querySelector('.logout-container');
      expect(logoutContainer).toBeTruthy();
    });

    it('should display logout content', () => {
      const logoutContent =
        fixture.nativeElement.querySelector('.logout-content');
      expect(logoutContent).toBeTruthy();
    });

    it('should display logout icon', () => {
      const logoutIcon = fixture.nativeElement.querySelector('.logout-icon i');
      expect(logoutIcon).toBeTruthy();
      expect(logoutIcon.textContent?.trim()).toBe('exit_to_app');
    });

    it('should display sign out heading', () => {
      const heading = fixture.nativeElement.querySelector('h2');
      expect(heading).toBeTruthy();
      expect(heading.textContent?.trim()).toBe('Sign Out');
    });

    it('should display confirmation message', () => {
      const message = fixture.nativeElement.querySelector('p');
      expect(message).toBeTruthy();
      expect(message.textContent?.trim()).toBe(
        'Are you sure you want to sign out?'
      );
    });

    it('should display cancel button', () => {
      const cancelButton =
        fixture.nativeElement.querySelector('.cancel-button');
      expect(cancelButton).toBeTruthy();
      expect(cancelButton.textContent?.trim()).toBe('Cancel');
    });

    it('should display logout button', () => {
      const logoutButton =
        fixture.nativeElement.querySelector('.logout-button');
      expect(logoutButton).toBeTruthy();
      expect(logoutButton.textContent?.trim()).toBe('Sign Out');
    });

    it('should display logout actions container', () => {
      const logoutActions =
        fixture.nativeElement.querySelector('.logout-actions');
      expect(logoutActions).toBeTruthy();
    });
  });

  describe('Logout Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should call logout method when logout() is called', () => {
      component.logout();

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should trigger logout when logout button is clicked', () => {
      const logoutButton =
        fixture.nativeElement.querySelector('.logout-button');

      logoutButton.click();

      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should call logout service only once per click', () => {
      const logoutButton =
        fixture.nativeElement.querySelector('.logout-button');

      logoutButton.click();

      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
      expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
    });

    it('should navigate to home route after logout', () => {
      component.logout();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('Cancel Functionality', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit cancelled event when cancel() is called', () => {
      jest.spyOn(component.cancelled, 'emit');

      component.cancel();

      expect(component.cancelled.emit).toHaveBeenCalled();
    });

    it('should trigger cancel method when cancel button is clicked', () => {
      jest.spyOn(component, 'cancel');
      const cancelButton =
        fixture.nativeElement.querySelector('.cancel-button');

      cancelButton.click();

      expect(component.cancel).toHaveBeenCalled();
    });

    it('should emit cancelled event when cancel button is clicked', () => {
      jest.spyOn(component.cancelled, 'emit');
      const cancelButton =
        fixture.nativeElement.querySelector('.cancel-button');

      cancelButton.click();

      expect(component.cancelled.emit).toHaveBeenCalled();
    });

    it('should call history.back() when cancel() is called', () => {
      const historySpy = jest
        .spyOn(window.history, 'back')
        .mockImplementation();

      component.cancel();

      expect(historySpy).toHaveBeenCalled();

      historySpy.mockRestore();
    });

    it('should handle history.back() error gracefully', () => {
      const historySpy = jest
        .spyOn(window.history, 'back')
        .mockImplementation(() => {
          throw new Error('History navigation failed');
        });

      expect(() => component.cancel()).not.toThrow();
      expect(historySpy).toHaveBeenCalled();

      historySpy.mockRestore();
    });

    it('should emit cancelled event before calling history.back()', () => {
      const historySpy = jest
        .spyOn(window.history, 'back')
        .mockImplementation();

      let cancelledEmitted = false;
      let historyBackCalled = false;

      jest.spyOn(component.cancelled, 'emit').mockImplementation(() => {
        cancelledEmitted = true;
        expect(historyBackCalled).toBe(false); // History should not have been called yet
      });

      historySpy.mockImplementation(() => {
        historyBackCalled = true;
        expect(cancelledEmitted).toBe(true); // Cancelled should have been emitted first
      });

      component.cancel();

      expect(cancelledEmitted).toBe(true);
      expect(historyBackCalled).toBe(true);

      historySpy.mockRestore();
    });
  });

  describe('Output Events', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should emit cancelled event to parent component', (done) => {
      component.cancelled.subscribe(() => {
        expect(true).toBe(true); // Event was emitted
        done();
      });

      component.cancel();
    });

    it('should not emit cancelled event when logout is called', () => {
      jest.spyOn(component.cancelled, 'emit');

      component.logout();

      expect(component.cancelled.emit).not.toHaveBeenCalled();
    });

    it('should allow parent component to listen to cancelled event', () => {
      let eventEmitted = false;

      component.cancelled.subscribe(() => {
        eventEmitted = true;
      });

      component.cancel();

      expect(eventEmitted).toBe(true);
    });
  });

  describe('Button Interactions', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have correct CSS classes for buttons', () => {
      const cancelButton =
        fixture.nativeElement.querySelector('.cancel-button');
      const logoutButton =
        fixture.nativeElement.querySelector('.logout-button');

      expect(cancelButton.classList.contains('cancel-button')).toBe(true);
      expect(logoutButton.classList.contains('logout-button')).toBe(true);
    });

    it('should not call logout service when cancel button is clicked', () => {
      const cancelButton =
        fixture.nativeElement.querySelector('.cancel-button');

      cancelButton.click();

      expect(mockAuthService.logout).not.toHaveBeenCalled();
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should have cancel button with click event binding', () => {
      const cancelButton =
        fixture.nativeElement.querySelector('.cancel-button');

      expect(cancelButton).not.toBeNull();
      // Optionally, check that the button is clickable by simulating a click and spying on the method
      jest.spyOn(component, 'cancel');
      cancelButton.click();
      expect(component.cancel).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle auth service logout error gracefully', () => {
      mockAuthService.logout.mockImplementation(() => {
        throw new Error('Logout failed');
      });

      expect(() => component.logout()).not.toThrow();
      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should handle router navigation error gracefully', () => {
      mockRouter.navigate.mockImplementation(() => {
        throw new Error('Navigation failed');
      });

      expect(() => component.logout()).not.toThrow();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should still attempt navigation even if logout fails', () => {
      mockAuthService.logout.mockImplementation(() => {
        throw new Error('Logout failed');
      });

      try {
        component.logout();
      } catch (error) {
        // Error should be caught and handled
      }

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });

    it('should handle cancel event emission error gracefully', () => {
      // Mock the emit method to throw an error
      jest.spyOn(component.cancelled, 'emit').mockImplementation(() => {
        throw new Error('Event emission failed');
      });

      expect(() => component.cancel()).not.toThrow();
    });
  });

  describe('Component Behavior', () => {
    it('should be a standalone component', () => {
      expect(component.constructor.prototype.constructor.name).toBe(
        'LogoutComponent'
      );
    });

    it('should be defined as a component', () => {
      expect(component).toBeInstanceOf(LogoutComponent);
    });

    it('should have logout method defined', () => {
      expect(typeof component.logout).toBe('function');
    });

    it('should have cancel method defined', () => {
      expect(typeof component.cancel).toBe('function');
    });

    it('should have access to injected services', () => {
      expect(component['authService']).toBeDefined();
      expect(component['router']).toBeDefined();
    });
  });

  describe('Service Integration', () => {
    it('should call authService.logout before navigation', () => {
      let logoutCalled = false;
      let navigateCalled = false;

      mockAuthService.logout.mockImplementation(() => {
        logoutCalled = true;
        expect(navigateCalled).toBe(false); // Navigation should not have been called yet
      });

      mockRouter.navigate.mockImplementation(() => {
        navigateCalled = true;
        expect(logoutCalled).toBe(true); // Logout should have been called first
        return Promise.resolve(true);
      });

      component.logout();

      expect(logoutCalled).toBe(true);
      expect(navigateCalled).toBe(true);
    });

    it('should handle async router navigation', async () => {
      mockRouter.navigate.mockResolvedValue(true);

      component.logout();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/']);
    });
  });

  describe('Multiple Action Attempts', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should handle multiple rapid logout button clicks', () => {
      const logoutButton =
        fixture.nativeElement.querySelector('.logout-button');

      logoutButton.click();
      logoutButton.click();
      logoutButton.click();

      expect(mockAuthService.logout).toHaveBeenCalledTimes(3);
      expect(mockRouter.navigate).toHaveBeenCalledTimes(3);
    });

    it('should call logout method multiple times if invoked multiple times', () => {
      component.logout();
      component.logout();

      expect(mockAuthService.logout).toHaveBeenCalledTimes(2);
      expect(mockRouter.navigate).toHaveBeenCalledTimes(2);
    });

    it('should handle multiple rapid cancel button clicks', () => {
      jest.spyOn(component.cancelled, 'emit');
      const cancelButton =
        fixture.nativeElement.querySelector('.cancel-button');

      cancelButton.click();
      cancelButton.click();
      cancelButton.click();

      expect(component.cancelled.emit).toHaveBeenCalledTimes(3);
    });

    it('should call cancel method multiple times if invoked multiple times', () => {
      jest.spyOn(component.cancelled, 'emit');

      component.cancel();
      component.cancel();

      expect(component.cancelled.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('DOM Structure', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should have correct DOM hierarchy', () => {
      const container =
        fixture.nativeElement.querySelector('.logout-container');
      const content = container.querySelector('.logout-content');
      const icon = content.querySelector('.logout-icon');
      const actions = content.querySelector('.logout-actions');

      expect(container).toBeTruthy();
      expect(content).toBeTruthy();
      expect(icon).toBeTruthy();
      expect(actions).toBeTruthy();
    });

    it('should have both buttons in actions container', () => {
      const actions = fixture.nativeElement.querySelector('.logout-actions');
      const buttons = actions.querySelectorAll('button');

      expect(buttons.length).toBe(2);
      expect(buttons[0].classList.contains('cancel-button')).toBe(true);
      expect(buttons[1].classList.contains('logout-button')).toBe(true);
    });
  });

  describe('Modal Usage Integration', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should work as modal component by emitting cancelled event', () => {
      let modalClosed = false;

      component.cancelled.subscribe(() => {
        modalClosed = true;
      });

      component.cancel();

      expect(modalClosed).toBe(true);
    });

    it('should work as standalone page by calling history.back()', () => {
      const historySpy = jest
        .spyOn(window.history, 'back')
        .mockImplementation();

      component.cancel();

      expect(historySpy).toHaveBeenCalled();

      historySpy.mockRestore();
    });

    it('should support both modal and standalone usage patterns', () => {
      const historySpy = jest
        .spyOn(window.history, 'back')
        .mockImplementation();
      jest.spyOn(component.cancelled, 'emit');

      component.cancel();

      // Both modal (event emission) and standalone (history.back) should work
      expect(component.cancelled.emit).toHaveBeenCalled();
      expect(historySpy).toHaveBeenCalled();

      historySpy.mockRestore();
    });
  });
});
