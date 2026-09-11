import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';
import { AdmissionStatus } from '@siakad/types';

export class UpdateApplicantStatusDto {
  @ApiProperty({ enum: AdmissionStatus, example: 'PASSED' })
  @IsEnum(AdmissionStatus)
  status: AdmissionStatus;

  @ApiProperty({ example: 85.5, required: false })
  @IsOptional()
  @IsNumber()
  testScore?: number;

  @ApiProperty({ example: 'Berkas valid dan nilai memenuhi kriteria kelulusan.', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ example: 'Bagus Wicaksono, S.Kom.', required: false })
  @IsOptional()
  @IsString()
  verifiedBy?: string;
}

export class QueryApplicantsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ required: false, enum: AdmissionStatus })
  @IsOptional()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  prodi?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  jalur?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  page?: number;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  limit?: number;
}
