import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { User } from '../../models';
import { AuthService } from '../../services/auth.service';
import { HeaderMenuComponent } from './header-menu.component';

describe('HeaderMenuComponent', () => {
  let component: HeaderMenuComponent;
  let fixture: ComponentFixture<HeaderMenuComponent>;
  let mockAuthService: any;
  let mockRouter: any;

  const mockUser: User = {
    _id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    status: 'online',
  };

  beforeEach(async () => {
    mockAuthService = {
      currentUser$: of(mockUser),
      logout: jasmine.createSpy('logout'),
    };

    mockRouter = {
      navigate: jasmine.createSpy('navigate'),
    };

    await TestBed.configureTestingModule({
      imports: [HeaderMenuComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderMenuComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with menu closed', () => {
    expect(component.isMenuOpen).toBe(false);
  });

  it('should toggle menu state', () => {
    expect(component.isMenuOpen).toBe(false);
    component.toggleMenu();
    expect(component.isMenuOpen).toBe(true);
    component.toggleMenu();
    expect(component.isMenuOpen).toBe(false);
  });

  it('should close menu', () => {
    component.isMenuOpen = true;
    component.closeMenu();
    expect(component.isMenuOpen).toBe(false);
  });

  it('should call AuthService logout and close menu on logout', () => {
    component.isMenuOpen = true;

    component.logout();

    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(component.isMenuOpen).toBe(false);
  });

  it('should generate correct avatar initials', () => {
    expect(component.getAvatarInitials('John')).toBe('J');
    expect(component.getAvatarInitials('John Doe')).toBe('JD');
    expect(component.getAvatarInitials('John Michael Doe')).toBe('JMD');
    expect(component.getAvatarInitials('')).toBe('');
  });

  it('should return correct status colors', () => {
    expect(component.getStatusColor('online')).toBe('#4caf50');
    expect(component.getStatusColor('away')).toBe('#ff9800');
    expect(component.getStatusColor('offline')).toBe('#9e9e9e');
    expect(component.getStatusColor()).toBe('#9e9e9e');
  });

  it('should display user information when user is logged in', () => {
    fixture.detectChanges();

    const userNameElement =
      fixture.nativeElement.querySelector('.user-details h2');
    const userStatusElement = fixture.nativeElement.querySelector(
      '.user-details .status'
    );

    expect(userNameElement?.textContent).toContain('John Doe');
    expect(userStatusElement?.textContent).toContain('online');
  });

  it('should show dropdown menu when menu is open', () => {
    component.toggleMenu();
    fixture.detectChanges();

    const dropdownMenu = fixture.nativeElement.querySelector('.dropdown-menu');
    expect(dropdownMenu).toBeTruthy();
  });

  it('should hide dropdown menu when menu is closed', () => {
    component.isMenuOpen = false;
    fixture.detectChanges();

    const dropdownMenu = fixture.nativeElement.querySelector('.dropdown-menu');
    expect(dropdownMenu).toBeFalsy();
  });

  it('should call logout when logout button is clicked', () => {
    spyOn(component, 'logout');
    component.toggleMenu();
    fixture.detectChanges();

    const logoutButton = fixture.nativeElement.querySelector('.logout-item');
    logoutButton.click();

    expect(component.logout).toHaveBeenCalled();
  });
});
