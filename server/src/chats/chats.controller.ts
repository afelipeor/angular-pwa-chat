import
  {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Request,
    UseGuards,
  } from '@nestjs/common';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatsService } from './chats.service';
import { CreateChatDto, UpdateChatDto } from './dto';

@ApiTags('chats')
@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'Chat created successfully' })
  create(@Body() createChatDto: CreateChatDto, @Request() req) {
    return this.chatsService.create(createChatDto, req.user.userId);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Returns all user chats' })
  findAll(@Request() req) {
    return this.chatsService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Returns chat by ID' })
  @ApiResponse({ status: 404, description: 'Chat not found' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.chatsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'Chat updated successfully' })
  update(@Param('id') id: string, @Body() updateChatDto: UpdateChatDto, @Request() req) {
    return this.chatsService.update(id, updateChatDto, req.user.userId);
  }

  @Patch(':id/read')
  @ApiResponse({ status: 200, description: 'Chat marked as read' })
  markAsRead(@Param('id') id: string, @Request() req) {
    return this.chatsService.markAsRead(id, req.user.userId);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'Chat deleted successfully' })
  remove(@Param('id') id: string, @Request() req) {
    return this.chatsService.remove(id, req.user.userId);
  }
}
