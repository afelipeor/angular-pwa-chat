import { CreateUserDto } from '../users/dto/create-user.dto';
import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(req: any): Promise<{
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
    logout(req: any): Promise<{
        message: string;
    }>;
}
