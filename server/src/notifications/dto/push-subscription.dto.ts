import { ApiProperty } from '@nestjs/swagger';
import { IsObject, IsString } from 'class-validator';

export class PushSubscriptionDto {
  @ApiProperty({
    example: 'https://fcm.googleapis.com/fcm/send/...',
    description: 'Push service endpoint URL'
  })
  @IsString()
  endpoint: string;

  @ApiProperty({
    example: { p256dh: 'key...', auth: 'key...' },
    description: 'Encryption keys'
  })
  @IsObject()
  keys: {
    p256dh: string;
    auth: string;
  };
}
