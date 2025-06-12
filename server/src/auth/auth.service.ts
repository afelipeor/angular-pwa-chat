import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password: _, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user._id };

    // Update user status to online
    await this.usersService.updateStatus(user._id, 'online');

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: 'online',
        avatar: user.avatar,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    const { password: _, ...result } = user.toObject();
    return this.login(result);
  }

  async logout(userId: string) {
    await this.usersService.updateStatus(userId, 'offline');
    return { message: 'Logged out successfully' };
  }
}
