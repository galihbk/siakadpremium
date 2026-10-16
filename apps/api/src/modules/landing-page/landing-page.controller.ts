import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LandingPageService, OWN_ARTICLE_ROLES } from './landing-page.service';
import { UpdateLandingPageDto } from './dto/update-landing-page.dto';
import { CreateArticleDto, UpdateArticleDto } from './dto/article.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UserRole } from '@siakad/types';

const ARTICLE_EDITOR_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN_BAAK,
  UserRole.ADMIN_PRODI,
  UserRole.ADMIN_PMB,
  UserRole.P2M,
  UserRole.ADMIN_P2M,
  UserRole.LP3M,
  UserRole.ADMIN_LP3M,
];

// Label role yang ditampilkan PUBLIK sebagai "Diunggah oleh" -- hanya unit/role, bukan nama akun.
const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Humas ITN',
  ADMIN_BAAK: 'BAAK',
  STAFF: 'BAAK',
  ADMIN_PRODI: 'Program Studi',
  ADMIN_PMB: 'Panitia PMB',
  PMB: 'Panitia PMB',
  ADMIN_LP3M: 'LP3M',
  LP3M: 'LP3M',
  ADMIN_P2M: 'P2M (Penjaminan Mutu)',
  P2M: 'P2M (Penjaminan Mutu)',
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ARTICLE_EDITOR_ROLES)
  @ApiOperation({ summary: 'Mendapatkan semua artikel/berita (termasuk draf) -- untuk halaman admin' })
  async getAllArticlesAdmin(@Req() req: any) {
    return this.landingPageService.getAllArticlesAdmin(
      OWN_ARTICLE_ROLES.includes(req.user?.role) ? { id: req.user.sub, name: req.user.fullName } : undefined,
    );
  }

  @Get('articles/slug/:slug')
  @ApiOperation({ summary: 'Detail satu berita terbit berdasarkan slug -- untuk halaman berita publik' })
  async getPublishedBySlug(@Param('slug') slug: string) {
    return this.landingPageService.getPublishedBySlug(slug);
  }

  @Get('articles/:id')
  @ApiOperation({ summary: 'Mendapatkan satu artikel/berita berdasarkan ID -- untuk halaman edit admin' })
  async getArticleById(@Param('id') id: string) {
    return this.landingPageService.getArticleById(id);
  }

  @Post('articles')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ARTICLE_EDITOR_ROLES)
  @ApiOperation({ summary: 'Membuat berita/pengumuman baru -- penulis diambil dari akun yang login' })
  async createArticle(@Body() dto: CreateArticleDto, @Req() req: any) {
    const authorName = req.user?.fullName || ROLE_LABELS[req.user?.role] || 'Humas ITN';
    return this.landingPageService.createArticle(dto, authorName, req.user?.sub, req.user?.role, ROLE_LABELS[req.user?.role] ?? 'Humas ITN', req.user?.studyProgramId);
  }

  @Put('articles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ARTICLE_EDITOR_ROLES)
  @ApiOperation({ summary: 'Memperbarui berita/pengumuman -- pengubah terakhir dicatat dari akun yang login' })
  async updateArticle(@Param('id') id: string, @Body() dto: UpdateArticleDto, @Req() req: any) {
    await this.landingPageService.assertCanModify(id, req.user);
    const name = req.user?.fullName || ROLE_LABELS[req.user?.role] || null;
    return this.landingPageService.updateArticle(id, dto, { id: req.user?.sub, name, role: req.user?.role });
  }

  @Delete('articles/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ARTICLE_EDITOR_ROLES)
  @ApiOperation({ summary: 'Menghapus berita/pengumuman' })
  async deleteArticle(@Param('id') id: string, @Req() req: any) {
    await this.landingPageService.assertCanModify(id, req.user);
    return this.landingPageService.deleteArticle(id);
  }
}
