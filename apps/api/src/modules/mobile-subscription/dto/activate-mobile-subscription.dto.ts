import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class ActivateMobileSubscriptionDto {
  @ApiProperty({ description: 'Paket yang dipilih (dari daftar paket NextVersa).' })
  @IsUUID('all', { message: 'Pilih paket langganan.' })
  packageId!: string;

  @ApiPropertyOptional({ example: 12, description: 'Lama langganan dalam bulan (1-60). Kosong: lama bawaan paket.' })
  @IsOptional()
  @IsInt({ message: 'Lama langganan harus bilangan bulat (bulan).' })
  @Min(1, { message: 'Lama langganan minimal 1 bulan.' })
  @Max(60, { message: 'Lama langganan maksimal 60 bulan.' })
  durationMonths?: number;
}
