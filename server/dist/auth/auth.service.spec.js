"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jwt_1 = require("@nestjs/jwt");
const testing_1 = require("@nestjs/testing");
const bcrypt = require("bcrypt");
const users_service_1 = require("../users/users.service");
const auth_service_1 = require("./auth.service");
describe('AuthService', () => {
    let service;
    let mockUsersService;
    let mockJwtService;
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
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: users_service_1.UsersService, useValue: mockUserService },
                { provide: jwt_1.JwtService, useValue: mockJwtSvc },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
        mockUsersService = module.get(users_service_1.UsersService);
        mockJwtService = module.get(jwt_1.JwtService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('validateUser', () => {
        it('should validate user with correct credentials', async () => {
            mockUsersService.findByEmail.mockResolvedValue(mockUser);
            jest
                .spyOn(bcrypt, 'compare')
                .mockImplementation(() => Promise.resolve(true));
            const result = await service.validateUser('john@example.com', 'password');
            expect(result).toEqual({
                _id: '60a6c8b8b4f1a8001f6b1234',
                name: 'John Doe',
                email: 'john@example.com',
                status: 'offline',
            });
        });
        it('should return null for invalid credentials', async () => {
            mockUsersService.findByEmail.mockResolvedValue(mockUser);
            jest
                .spyOn(bcrypt, 'compare')
                .mockImplementation(() => Promise.resolve(false));
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
            mockUsersService.updateStatus.mockResolvedValue(user);
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
            mockUsersService.create.mockResolvedValue(createdUser);
            mockJwtService.sign.mockReturnValue('mock-jwt-token');
            mockUsersService.updateStatus.mockResolvedValue(createdUser);
            const result = await service.register(createUserDto);
            expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
            expect(result).toHaveProperty('access_token');
            expect(result).toHaveProperty('user');
        });
    });
    describe('logout', () => {
        it('should logout user and update status', async () => {
            const userId = '60a6c8b8b4f1a8001f6b1234';
            mockUsersService.updateStatus.mockResolvedValue(mockUser);
            const result = await service.logout(userId);
            expect(mockUsersService.updateStatus).toHaveBeenCalledWith(userId, 'offline');
            expect(result).toEqual({ message: 'Logged out successfully' });
        });
    });
});
//# sourceMappingURL=auth.service.spec.js.map