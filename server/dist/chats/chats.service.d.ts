import { Model } from 'mongoose';
import { CreateChatDto, UpdateChatDto } from './dto';
import { Chat, ChatDocument } from './schemas/chat.schema';
export declare class ChatsService {
    private chatModel;
    constructor(chatModel: Model<ChatDocument>);
    create(createChatDto: CreateChatDto, userId: string): Promise<Chat>;
    findAll(userId: string): Promise<Chat[]>;
    findOne(id: string, userId: string): Promise<Chat>;
    update(id: string, updateChatDto: UpdateChatDto, userId: string): Promise<Chat>;
    markAsRead(chatId: string, userId: string): Promise<void>;
    incrementUnreadCount(chatId: string, excludeUserId: string): Promise<void>;
    remove(id: string, userId: string): Promise<void>;
}
