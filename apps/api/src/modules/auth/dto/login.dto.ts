import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: '270010016',
    description: 'NIM, NIDN, atau Email kampus terdaftar',
  })
  @IsString({ message: 'NIM / NIDN / Email harus berupa teks' })
  @IsNotEmpty({ message: 'NIM / NIDN / Email tidak boleh kosong' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Kata sandi akun',
    minLength: 6,
  })
  @IsString({ message: 'Password harus berupa teks' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;
}
