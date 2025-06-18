import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
  forwardRef,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SocketGateway } from '../socket/socket.gateway';
import { CreateMessageDto, UpdateMessageDto } from './dto';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    @Inject(forwardRef(() => SocketGateway))
    private readonly socketGateway: SocketGateway
  ) {}
  @Post()
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  async create(@Body() createMessageDto: CreateMessageDto, @Request() req) {
    console.log(
      `📨 HTTP API: Received message from user ${req.user.userId}: ${createMessageDto.content}`
    );

    const message = await this.messagesService.create(
      createMessageDto,
      req.user.userId
    );

    // Trigger auto-response if enabled (call the socket gateway method)
    await this.socketGateway.triggerAutoResponseFromAPI(
      createMessageDto.chatId,
      req.user.userId
    );

    return message;
  }

  @Get('chat/:chatId')
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns chat messages' })
  findByChatId(
    @Param('chatId') chatId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Request() req?: any
  ) {
    return this.messagesService.findByChatId(
      chatId,
      req.user.userId,
      page || 1,
      limit || 50
    );
  }

  @Patch(':id/read')
  @ApiResponse({ status: 200, description: 'Message marked as read' })
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.messagesService.markAsRead(id, req.user.userId);
  }

  @Patch('chat/:chatId/read')
  @ApiResponse({ status: 200, description: 'All chat messages marked as read' })
  markChatAsRead(@Param('chatId') chatId: string, @Request() req) {
    return this.messagesService.markChatMessagesAsRead(chatId, req.user.userId);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Message updated successfully' })
  update(
    @Param('id') id: string,
    @Body() updateMessageDto: UpdateMessageDto,
    @Request() req
  ) {
    return this.messagesService.update(id, updateMessageDto, req.user.userId);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  remove(@Param('id') id: string, @Request() req) {
    return this.messagesService.remove(id, req.user.userId);
  }
}
