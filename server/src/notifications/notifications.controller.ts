import
  {
    Body,
    Controller,
    Delete,
    Post,
    Request,
    UseGuards,
  } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PushSubscriptionDto } from './dto';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('subscribe')
  @ApiResponse({ status: 201, description: 'Subscription successful' })
  async subscribe(
    @Body() subscription: PushSubscriptionDto,
    @Request() req,
  ) {
    await this.notificationsService.subscribeUser(req.user.userId, subscription);
    return { message: 'Subscription successful' };
  }

  @Delete('unsubscribe')
  @ApiResponse({ status: 200, description: 'Unsubscription successful' })
  async unsubscribe(
    @Body() subscription: PushSubscriptionDto,
    @Request() req,
  ) {
    await this.notificationsService.unsubscribeUser(req.user.userId, subscription);
    return { message: 'Unsubscription successful' };
  }
}
