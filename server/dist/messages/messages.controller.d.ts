import { CreateMessageDto, UpdateMessageDto } from './dto';
import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    create(createMessageDto: CreateMessageDto, req: any): Promise<import("./schemas").Message>;
    findByChatId(chatId: string, page?: number, limit?: number, req?: any): Promise<import("./schemas").Message[]>;
    markAsRead(id: string, req: any): Promise<import("./schemas").Message>;
    markChatAsRead(chatId: string, req: any): Promise<void>;
    update(id: string, updateMessageDto: UpdateMessageDto, req: any): Promise<import("./schemas").Message>;
    remove(id: string, req: any): Promise<void>;
}
