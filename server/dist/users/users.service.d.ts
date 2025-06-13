import { Model } from 'mongoose';
import { CreateUserDto, UpdateUserDto } from './dto';
import { User, UserDocument } from './schemas';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    create(createUserDto: CreateUserDto): Promise<User>;
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<User>;
    findByEmail(email: string): Promise<UserDocument>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
    updateStatus(id: string, status: string): Promise<User>;
    addDeviceToken(userId: string, token: string): Promise<void>;
    removeDeviceToken(userId: string, token: string): Promise<void>;
    remove(id: string): Promise<void>;
}
