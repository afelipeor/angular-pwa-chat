import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatsService } from '../chats/chats.service';
import { CreateMessageDto } from '../messages/dto';
import { MessagesService } from '../messages/messages.service';
import { UsersService } from '../users/users.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:4200', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private chatsService: ChatsService,
    private messagesService: MessagesService
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
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

      // Update user status to online
      await this.usersService.updateStatus(payload.sub, 'online');

      // Join user's chat rooms
      const userChats = await this.chatsService.findAll(payload.sub);
      userChats.forEach((chat) => {
        client.join(`chat-${chat._id}`);
      });

      // Notify other users about online status
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
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.userId) {
      this.connectedUsers.delete(client.userId);

      // Update user status to offline
      await this.usersService.updateStatus(client.userId, 'offline');

      // Notify other users about offline status
      this.server.emit('userStatusUpdate', {
        userId: client.userId,
        status: 'offline',
      });

      console.log(`User ${client.userId} disconnected`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() createMessageDto: CreateMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    try {
      const message = await this.messagesService.create(
        createMessageDto,
        client.userId
      );

      // Emit message to all participants in the chat
      this.server
        .to(`chat-${createMessageDto.chatId}`)
        .emit('newMessage', message);

      return { success: true, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('joinChat')
  async handleJoinChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    try {
      // Verify user can access this chat
      await this.chatsService.findOne(data.chatId, client.userId);

      client.join(`chat-${data.chatId}`);

      // Mark messages as read when joining chat
      await this.messagesService.markChatMessagesAsRead(
        data.chatId,
        client.userId
      );

      return { success: true };
    } catch (error) {
      console.error('Error joining chat:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('leaveChat')
  async handleLeaveChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    client.leave(`chat-${data.chatId}`);
    return { success: true };
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { chatId: string; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    client.to(`chat-${data.chatId}`).emit('userTyping', {
      userId: client.userId,
      userName: client.user?.name,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('markMessageRead')
  async handleMarkMessageRead(
    @MessageBody() data: { messageId: string },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    try {
      const message = await this.messagesService.markAsRead(
        data.messageId,
        client.userId
      );

      // Notify sender that message was read
      this.server.to(`chat-${message.chat}`).emit('messageRead', {
        messageId: data.messageId,
        readBy: client.userId,
        user: {
          id: client.userId,
          name: client.user?.name,
        },
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking message as read:', error);
      return { success: false, error: error.message };
    }
  }
}
