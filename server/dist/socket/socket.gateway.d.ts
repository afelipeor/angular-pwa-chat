import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatsService } from '../chats/chats.service';
import { CreateMessageDto } from '../messages/dto';
import { MessagesService } from '../messages/messages.service';
import { UsersService } from '../users/users.service';
interface AuthenticatedSocket extends Socket {
    userId?: string;
    user?: any;
}
export declare class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    private usersService;
    private chatsService;
    private messagesService;
    server: Server;
    private connectedUsers;
    constructor(jwtService: JwtService, usersService: UsersService, chatsService: ChatsService, messagesService: MessagesService);
    handleConnection(client: AuthenticatedSocket): Promise<void>;
    handleDisconnect(client: AuthenticatedSocket): Promise<void>;
    handleMessage(createMessageDto: CreateMessageDto, client: AuthenticatedSocket): Promise<{
        success: boolean;
        message: import("../messages/schemas").Message;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
        message?: undefined;
    }>;
    handleJoinChat(data: {
        chatId: string;
    }, client: AuthenticatedSocket): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
    handleLeaveChat(data: {
        chatId: string;
    }, client: AuthenticatedSocket): Promise<{
        success: boolean;
    }>;
    handleTyping(data: {
        chatId: string;
        isTyping: boolean;
    }, client: AuthenticatedSocket): Promise<void>;
    handleMarkMessageRead(data: {
        messageId: string;
    }, client: AuthenticatedSocket): Promise<{
        success: boolean;
        error?: undefined;
    } | {
        success: boolean;
        error: any;
    }>;
}
export {};
