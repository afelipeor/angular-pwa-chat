import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { ChatsService } from '../chats/chats.service';
import { Message } from './schemas/message.schema';
import { MessagesService } from './messages.service';

describe('MessagesService', () => {
  let service: MessagesService;
  let mockMessageModel: any;
  let mockChatsService: jest.Mocked<ChatsService>;

  const mockMessage = {
    _id: '60a6c8b8b4f1a8001f6b1234',
    content: 'Test message',
    sender: new Types.ObjectId('60a6c8b8b4f1a8001f6b5678'),
    chat: new Types.ObjectId('60a6c8b8b4f1a8001f6b9012'),
    readBy: [new Types.ObjectId('60a6c8b8b4f1a8001f6b5678')],
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: getModelToken(Message.name), useValue: mockModel },
        { provide: ChatsService, useValue: mockChatService },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    mockMessageModel = module.get(getModelToken(Message.name));
    mockChatsService = module.get(ChatsService);
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

      mockChatsService.findOne.mockResolvedValue({} as any);
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

      mockChatsService.findOne.mockRejectedValue(new ForbiddenException());

      await expect(service.create(createMessageDto, senderId)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('findByChatId', () => {
    it('should return messages for a chat', async () => {
      const chatId = '60a6c8b8b4f1a8001f6b9012';
      const userId = '60a6c8b8b4f1a8001f6b5678';
      const messages = [mockMessage];

      mockChatsService.findOne.mockResolvedValue({} as any);
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
      mockChatsService.findOne.mockResolvedValue({} as any);

      const result = await service.markAsRead(messageId, userId);

      expect(mockMessage.save).toHaveBeenCalled();
      expect(result).toEqual(mockMessage);
    });

    it('should throw NotFoundException for non-existent message', async () => {
      const messageId = '60a6c8b8b4f1a8001f6b1234';
      const userId = '60a6c8b8b4f1a8001f6b5678';

      mockMessageModel.findById.mockResolvedValue(null);

      await expect(service.markAsRead(messageId, userId)).rejects.toThrow(NotFoundException);
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

      await expect(service.remove(messageId, differentUserId)).rejects.toThrow(ForbiddenException);
    });
  });
});