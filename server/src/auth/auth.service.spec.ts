import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: jest.Mocked<UsersService>;
  let mockJwtService: jest.Mocked<JwtService>;

  const mockUser = {
    _id: '60a6c8b8b4f1a8001f6b1234',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashedPassword',
    status: 'offline',
    toObject: () => ({
      _id: '60a6c8b8b4f1a8001f6b1234',
      name: 'John Doe',
      email: 'john@example.com',
      status: 'offline',
    }),
  };

  beforeEach(async () => {
    const mockUserService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
    };

    const mockJwtSvc = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUserService },
        { provide: JwtService, useValue: mockJwtSvc },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    mockUsersService = module.get(UsersService);
    mockJwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should validate user with correct credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as any);

      const result = await service.validateUser('john@example.com', 'password');

      expect(result).toEqual({
        _id: '60a6c8b8b4f1a8001f6b1234',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'offline',
      });
    });

    it('should return null for invalid credentials', async () => {
      mockUsersService.findByEmail.mockResolvedValue(mockUser as any);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as any);

      const result = await service.validateUser('john@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });

    it('should return null for non-existent user', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should login user and return access token', async () => {
      const user = {
        _id: '60a6c8b8b4f1a8001f6b1234',
        name: 'John Doe',
        email: 'john@example.com',
        status: 'offline',
      };

      mockJwtService.sign.mockReturnValue('mock-jwt-token');
      mockUsersService.updateStatus.mockResolvedValue(user as any);

      const result = await service.login(user);

      expect(mockUsersService.updateStatus).toHaveBeenCalledWith(user._id, 'online');
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user._id,
      });
      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          status: 'online',
          avatar: undefined,
        },
      });
    });
  });

  describe('register', () => {
    it('should register user and return login result', async () => {
      const createUserDto = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const createdUser = {
        _id: '60a6c8b8b4f1a8001f6b1234',
        name: 'John Doe',
        email: 'john@example.com',
        toObject: () => ({
          _id: '60a6c8b8b4f1a8001f6b1234',
          name: 'John Doe',
          email: 'john@example.com',
        }),
      };

      mockUsersService.create.mockResolvedValue(createdUser as any);
      mockJwtService.sign.mockReturnValue('mock-jwt-token');
      mockUsersService.updateStatus.mockResolvedValue(createdUser as any);

      const result = await service.register(createUserDto);

      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('user');
    });
  });

  describe('logout', () => {
    it('should logout user and update status', async () => {
      const userId = '60a6c8b8b4f1a8001f6b1234';
      mockUsersService.updateStatus.mockResolvedValue(mockUser as any);

      const result = await service.logout(userId);

      expect(mockUsersService.updateStatus).toHaveBeenCalledWith(userId, 'offline');
      expect(result).toEqual({ message: 'Logged out successfully' });
    });
  });
});