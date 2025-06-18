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
exports.MessagesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const socket_gateway_1 = require("../socket/socket.gateway");
const dto_1 = require("./dto");
const messages_service_1 = require("./messages.service");
let MessagesController = class MessagesController {
    constructor(messagesService, socketGateway) {
        this.messagesService = messagesService;
        this.socketGateway = socketGateway;
    }
    async create(createMessageDto, req) {
        console.log(`📨 HTTP API: Received message from user ${req.user.userId}: ${createMessageDto.content}`);
        const message = await this.messagesService.create(createMessageDto, req.user.userId);
        await this.socketGateway.triggerAutoResponseFromAPI(createMessageDto.chatId, req.user.userId);
        return message;
    }
    findByChatId(chatId, page, limit, req) {
        return this.messagesService.findByChatId(chatId, req.user.userId, page || 1, limit || 50);
    }
    markAsRead(id, req) {
        return this.messagesService.markAsRead(id, req.user.userId);
    }
    markChatAsRead(chatId, req) {
        return this.messagesService.markChatMessagesAsRead(chatId, req.user.userId);
    }
    update(id, updateMessageDto, req) {
        return this.messagesService.update(id, updateMessageDto, req.user.userId);
    }
    remove(id, req) {
        return this.messagesService.remove(id, req.user.userId);
    }
};
exports.MessagesController = MessagesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Message sent successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateMessageDto, Object]),
    __metadata("design:returntype", Promise)
], MessagesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('chat/:chatId'),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Returns chat messages' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "findByChatId", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Message marked as read' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Patch)('chat/:chatId/read'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'All chat messages marked as read' }),
    __param(0, (0, common_1.Param)('chatId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "markChatAsRead", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Message updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateMessageDto, Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Message deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MessagesController.prototype, "remove", null);
exports.MessagesController = MessagesController = __decorate([
    (0, swagger_1.ApiTags)('messages'),
    (0, common_1.Controller)('messages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => socket_gateway_1.SocketGateway))),
    __metadata("design:paramtypes", [messages_service_1.MessagesService,
        socket_gateway_1.SocketGateway])
], MessagesController);
//# sourceMappingURL=messages.controller.js.map