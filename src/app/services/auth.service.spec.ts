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
});
