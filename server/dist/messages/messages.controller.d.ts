import { SocketGateway } from '../socket/socket.gateway';
import { CreateMessageDto, UpdateMessageDto } from './dto';
import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    private readonly socketGateway;
    constructor(messagesService: MessagesService, socketGateway: SocketGateway);
    create(createMessageDto: CreateMessageDto, req: any): Promise<import("./schemas").Message>;
    findByChatId(chatId: string, page?: number, limit?: number, req?: any): Promise<import("./schemas").Message[]>;
    markAsRead(id: string, req: any): Promise<import("./schemas").Message>;
    markChatAsRead(chatId: string, req: any): Promise<void>;
    update(id: string, updateMessageDto: UpdateMessageDto, req: any): Promise<import("./schemas").Message>;
    remove(id: string, req: any): Promise<void>;
}
