import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

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

  @ApiProperty({ example: 'SMAN 1 Teladan Jakarta' })
  @IsString()
  @IsNotEmpty()
  highSchool: string;

  @ApiProperty({ example: 'Teknik Informatika (S1)' })
  @IsString()
  @IsNotEmpty()
  chosenStudyProgram: string;

  @ApiProperty({ example: 'Jalur Prestasi Akademik', required: false })
  jalurPendaftaran?: string;
}
