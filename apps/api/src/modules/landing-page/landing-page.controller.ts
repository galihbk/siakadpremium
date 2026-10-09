import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LandingPageService } from './landing-page.service';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserRole } from '@siakad/types';

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin ITN',
  ADMIN_BAAK: 'BAAK ITN',
  STAFF: 'BAAK ITN',
  ADMIN_PMB: 'Panitia PMB ITN',
  PMB: 'Panitia PMB ITN',
  ADMIN_LP3M: 'LP3M ITN',
  LP3M: 'LP3M ITN',
};

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
  @ApiOperation({ summary: 'Mendapatkan daftar artikel/berita landing page yang sudah dipublikasikan' })
  async getArticles() {
    return this.landingPageService.getArticles();
  }

  @Get('articles/all')
  @ApiOperation({ summary: 'Mendapatkan semua artikel/berita (termasuk draf) -- untuk halaman admin' })
  async getAllArticlesAdmin() {
    return this.landingPageService.getAllArticlesAdmin();
  }

  @Get('articles/:id')
  @ApiOperation({ summary: 'Mendapatkan satu artikel/berita berdasarkan ID -- untuk halaman edit admin' })
  async getArticleById(@Param('id') id: string) {
    return this.landingPageService.getArticleById(id);
  }

  @Post('articles')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Membuat berita/pengumuman baru -- penulis diambil dari akun yang login' })
  async createArticle(@Body() dto: CreateArticleDto, @Req() req: any) {
    const authorName = req.user?.fullName || ROLE_LABELS[req.user?.role] || 'Humas ITN';
    return this.landingPageService.createArticle(dto, authorName);
  }

  @Put('articles/:id')
  @ApiOperation({ summary: 'Memperbarui berita/pengumuman' })
  async updateArticle(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.landingPageService.updateArticle(id, dto);
  }

  @Delete('articles/:id')
  @ApiOperation({ summary: 'Menghapus berita/pengumuman' })
  async deleteArticle(@Param('id') id: string) {
    return this.landingPageService.deleteArticle(id);
  }
}
