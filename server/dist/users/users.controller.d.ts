import { CreateUserDto, UpdateUserDto } from './dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<import("./schemas").User>;
    findAll(): Promise<import("./schemas").User[]>;
    getProfile(req: any): Promise<import("./schemas").User>;
    findOne(id: string): Promise<import("./schemas").User>;
    updateProfile(req: any, updateUserDto: UpdateUserDto): Promise<import("./schemas").User>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<import("./schemas").User>;
    remove(id: string): Promise<void>;
}
