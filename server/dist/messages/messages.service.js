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
exports.MessagesService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const chats_service_1 = require("../chats/chats.service");
const message_schema_1 = require("./schemas/message.schema");
let MessagesService = class MessagesService {
    constructor(messageModel, chatsService) {
        this.messageModel = messageModel;
        this.chatsService = chatsService;
    }
    async create(createMessageDto, senderId) {
        await this.chatsService.findOne(createMessageDto.chatId, senderId);
        const createdMessage = new this.messageModel({
            ...createMessageDto,
            chat: new mongoose_2.Types.ObjectId(createMessageDto.chatId),
            sender: new mongoose_2.Types.ObjectId(senderId),
            readBy: [new mongoose_2.Types.ObjectId(senderId)],
        });
        const savedMessage = await createdMessage.save();
        await this.chatsService.incrementUnreadCount(createMessageDto.chatId, senderId);
        const populatedMessage = await this.messageModel
            .findById(savedMessage._id)
            .populate('sender', 'name email avatar')
            .populate('chat', 'name participants')
            .exec();
        return this.transformMessage(populatedMessage);
    }
    async createBotMessage(createMessageDto, botUserId) {
        const createdMessage = new this.messageModel({
            ...createMessageDto,
            chat: new mongoose_2.Types.ObjectId(createMessageDto.chatId),
            sender: new mongoose_2.Types.ObjectId(botUserId),
            readBy: [],
        });
        const savedMessage = await createdMessage.save();
        const populatedMessage = await this.messageModel
            .findById(savedMessage._id)
            .populate('sender', 'name email avatar')
            .populate('chat', 'name participants')
            .exec();
        return this.transformMessage(populatedMessage);
    }
    transformMessage(message) {
        if (!message)
            return message;
        const transformed = message.toObject ? message.toObject() : message;
        if (transformed.chat) {
            if (typeof transformed.chat === 'string') {
                transformed.chatId = transformed.chat;
            }
            else if (transformed.chat._id) {
                transformed.chatId = transformed.chat._id.toString();
            }
            else if (transformed.chat.toString) {
                transformed.chatId = transformed.chat.toString();
            }
        }
        return transformed;
    }
    async findByChatId(chatId, userId, page = 1, limit = 50) {
        await this.chatsService.findOne(chatId, userId);
        const skip = (page - 1) * limit;
        const messages = await this.messageModel
            .find({ chat: new mongoose_2.Types.ObjectId(chatId) })
            .populate('sender', 'name email avatar')
            .populate('readBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec();
        return messages.map((message) => this.transformMessage(message));
    }
    async markAsRead(messageId, userId) {
        const message = await this.messageModel.findById(messageId);
        if (!message) {
            throw new common_1.NotFoundException(`Message with ID ${messageId} not found`);
        }
        await this.chatsService.findOne(message.chat.toString(), userId);
        const userObjectId = new mongoose_2.Types.ObjectId(userId);
        if (!message.readBy.some((id) => id.equals(userObjectId))) {
            message.readBy.push(userObjectId);
            await message.save();
        }
        return this.messageModel
            .findById(messageId)
            .populate('sender', 'name email avatar')
            .populate('readBy', 'name email')
            .exec();
    }
    async markChatMessagesAsRead(chatId, userId) {
        await this.chatsService.findOne(chatId, userId);
        await this.messageModel.updateMany({
            chat: new mongoose_2.Types.ObjectId(chatId),
            readBy: { $ne: new mongoose_2.Types.ObjectId(userId) },
        }, { $addToSet: { readBy: new mongoose_2.Types.ObjectId(userId) } });
        await this.chatsService.markAsRead(chatId, userId);
    }
    async update(id, updateMessageDto, userId) {
        const message = await this.messageModel.findById(id);
        if (!message) {
            throw new common_1.NotFoundException(`Message with ID ${id} not found`);
        }
        if (message.sender.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only edit your own messages');
        }
        message.content = updateMessageDto.content || message.content;
        message.edited = true;
        message.editedAt = new Date();
        await message.save();
        return this.messageModel
            .findById(id)
            .populate('sender', 'name email avatar')
            .populate('readBy', 'name email')
            .exec();
    }
    async remove(id, userId) {
        const message = await this.messageModel.findById(id);
        if (!message) {
            throw new common_1.NotFoundException(`Message with ID ${id} not found`);
        }
        if (message.sender.toString() !== userId) {
            throw new common_1.ForbiddenException('You can only delete your own messages');
        }
        await this.messageModel.findByIdAndDelete(id);
    }
};
exports.MessagesService = MessagesService;
exports.MessagesService = MessagesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(message_schema_1.Message.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        chats_service_1.ChatsService])
], MessagesService);
//# sourceMappingURL=messages.service.js.map