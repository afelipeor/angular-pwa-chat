import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatsModule } from '../chats/chats.module';
import { MessagesModule } from '../messages/messages.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { SocketGateway } from './socket.gateway';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
    UsersModule,
    ChatsModule,
    MessagesModule,
    NotificationsModule,
  ],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
