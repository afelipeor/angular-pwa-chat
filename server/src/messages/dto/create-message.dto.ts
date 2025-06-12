import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'Hello, how are you?' })
  @IsString()
  content: string;

  @ApiProperty({ example: '60a6c8b8b4f1a8001f6b1234' })
  @IsString()
  chatId: string;

  @ApiProperty({
    example: 'text',
    enum: ['text', 'image', 'file', 'audio', 'video'],
    default: 'text'
  })
  @IsOptional()
  @IsEnum(['text', 'image', 'file', 'audio', 'video'])
  type?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fileUrl?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  fileSize?: number;
}
