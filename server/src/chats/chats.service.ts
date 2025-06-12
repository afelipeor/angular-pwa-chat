import
  {
    ForbiddenException,
    Injectable,
    NotFoundException
  } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateChatDto, UpdateChatDto } from './dto';
import { Chat, ChatDocument } from './schemas/chat.schema';

@Injectable()
export class ChatsService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<ChatDocument>,
  ) {}

  async create(createChatDto: CreateChatDto, userId: string): Promise<Chat> {
    const participants = [
      userId,
      ...createChatDto.participants.filter(id => id !== userId)
    ];

    const createdChat = new this.chatModel({
      ...createChatDto,
      participants: participants.map(id => new Types.ObjectId(id)),
      createdBy: new Types.ObjectId(userId),
    });

    return (await createdChat.save()).populate('participants', 'name email avatar status');
  }

  async findAll(userId: string): Promise<Chat[]> {
    return this.chatModel
      .find({ participants: new Types.ObjectId(userId) })
      .populate('participants', 'name email avatar status')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .exec();
  }

  async findOne(id: string, userId: string): Promise<Chat> {
    const chat = await this.chatModel
      .findById(id)
      .populate('participants', 'name email avatar status')
      .populate('lastMessage')
      .exec();

    if (!chat) {
      throw new NotFoundException(`Chat with ID ${id} not found`);
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      participant => participant._id.toString() === userId
    );

    if (!isParticipant) {
      throw new ForbiddenException('You are not a participant in this chat');
    }

    return chat;
  }

  async update(id: string, updateChatDto: UpdateChatDto, userId: string): Promise<Chat> {
    const chat = await this.findOne(id, userId);

    const updatedChat = await this.chatModel
      .findByIdAndUpdate(id, updateChatDto, { new: true })
      .populate('participants', 'name email avatar status')
      .populate('lastMessage')
      .exec();

    return updatedChat;
  }

  async markAsRead(chatId: string, userId: string): Promise<void> {
    await this.chatModel.findByIdAndUpdate(
      chatId,
      { $unset: { [`unreadCount.${userId}`]: "" } }
    );
  }

  async incrementUnreadCount(chatId: string, excludeUserId: string): Promise<void> {
    const chat = await this.chatModel.findById(chatId);
    if (!chat) return;

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

  async remove(id: string, userId: string): Promise<void> {
    const chat = await this.findOne(id, userId);

    // Only creator can delete the chat
    if (chat.createdBy.toString() !== userId) {
      throw new ForbiddenException('Only the creator can delete this chat');
    }

    await this.chatModel.findByIdAndDelete(id);
  }
}
