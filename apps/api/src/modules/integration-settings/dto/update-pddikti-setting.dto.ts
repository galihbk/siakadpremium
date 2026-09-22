import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePddiktiSettingDto {
  @ApiPropertyOptional({ example: 'https://feeder.kemdikbud.go.id/ws/live' })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiPropertyOptional({ example: '071032' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ example: '••••••••' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ example: '••••••••' })
  @IsOptional()
  @IsString()
  secretKey?: string;

  @ApiPropertyOptional({ example: '20261' })
  @IsOptional()
  @IsString()
  semesterId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
