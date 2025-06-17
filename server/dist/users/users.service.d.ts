import { Model } from 'mongoose';
import { CreateUserDto, UpdateUserDto } from './dto';
import { User, UserDocument } from './schemas';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    create(createUserDto: CreateUserDto): Promise<UserDocument>;
    findAll(): Promise<User[]>;
    findOne(id: string): Promise<UserDocument>;
    findByEmail(email: string): Promise<UserDocument>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument>;
    updateStatus(id: string, status: string): Promise<UserDocument>;
    addDeviceToken(userId: string, token: string): Promise<void>;
    removeDeviceToken(userId: string, token: string): Promise<void>;
    remove(id: string): Promise<void>;
}
