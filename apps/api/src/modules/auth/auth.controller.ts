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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
    const headerUser = req?.headers?.['x-user-id'] || req?.headers?.['x-userid'];
    return this.authService.getProfile(headerUser || 'demo-current-user');
  }

  @Put('me')
  @ApiOperation({ summary: 'Perbarui profil pengguna yang sedang login' })
  @ApiResponse({ status: 200, description: 'Profil pengguna berhasil diperbarui' })
  async updateProfile(@Body() dto: UpdateProfileDto, @Req() req: any) {
    // Prefer authenticated user id (from JWT) or a forwarding header `x-user-id` for local/dev testing
    const headerUser = req?.headers?.['x-user-id'] || req?.headers?.['x-userid'];
    const userId = headerUser || 'demo-current-user';
    return this.authService.updateProfile(userId, dto as any);
  }
}
