"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
    }
    async validateUser(email, password) {
        try {
            const user = await this.usersService.findByEmail(email);
            if (user && (await bcrypt.compare(password, user.password))) {
                const userObject = user.toObject();
                const { password: _, ...result } = userObject;
                return result;
            }
            return null;
        }
        catch (error) {
            if (error.message.includes('not found')) {
                return null;
            }
            throw error;
        }
    }
    async login(user) {
        const userId = user._id || user.id;
        if (!userId) {
            console.error('Login failed: User object is missing ID', user);
            throw new Error('User ID is missing');
        }
        const payload = { email: user.email, sub: userId.toString() };
        await this.usersService.updateStatus(userId.toString(), 'online');
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: userId.toString(),
                name: user.name,
                email: user.email,
                status: 'online',
                avatar: user.avatar,
            },
        };
    }
    async register(createUserDto) {
        const user = await this.usersService.create(createUserDto);
        const userObject = user.toObject();
        const { password: _, ...result } = userObject;
        if (!result._id) {
            throw new Error('User creation failed: ID is missing');
        }
        return this.login(result);
    }
    async logout(userId) {
        await this.usersService.updateStatus(userId, 'offline');
        return { message: 'Logged out successfully' };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map