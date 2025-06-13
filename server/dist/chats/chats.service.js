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
exports.ChatsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const chat_schema_1 = require("./schemas/chat.schema");
let ChatsService = class ChatsService {
    constructor(chatModel) {
        this.chatModel = chatModel;
    }
    async create(createChatDto, userId) {
        const participants = [
            userId,
            ...createChatDto.participants.filter(id => id !== userId)
        ];
        const createdChat = new this.chatModel({
            ...createChatDto,
            participants: participants.map(id => new mongoose_2.Types.ObjectId(id)),
            createdBy: new mongoose_2.Types.ObjectId(userId),
        });
        return (await createdChat.save()).populate('participants', 'name email avatar status');
    }
    async findAll(userId) {
        return this.chatModel
            .find({ participants: new mongoose_2.Types.ObjectId(userId) })
            .populate('participants', 'name email avatar status')
            .populate('lastMessage')
            .sort({ updatedAt: -1 })
            .exec();
    }
    async findOne(id, userId) {
        const chat = await this.chatModel
            .findById(id)
            .populate('participants', 'name email avatar status')
            .populate('lastMessage')
            .exec();
        if (!chat) {
            throw new common_1.NotFoundException(`Chat with ID ${id} not found`);
        }
        const isParticipant = chat.participants.some(participant => participant._id.toString() === userId);
        if (!isParticipant) {
            throw new common_1.ForbiddenException('You are not a participant in this chat');
        }
        return chat;
    }
    async update(id, updateChatDto, userId) {
        const chat = await this.findOne(id, userId);
        const updatedChat = await this.chatModel
            .findByIdAndUpdate(id, updateChatDto, { new: true })
            .populate('participants', 'name email avatar status')
            .populate('lastMessage')
            .exec();
        return updatedChat;
    }
    async markAsRead(chatId, userId) {
        await this.chatModel.findByIdAndUpdate(chatId, { $unset: { [`unreadCount.${userId}`]: "" } });
    }
    async incrementUnreadCount(chatId, excludeUserId) {
        const chat = await this.chatModel.findById(chatId);
        if (!chat)
            return;
        const updates = {};
        chat.participants.forEach(participantId => {
            const participantIdStr = participantId.toString();
            if (participantIdStr !== excludeUserId) {
                const currentCount = chat.unreadCount.get(participantIdStr) || 0;
                updates[`unreadCount.${participantIdStr}`] = currentCount + 1;
            }
        });
        await this.chatModel.findByIdAndUpdate(chatId, updates);
    }
    async remove(id, userId) {
        const chat = await this.findOne(id, userId);
        if (chat.createdBy.toString() !== userId) {
            throw new common_1.ForbiddenException('Only the creator can delete this chat');
        }
        await this.chatModel.findByIdAndDelete(id);
    }
};
exports.ChatsService = ChatsService;
exports.ChatsService = ChatsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(chat_schema_1.Chat.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ChatsService);
//# sourceMappingURL=chats.service.js.map