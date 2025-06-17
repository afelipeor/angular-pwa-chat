import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(email: string, password: string): Promise<any>;
    login(user: any): Promise<{
        token: string;
        user: {
            id: any;
            name: any;
            email: any;
            status: string;
            avatar: any;
        };
    }>;
    register(createUserDto: CreateUserDto): Promise<{
        token: string;
        user: {
            id: any;
            name: any;
            email: any;
            status: string;
            avatar: any;
        };
    }>;
    logout(userId: string): Promise<{
        message: string;
    }>;
}
