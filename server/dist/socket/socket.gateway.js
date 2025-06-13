"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketGateway = void 0;
const jwt_1 = require("@nestjs/jwt");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const chats_service_1 = require("../chats/chats.service");
const dto_1 = require("../messages/dto");
const messages_service_1 = require("../messages/messages.service");
const users_service_1 = require("../users/users.service");
let SocketGateway = class SocketGateway {
    constructor(jwtService, usersService, chatsService, messagesService) {
        this.jwtService = jwtService;
        this.usersService = usersService;
        this.chatsService = chatsService;
        this.messagesService = messagesService;
        this.connectedUsers = new Map();
    }
    async handleConnection(client) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization?.replace('Bearer ', '');
            if (!token) {
                client.disconnect();
                return;
            }
            const payload = this.jwtService.verify(token);
            const user = await this.usersService.findOne(payload.sub);
            client.userId = payload.sub;
            client.user = user;
            this.connectedUsers.set(payload.sub, client.id);
            await this.usersService.updateStatus(payload.sub, 'online');
            const userChats = await this.chatsService.findAll(payload.sub);
            userChats.forEach((chat) => {
                client.join(`chat-${chat._id}`);
            });
            this.server.emit('userStatusUpdate', {
                userId: payload.sub,
                status: 'online',
                user: {
                    id: user._id,
                    name: user.name,
                    avatar: user.avatar,
                },
            });
            console.log(`User ${user.name} connected with socket ${client.id}`);
        }
        catch (error) {
            console.error('WebSocket authentication error:', error);
            client.disconnect();
        }
    }
    async handleDisconnect(client) {
        if (client.userId) {
            this.connectedUsers.delete(client.userId);
            await this.usersService.updateStatus(client.userId, 'offline');
            this.server.emit('userStatusUpdate', {
                userId: client.userId,
                status: 'offline',
            });
            console.log(`User ${client.userId} disconnected`);
        }
    }
    async handleMessage(createMessageDto, client) {
        try {
            const message = await this.messagesService.create(createMessageDto, client.userId);
            this.server
                .to(`chat-${createMessageDto.chatId}`)
                .emit('newMessage', message);
            return { success: true, message };
        }
        catch (error) {
            console.error('Error sending message:', error);
            return { success: false, error: error.message };
        }
    }
    async handleJoinChat(data, client) {
        try {
            await this.chatsService.findOne(data.chatId, client.userId);
            client.join(`chat-${data.chatId}`);
            await this.messagesService.markChatMessagesAsRead(data.chatId, client.userId);
            return { success: true };
        }
        catch (error) {
            console.error('Error joining chat:', error);
            return { success: false, error: error.message };
        }
    }
    async handleLeaveChat(data, client) {
        client.leave(`chat-${data.chatId}`);
        return { success: true };
    }
    async handleTyping(data, client) {
        client.to(`chat-${data.chatId}`).emit('userTyping', {
            userId: client.userId,
            userName: client.user?.name,
            isTyping: data.isTyping,
        });
    }
    async handleMarkMessageRead(data, client) {
        try {
            const message = await this.messagesService.markAsRead(data.messageId, client.userId);
            this.server.to(`chat-${message.chat}`).emit('messageRead', {
                messageId: data.messageId,
                readBy: client.userId,
                user: {
                    id: client.userId,
                    name: client.user?.name,
                },
            });
            return { success: true };
        }
        catch (error) {
            console.error('Error marking message as read:', error);
            return { success: false, error: error.message };
        }
    }
};
exports.SocketGateway = SocketGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SocketGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateMessageDto, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleMessage", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinChat'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleJoinChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leaveChat'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleLeaveChat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleTyping", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('markMessageRead'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SocketGateway.prototype, "handleMarkMessageRead", null);
exports.SocketGateway = SocketGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: ['http://localhost:4200', 'http://localhost:3000'],
            methods: ['GET', 'POST'],
            credentials: true,
        },
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        users_service_1.UsersService,
        chats_service_1.ChatsService,
        messages_service_1.MessagesService])
], SocketGateway);
//# sourceMappingURL=socket.gateway.js.map