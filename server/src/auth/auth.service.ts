import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      const user = await this.usersService.findByEmail(email);
      if (user && (await bcrypt.compare(password, user.password))) {
        const userObject = user.toObject();
        const { password: _, ...result } = userObject;
        return result;
      }
      return null;
    } catch (error) {
      // If user not found, return null instead of throwing
      if (error.message.includes('not found')) {
        return null;
      }
      throw error;
    }
  }

  async login(user: any) {
    // Ensure we have a proper user ID - check both _id and id fields
    const userId = user._id || user.id;
    if (!userId) {
      console.error('Login failed: User object is missing ID', user);
      throw new Error('User ID is missing');
    }

    const payload = { email: user.email, sub: userId.toString() };

    // Update user status to online - convert ObjectId to string
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

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    // Convert mongoose document to plain object to remove password
    const userObject = user.toObject();
    const { password: _, ...result } = userObject;

    // Ensure _id is present and properly formatted
    if (!result._id) {
      throw new Error('User creation failed: ID is missing');
    }

    return this.login(result);
  }

  async logout(userId: string) {
    await this.usersService.updateStatus(userId, 'offline');
    return { message: 'Logged out successfully' };
  }
}
