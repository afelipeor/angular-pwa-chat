import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateChatDto {
  @ApiProperty({ example: 'General Chat' })
  @IsString()
  name: string;

  @ApiProperty({ example: ['60a6c8b8b4f1a8001f6b1234'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  participants: string[];

  @ApiProperty({ required: false, default: false })
  @IsOptional()
  @IsBoolean()
  isGroup?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  avatar?: string;
}
