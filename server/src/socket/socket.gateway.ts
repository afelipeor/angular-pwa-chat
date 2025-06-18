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
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:4200',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, string>(); // userId -> socketId
  private autoResponseEnabled = true; // Enable auto-response for testing
  private autoResponseDelay = 2000; // 2 seconds delay

  // Auto-response messages
  private autoResponseMessages = [
    'Thanks for your message! 🙂',
    "That's interesting! Tell me more.",
    "I'm an auto-responder for testing notifications 🤖",
    'How are you doing today?',
    "Great point! I hadn't thought of that.",
    'Thanks for sharing that with me!',
    'What do you think about that?',
    'That sounds awesome! 🎉',
    "I'm here to help test your notifications!",
    "Hope you're having a great day! ☀️",
  ];

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private chatsService: ChatsService,
    private messagesService: MessagesService,
    private notificationsService: NotificationsService
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
      console.log('JWT payload:', payload);
      const user = await this.usersService.findOne(payload.sub);
      console.log('Found user:', user._id);
      client.userId = payload.sub;
      client.user = user;
      console.log('Set client.userId to:', client.userId);

      this.connectedUsers.set(payload.sub, client.id);

      // Update user status to online
      await this.usersService.updateStatus(payload.sub, 'online'); // Join user's chat rooms
      const userChats = await this.chatsService.findAll(payload.sub);
      userChats.forEach((chat) => {
        client.join(`chat-${(chat as any)._id}`);
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
    console.log(
      'Disconnect triggered for client:',
      client.id,
      'userId:',
      client.userId
    );
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
      console.log(
        `📨 Received message from ${client.user?.name}: ${createMessageDto.content}`
      );
      const message = await this.messagesService.create(
        createMessageDto,
        client.userId
      );

      // Emit message to all participants in the chat
      this.server
        .to(`chat-${createMessageDto.chatId}`)
        .emit('newMessage', message);

      // Send push notification to other participants
      await this.sendPushNotificationToChat(
        createMessageDto.chatId,
        client.userId,
        message
      );

      // Trigger auto-response after a delay
      if (this.autoResponseEnabled) {
        console.log(
          `🤖 Auto-response is enabled, will send response in ${this.autoResponseDelay}ms`
        );
        setTimeout(async () => {
          await this.sendAutoResponse(createMessageDto.chatId, client.userId);
        }, this.autoResponseDelay);
      }

      return { success: true, message };
    } catch (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }
  }

  @SubscribeMessage('joinChat') async handleJoinChat(
    @MessageBody() data: { chatId: string },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    try {
      console.log(`User ${client.userId} trying to join chat ${data.chatId}`);
      console.log('Client auth state:', {
        userId: client.userId,
        hasUser: !!client.user,
        userName: client.user?.name,
      });

      // Check if client is authenticated
      if (!client.userId || !client.user) {
        console.log('Client not authenticated yet, rejecting join request');
        return { success: false, error: 'Authentication required' };
      }

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
  private async sendAutoResponse(chatId: string, originalSenderId: string) {
    try {
      console.log(
        `🤖 Sending auto-response to chat ${chatId} from user ${originalSenderId}`
      );
      // Get a random auto-response message
      const randomMessage =
        this.autoResponseMessages[
          Math.floor(Math.random() * this.autoResponseMessages.length)
        ];

      console.log(`🤖 Selected auto-response message: ${randomMessage}`);

      // Create auto-response message DTO
      const autoResponseDto: CreateMessageDto = {
        chatId,
        content: randomMessage,
        type: 'text',
      };

      // Get or create bot user
      const botUser = await this.getOrCreateBotUser();
      console.log(`🤖 Bot user: ${botUser.name} (${botUser._id})`);

      // Create the auto-response message using the bot-specific method
      const autoMessage = await this.messagesService.createBotMessage(
        autoResponseDto,
        botUser._id.toString()
      );

      console.log(
        `🤖 Created auto-response message: ${(autoMessage as any)._id}`
      );

      // Emit the auto-response to all chat participants
      this.server.to(`chat-${chatId}`).emit('newMessage', autoMessage);

      // Send push notification to the original sender
      await this.notificationsService.sendNotificationToUser(
        originalSenderId,
        'New message from ChatBot',
        randomMessage,
        { chatId, messageId: (autoMessage as any)._id }
      );

      console.log(`🤖 Auto-response sent to chat ${chatId}: ${randomMessage}`);
    } catch (error) {
      console.error('🤖 Error sending auto-response:', error);
    }
  }

  private async getOrCreateBotUser() {
    try {
      // Try to find existing bot user
      const existingBot = await this.usersService.findByEmail(
        'chatbot@angular-chat.com'
      );
      if (existingBot) {
        return existingBot;
      }
    } catch (error) {
      // Bot user doesn't exist, create it
    }

    // Create bot user
    return await this.usersService.create({
      name: 'ChatBot',
      email: 'chatbot@angular-chat.com',
      password: 'bot-password-not-used',
      avatar: '🤖',
    });
  }

  private async sendPushNotificationToChat(
    chatId: string,
    senderId: string,
    message: any
  ) {
    try {
      const chat = await this.chatsService.findOne(chatId, senderId);
      const sender = await this.usersService.findOne(senderId);

      // Get all participants except the sender
      const otherParticipants = chat.participants.filter(
        (participant: any) => participant._id.toString() !== senderId
      );

      // Send push notification to each participant
      const notificationPromises = otherParticipants.map(
        async (participant: any) => {
          const title = chat.isGroup ? `${chat.name}` : `${sender.name}`;
          const body = message.content;

          return this.notificationsService.sendNotificationToUser(
            participant._id.toString(),
            title,
            body,
            { chatId, messageId: message._id }
          );
        }
      );

      await Promise.allSettled(notificationPromises);
    } catch (error) {
      console.error('Error sending push notifications:', error);
    }
  }

  @SubscribeMessage('toggleAutoResponse')
  handleToggleAutoResponse(
    @MessageBody() data: { enabled: boolean },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    this.autoResponseEnabled = data.enabled;
    return { success: true, autoResponseEnabled: this.autoResponseEnabled };
  }

  @SubscribeMessage('setAutoResponseDelay')
  handleSetAutoResponseDelay(
    @MessageBody() data: { delay: number },
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    this.autoResponseDelay = Math.max(1000, Math.min(10000, data.delay)); // Between 1-10 seconds
    return { success: true, autoResponseDelay: this.autoResponseDelay };
  }
}
