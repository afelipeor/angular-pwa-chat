"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const testing_1 = require("@nestjs/testing");
const mongoose_2 = require("mongoose");
const chats_service_1 = require("../chats/chats.service");
const message_schema_1 = require("./schemas/message.schema");
const messages_service_1 = require("./messages.service");
describe('MessagesService', () => {
    let service;
    let mockMessageModel;
    let mockChatsService;
    const mockMessage = {
        _id: '60a6c8b8b4f1a8001f6b1234',
        content: 'Test message',
        sender: new mongoose_2.Types.ObjectId('60a6c8b8b4f1a8001f6b5678'),
        chat: new mongoose_2.Types.ObjectId('60a6c8b8b4f1a8001f6b9012'),
        readBy: [new mongoose_2.Types.ObjectId('60a6c8b8b4f1a8001f6b5678')],
        save: jest.fn().mockResolvedValue(true),
    };
    beforeEach(async () => {
        const mockModel = {
            new: jest.fn().mockImplementation((data) => ({
                ...data,
                save: jest.fn().mockResolvedValue(mockMessage),
            })),
            constructor: jest.fn().mockImplementation((data) => ({
                ...data,
                save: jest.fn().mockResolvedValue(mockMessage),
            })),
            find: jest.fn(),
            findById: jest.fn(),
            findByIdAndDelete: jest.fn(),
            updateMany: jest.fn(),
            populate: jest.fn().mockReturnThis(),
            sort: jest.fn().mockReturnThis(),
            skip: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            exec: jest.fn(),
            model: jest.fn(),
        };
        const mockChatService = {
            findOne: jest.fn(),
            incrementUnreadCount: jest.fn(),
            markAsRead: jest.fn(),
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                messages_service_1.MessagesService,
                { provide: (0, mongoose_1.getModelToken)(message_schema_1.Message.name), useValue: mockModel },
                { provide: chats_service_1.ChatsService, useValue: mockChatService },
            ],
        }).compile();
        service = module.get(messages_service_1.MessagesService);
        mockMessageModel = module.get((0, mongoose_1.getModelToken)(message_schema_1.Message.name));
        mockChatsService = module.get(chats_service_1.ChatsService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    describe('create', () => {
        it('should create a new message', async () => {
            const createMessageDto = {
                content: 'Test message',
                chatId: '60a6c8b8b4f1a8001f6b9012',
                type: 'text',
            };
            const senderId = '60a6c8b8b4f1a8001f6b5678';
            mockChatsService.findOne.mockResolvedValue({});
            mockMessageModel.mockImplementation(() => ({
                save: jest.fn().mockResolvedValue(mockMessage),
            }));
            mockMessageModel.findById.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        exec: jest.fn().mockResolvedValue(mockMessage),
                    }),
                }),
            });
            const result = await service.create(createMessageDto, senderId);
            expect(mockChatsService.findOne).toHaveBeenCalledWith(createMessageDto.chatId, senderId);
            expect(result).toEqual(mockMessage);
        });
        it('should throw error if user is not participant', async () => {
            const createMessageDto = {
                content: 'Test message',
                chatId: '60a6c8b8b4f1a8001f6b9012',
                type: 'text',
            };
            const senderId = '60a6c8b8b4f1a8001f6b5678';
            mockChatsService.findOne.mockRejectedValue(new common_1.ForbiddenException());
            await expect(service.create(createMessageDto, senderId)).rejects.toThrow(common_1.ForbiddenException);
        });
    });
    describe('findByChatId', () => {
        it('should return messages for a chat', async () => {
            const chatId = '60a6c8b8b4f1a8001f6b9012';
            const userId = '60a6c8b8b4f1a8001f6b5678';
            const messages = [mockMessage];
            mockChatsService.findOne.mockResolvedValue({});
            mockMessageModel.find.mockReturnValue({
                populate: jest.fn().mockReturnValue({
                    populate: jest.fn().mockReturnValue({
                        sort: jest.fn().mockReturnValue({
                            skip: jest.fn().mockReturnValue({
                                limit: jest.fn().mockReturnValue({
                                    exec: jest.fn().mockResolvedValue(messages),
                                }),
                            }),
                        }),
                    }),
                }),
            });
            const result = await service.findByChatId(chatId, userId, 1, 50);
            expect(mockChatsService.findOne).toHaveBeenCalledWith(chatId, userId);
            expect(result).toEqual(messages);
        });
    });
    describe('markAsRead', () => {
        it('should mark message as read', async () => {
            const messageId = '60a6c8b8b4f1a8001f6b1234';
            const userId = '60a6c8b8b4f1a8001f6b5678';
            mockMessageModel.findById.mockResolvedValue(mockMessage);
            mockChatsService.findOne.mockResolvedValue({});
            const result = await service.markAsRead(messageId, userId);
            expect(mockMessage.save).toHaveBeenCalled();
            expect(result).toEqual(mockMessage);
        });
        it('should throw NotFoundException for non-existent message', async () => {
            const messageId = '60a6c8b8b4f1a8001f6b1234';
            const userId = '60a6c8b8b4f1a8001f6b5678';
            mockMessageModel.findById.mockResolvedValue(null);
            await expect(service.markAsRead(messageId, userId)).rejects.toThrow(common_1.NotFoundException);
        });
    });
    describe('remove', () => {
        it('should delete message by sender', async () => {
            const messageId = '60a6c8b8b4f1a8001f6b1234';
            const userId = '60a6c8b8b4f1a8001f6b5678';
            mockMessageModel.findById.mockResolvedValue(mockMessage);
            mockMessageModel.findByIdAndDelete.mockResolvedValue(mockMessage);
            await service.remove(messageId, userId);
            expect(mockMessageModel.findByIdAndDelete).toHaveBeenCalledWith(messageId);
        });
        it('should throw ForbiddenException when non-sender tries to delete', async () => {
            const messageId = '60a6c8b8b4f1a8001f6b1234';
            const differentUserId = '60a6c8b8b4f1a8001f6b9999';
            mockMessageModel.findById.mockResolvedValue(mockMessage);
            await expect(service.remove(messageId, differentUserId)).rejects.toThrow(common_1.ForbiddenException);
        });
    });
});
//# sourceMappingURL=messages.service.spec.js.map