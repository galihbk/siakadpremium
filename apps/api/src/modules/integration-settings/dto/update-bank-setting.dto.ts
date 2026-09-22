import { IsString, IsOptional, IsBoolean, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateBankSettingDto {
  @ApiPropertyOptional({ example: 'MIDTRANS', description: 'MANUAL, MIDTRANS, XENDIT, dst.' })
  @IsOptional()
  @IsString()
  @IsIn(['MANUAL', 'MIDTRANS', 'XENDIT'])
  provider?: string;

  @ApiPropertyOptional({ example: 'SANDBOX' })
  @IsOptional()
  @IsString()
  @IsIn(['SANDBOX', 'PRODUCTION'])
  environment?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 'M012345678' })
  @IsOptional()
  @IsString()
  merchantId?: string;

  @ApiPropertyOptional({ example: 'SB-Mid-server-xxxxxxxxxxxxxxxx' })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional({ example: 'SB-Mid-client-xxxxxxxxxxxxxxxx' })
  @IsOptional()
  @IsString()
  apiSecret?: string;
}
