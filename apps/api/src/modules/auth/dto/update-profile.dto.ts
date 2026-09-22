import { IsOptional, IsString, IsDateString, IsUrl, IsIn } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  nik?: string;

  @IsOptional()
  @IsString()
  nisn?: string;

  @IsOptional()
  @IsString()
  noKk?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  streetAddress?: string;

  @IsOptional()
  @IsString()
  rtRw?: string;

  @IsOptional()
  @IsString()
  dusun?: string;

  @IsOptional()
  @IsString()
  kelurahan?: string;

  @IsOptional()
  @IsString()
  kecamatan?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsString()
  birthPlace?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  newPassword?: string;

  // Field khusus profil dosen
  @IsOptional()
  @IsString()
  nidk?: string;

  @IsOptional()
  @IsString()
  titlePrefix?: string;

  @IsOptional()
  @IsString()
  titleSuffix?: string;

  @IsOptional()
  @IsIn(['MALE', 'FEMALE'])
  gender?: string;

  @IsOptional()
  @IsString()
  religion?: string;

  @IsOptional()
  @IsString()
  employmentStatus?: string;

  @IsOptional()
  @IsString()
  functionalPosition?: string;

  @IsOptional()
  @IsString()
  lastEducation?: string;

  @IsOptional()
  @IsString()
  expertise?: string;
}
