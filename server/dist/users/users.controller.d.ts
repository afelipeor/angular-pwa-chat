import { CreateUserDto, UpdateUserDto } from './dto';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<import("./schemas").UserDocument>;
    findAll(): Promise<import("./schemas").User[]>;
    getProfile(req: any): Promise<import("./schemas").UserDocument>;
    findOne(id: string): Promise<import("./schemas").UserDocument>;
    updateProfile(req: any, updateUserDto: UpdateUserDto): Promise<import("./schemas").UserDocument>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<import("./schemas").UserDocument>;
    remove(id: string): Promise<void>;
}
