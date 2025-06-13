import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

class SubscriptionDto {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('vapid-public-key')
  @ApiResponse({ status: 200, description: 'VAPID public key retrieved' })
  getVapidPublicKey() {
    return {
      publicKey: this.notificationsService.getVapidPublicKey(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('subscribe')
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Subscription successful' })
  async subscribe(@Body() subscription: SubscriptionDto, @Request() req) {
    await this.notificationsService.subscribeUser(
      req.user.userId,
      subscription
    );
    return { message: 'Subscription successful' };
  }

  @UseGuards(JwtAuthGuard)
  @Delete('unsubscribe')
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Unsubscription successful' })
  async unsubscribe(@Body() subscription: SubscriptionDto, @Request() req) {
    await this.notificationsService.unsubscribeUser(
      req.user.userId,
      subscription
    );
    return { message: 'Unsubscription successful' };
  }
}
