import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Patch,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Role } from '@siakad/database';

@ApiTags('User Management (Manajemen Pengguna Sistem)')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Mendapatkan seluruh daftar akun pengguna dengan filter peran dan status' })
  @ApiResponse({ status: 200, description: 'Daftar pengguna berhasil dimuat' })
  async findAll(
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.usersService.findAll({ role, status, search });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Mendapatkan rincian akun pengguna berdasarkan ID' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Menambahkan akun pengguna baru ke basis data' })
  async create(
    @Body()
    body: {
      email: string;
      fullName: string;
      role: Role;
      password?: string;
      isActive?: boolean;
      avatarUrl?: string;
    },
  ) {
    return this.usersService.create(body);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Memperbarui profil atau peran pengguna' })
  async update(
    @Param('id') id: string,
    @Body()
    body: {
      fullName?: string;
      email?: string;
      role?: Role;
      isActive?: boolean;
      avatarUrl?: string;
    },
  ) {
    return this.usersService.update(id, body);
  }

  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Mengaktifkan atau menonaktifkan status akun pengguna' })
  async toggleStatus(@Param('id') id: string) {
    return this.usersService.toggleStatus(id);
  }

  @Post(':id/reset-password')
  @ApiOperation({ summary: 'Mereset kata sandi akun pengguna' })
  async resetPassword(
    @Param('id') id: string,
    @Body() body: { newPassword?: string },
  ) {
    return this.usersService.resetPassword(id, body?.newPassword);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Menghapus akun pengguna secara permanen' })
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }
}
