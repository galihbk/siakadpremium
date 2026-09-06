import { Controller, Post, Body, Get, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

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
  async getProfile() {
    return this.authService.getProfile('demo-current-user');
  }
}
