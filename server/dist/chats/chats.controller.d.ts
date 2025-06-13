import { ChatsService } from './chats.service';
import { CreateChatDto, UpdateChatDto } from './dto';
export declare class ChatsController {
    private readonly chatsService;
    constructor(chatsService: ChatsService);
    create(createChatDto: CreateChatDto, req: any): Promise<import("./schemas").Chat>;
    findAll(req: any): Promise<import("./schemas").Chat[]>;
    findOne(id: string, req: any): Promise<import("./schemas").Chat>;
    update(id: string, updateChatDto: UpdateChatDto, req: any): Promise<import("./schemas").Chat>;
    markAsRead(id: string, req: any): Promise<void>;
    remove(id: string, req: any): Promise<void>;
}
