import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';

export class RegisterPmbAccountDto {
  @ApiProperty({ example: 'Galih Bagaskoro' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'galih@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '081276438553' })
  @IsString()
  @IsNotEmpty()
  whatsapp: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  honeypot?: string;
}

export class LoginPmbAccountDto {
  @ApiProperty({ example: 'galih@gmail.com' })
  @IsString()
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({ example: 'Password123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class SaveApplicationDraftDto {
  @IsOptional() @IsString() accountId?: string;
  @IsOptional() @IsString() waveId?: string;
  @IsOptional() @IsString() registrationTypeId?: string;
  @IsOptional() @IsString() trackId?: string;
  @IsOptional() @IsString() classId?: string;
  @IsOptional() @IsString() studyProgramId?: string;
  @IsOptional() @IsBoolean() isKip?: boolean;
  @IsOptional() @IsBoolean() statementAgreed?: boolean;

  @IsOptional() @IsString() nik?: string;
  @IsOptional() @IsString() fullName?: string;
  @IsOptional() @IsString() birthPlace?: string;
  @IsOptional() @IsString() birthDate?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsString() religion?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() streetAddress?: string;
  @IsOptional() @IsString() rtRw?: string;
  @IsOptional() @IsString() dusun?: string;
  @IsOptional() @IsString() kelurahan?: string;
  @IsOptional() @IsString() kecamatan?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsString() postalCode?: string;

  @IsOptional() @IsString() schoolName?: string;
  @IsOptional() @IsString() npsn?: string;
  @IsOptional() @IsString() nisn?: string;
  @IsOptional() @IsString() graduationYear?: string;
  @IsOptional() @IsString() major?: string;

  @IsOptional() @IsString() parentName?: string;
  @IsOptional() @IsString() parentPhone?: string;
  @IsOptional() @IsString() parentJob?: string;
  @IsOptional() @IsString() parentIncome?: string;
  @IsOptional() @IsString() fatherName?: string;
  @IsOptional() @IsString() fatherPhone?: string;
  @IsOptional() @IsString() fatherJob?: string;
  @IsOptional() @IsString() fatherIncome?: string;
  @IsOptional() @IsString() motherName?: string;
  @IsOptional() @IsString() motherPhone?: string;
  @IsOptional() @IsString() motherJob?: string;
  @IsOptional() @IsString() motherIncome?: string;

  @IsOptional() @IsString() fileKtp?: string;
  @IsOptional() @IsString() fileKk?: string;
  @IsOptional() @IsString() fileIjazah?: string;
  @IsOptional() @IsString() fileFoto?: string;
  @IsOptional() @IsString() fileKip?: string;
  @IsOptional() @IsString() fileTambahan?: string;
}

export class UploadPaymentProofDto {
  @IsOptional() @IsString() paymentMethod?: string;
  @IsOptional() @IsString() proofUrl?: string;
  @IsOptional() @IsString() notes?: string;
}

export class VerifyDocumentDto {
  @IsString() @IsNotEmpty() status: 'VERIFIED' | 'REJECTED';
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsString() verifiedBy?: string;
}

export class VerifyPaymentDto {
  @IsString() @IsNotEmpty() status: 'PAID' | 'PENDING';
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() verifiedBy?: string;
}

export class SelectionDecisionDto {
  @IsString() @IsNotEmpty() selectionStatus: 'PASSED' | 'FAILED' | 'RESERVE';
  @IsOptional() @IsNumber() testScore?: number;
  @IsOptional() @IsString() selectionNotes?: string;
}

export class CreateWaveDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() academicYear: string;
  @IsString() @IsNotEmpty() jenjang: string;
  @IsString() @IsNotEmpty() startDate: string;
  @IsString() @IsNotEmpty() endDate: string;
  @IsString() @IsNotEmpty() status: 'OPEN' | 'UPCOMING' | 'CLOSED';
  @IsOptional() @IsNumber() quota?: number;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdatePmbFeeConfigDto {
  @IsNumber() registrationFee: number;
  @IsNumber() reRegistrationFee: number;
  @IsOptional() @IsString() jenjang?: string;
  @IsOptional() @IsString() description?: string;
}

export class CreateRegistrationTypeDto {
  @IsString() @IsNotEmpty() code: string;
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() badge?: string;
  @IsOptional() @IsBoolean() isKip?: boolean;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateTrackDto {
  @IsString() @IsNotEmpty() code: string;
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

export class CreateClassDto {
  @IsString() @IsNotEmpty() code: string;
  @IsString() @IsNotEmpty() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
