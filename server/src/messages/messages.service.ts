import
  {
    ForbiddenException,
    Injectable,
    NotFoundException
  } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ChatsService } from '../chats/chats.service';
import { CreateMessageDto, UpdateMessageDto } from './dto';
import { Message, MessageDocument } from './schemas/message.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    private chatsService: ChatsService,
  ) {}

  async create(createMessageDto: CreateMessageDto, senderId: string): Promise<Message> {
    // Verify user is participant in chat
    await this.chatsService.findOne(createMessageDto.chatId, senderId);

    const createdMessage = new this.messageModel({
      ...createMessageDto,
      chat: new Types.ObjectId(createMessageDto.chatId),
      sender: new Types.ObjectId(senderId),
      readBy: [new Types.ObjectId(senderId)], // Mark as read by sender
    });

    const savedMessage = await createdMessage.save();

    // Increment unread count for other participants
    await this.chatsService.incrementUnreadCount(createMessageDto.chatId, senderId);

    return this.messageModel
      .findById(savedMessage._id)
      .populate('sender', 'name email avatar')
      .populate('chat', 'name participants')
      .exec();
  }

  async findByChatId(
    chatId: string,
    userId: string,
    page: number = 1,
    limit: number = 50
  ): Promise<Message[]> {
    // Verify user is participant in chat
    await this.chatsService.findOne(chatId, userId);

    const skip = (page - 1) * limit;

    return this.messageModel
      .find({ chat: new Types.ObjectId(chatId) })
      .populate('sender', 'name email avatar')
      .populate('readBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
  }

  async markAsRead(messageId: string, userId: string): Promise<Message> {
    const message = await this.messageModel.findById(messageId);

    if (!message) {
      throw new NotFoundException(`Message with ID ${messageId} not found`);
    }

    // Verify user is participant in chat
    await this.chatsService.findOne(message.chat.toString(), userId);

    // Add user to readBy array if not already present
    const userObjectId = new Types.ObjectId(userId);
    if (!message.readBy.some(id => id.equals(userObjectId))) {
      message.readBy.push(userObjectId);
      await message.save();
    }

    return this.messageModel
      .findById(messageId)
      .populate('sender', 'name email avatar')
      .populate('readBy', 'name email')
      .exec();
  }

  async markChatMessagesAsRead(chatId: string, userId: string): Promise<void> {
    // Verify user is participant in chat
    await this.chatsService.findOne(chatId, userId);

    await this.messageModel.updateMany(
      {
        chat: new Types.ObjectId(chatId),
        readBy: { $ne: new Types.ObjectId(userId) }
      },
      { $addToSet: { readBy: new Types.ObjectId(userId) } }
    );

    // Reset unread count for this user
    await this.chatsService.markAsRead(chatId, userId);
  }

  async update(id: string, updateMessageDto: UpdateMessageDto, userId: string): Promise<Message> {
    const message = await this.messageModel.findById(id);

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Only sender can edit message
    if (message.sender.toString() !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
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

  async remove(id: string, userId: string): Promise<void> {
    const message = await this.messageModel.findById(id);

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    // Only sender can delete message
    if (message.sender.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    await this.messageModel.findByIdAndDelete(id);
  }
}
