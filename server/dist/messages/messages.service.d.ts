import { Model } from 'mongoose';
import { ChatsService } from '../chats/chats.service';
import { CreateMessageDto, UpdateMessageDto } from './dto';
import { Message, MessageDocument } from './schemas/message.schema';
export declare class MessagesService {
    private messageModel;
    private chatsService;
    constructor(messageModel: Model<MessageDocument>, chatsService: ChatsService);
    create(createMessageDto: CreateMessageDto, senderId: string): Promise<Message>;
    createBotMessage(createMessageDto: CreateMessageDto, botUserId: string): Promise<Message>;
    private transformMessage;
    findByChatId(chatId: string, userId: string, page?: number, limit?: number): Promise<Message[]>;
    markAsRead(messageId: string, userId: string): Promise<Message>;
    markChatMessagesAsRead(chatId: string, userId: string): Promise<void>;
    update(id: string, updateMessageDto: UpdateMessageDto, userId: string): Promise<Message>;
    remove(id: string, userId: string): Promise<void>;
}
