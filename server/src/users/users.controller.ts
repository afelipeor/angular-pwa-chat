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
import { CreateUserDto, UpdateUserDto } from './dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiResponse({ status: 201, description: 'User created successfully' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiResponse({ status: 200, description: 'Returns all users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get('profile')
  @ApiResponse({ status: 200, description: 'Returns current user profile' })
  getProfile(@Request() req) {
    return this.usersService.findOne(req.user.userId);
  }

  @Get(':id')
  @ApiResponse({ status: 200, description: 'Returns user by ID' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch('profile')
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, updateUserDto);
  }

  @Patch(':id')
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
