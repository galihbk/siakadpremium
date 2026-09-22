import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  HttpCode,
  HttpStatus,
  Put,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtService: JwtService,
  ) {}

  // Mengambil identitas pengguna HANYA dari token JWT yang tervalidasi tanda tangannya.
  // Header x-user-id TIDAK dipercaya lagi karena bisa dipalsukan bebas oleh klien mana pun
  // (celah pengambilalihan akun — lihat catatan keamanan).
  private requireUserId(req: any): string {
    const authHeader = req?.headers?.['authorization'] || req?.headers?.['Authorization'];
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token otentikasi tidak ditemukan.');
    }
    try {
      const token = authHeader.slice(7);
      const decoded: any = this.jwtService.verify(token);
      if (decoded?.sub) return decoded.sub;
    } catch {
      // fall through to throw below
    }
    throw new UnauthorizedException('Token otentikasi tidak valid atau telah kedaluwarsa.');
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  // Batas ketat khusus login: maksimal 10 percobaan per menit per IP, untuk memperlambat
  // serangan brute-force / credential stuffing terhadap kata sandi pengguna.
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Login pengguna portal SIAKAD (Mahasiswa, Dosen, Admin)' })
  @ApiResponse({ status: 200, description: 'Login berhasil dan menghasilkan token JWT' })
  @ApiResponse({ status: 401, description: 'Kredensial email atau password salah' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Mendapatkan profil pengguna yang sedang login' })
  @ApiResponse({ status: 200, description: 'Data profil pengguna berhasil dimuat' })
  async getProfile(@Req() req: any) {
    const userId = this.requireUserId(req);
    return this.authService.getProfile(userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Perbarui profil pengguna yang sedang login' })
  @ApiResponse({ status: 200, description: 'Profil pengguna berhasil diperbarui' })
  async updateProfile(@Body() dto: UpdateProfileDto, @Req() req: any) {
    const userId = this.requireUserId(req);
    return this.authService.updateProfile(userId, dto as any);
  }
}
