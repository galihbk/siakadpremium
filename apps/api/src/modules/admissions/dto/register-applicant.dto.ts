import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterApplicantDto {
  @ApiProperty({ example: 'Siti Aisyah Rahmadani' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'aisyah.pmb@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '081234567890' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({ example: 'SMAN 1 Teladan Jakarta', required: false })
  @IsString()
  @IsOptional()
  highSchool?: string;

  @ApiProperty({ example: 'Teknik Informatika (S1)', required: false })
  @IsString()
  @IsOptional()
  chosenStudyProgram?: string;

  @ApiProperty({ example: 'Jalur Prestasi Akademik', required: false })
  @IsString()
  @IsOptional()
  jalurPendaftaran?: string;

  @ApiProperty({ example: 'MITRA2027', required: false })
  @IsString()
  @IsOptional()
  affiliateCode?: string;

  @ApiProperty({ example: '', required: false })
  @IsString()
  @IsOptional()
  honeypot?: string;
}
