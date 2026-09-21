import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
  Put,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
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

  private extractUserId(req: any): string {
    // 1. Try JWT Bearer token
    const authHeader = req?.headers?.['authorization'] || req?.headers?.['Authorization'];
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const decoded: any = this.jwtService.decode(token);
        if (decoded?.sub) return decoded.sub;
      } catch {
        // ignore, fall through
      }
    }
    // 2. Fallback to x-user-id header (dev/local mode)
    return req?.headers?.['x-user-id'] || req?.headers?.['x-userid'] || 'demo-current-user';
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
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
    const userId = this.extractUserId(req);
    return this.authService.getProfile(userId);
  }

  @Put('me')
  @ApiOperation({ summary: 'Perbarui profil pengguna yang sedang login' })
  @ApiResponse({ status: 200, description: 'Profil pengguna berhasil diperbarui' })
  async updateProfile(@Body() dto: UpdateProfileDto, @Req() req: any) {
    const userId = this.extractUserId(req);
    return this.authService.updateProfile(userId, dto as any);
  }
}
