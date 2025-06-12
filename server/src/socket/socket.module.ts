import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { ChatsModule } from '../chats/chats.module';
import { MessagesModule } from '../messages/messages.module';
import { UsersModule } from '../users/users.module';
import { SocketGateway } from './socket.gateway';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'secretKey',
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    ChatsModule,
    MessagesModule,
  ],
  providers: [SocketGateway],
})
export class SocketModule {}
