import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LandingPageService } from './landing-page.service';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@siakad/types';

@ApiTags('Landing Page CMS')
@Controller('landing-page')
export class LandingPageController {
  constructor(private readonly landingPageService: LandingPageService) {}

  @Get()
  @ApiOperation({ summary: 'Mendapatkan pengaturan & konten landing page aktif' })
  @ApiResponse({ status: 200, description: 'Konten landing page berhasil diambil' })
  async getSettings() {
    return this.landingPageService.getSettings();
  }

  @Put()
  @ApiOperation({ summary: 'Memperbarui konten landing page (Khusus Super Admin)' })
  @ApiResponse({ status: 200, description: 'Pengaturan landing page berhasil diperbarui' })
  async updateSettings(@Body() dto: UpdateLandingPageDto, @Req() req: any) {
    const userId = req?.user?.sub || req?.user?.id;
    return this.landingPageService.updateSettings(dto, userId);
  }

  @Get('articles')
  @ApiOperation({ summary: 'Mendapatkan daftar artikel/berita landing page' })
  async getArticles() {
    return this.landingPageService.getArticles();
  }
}
