import { Controller, Get, Post, Body, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dapatkan data analitik real-time untuk Super Administrator' })
  async getDashboard() {
    return await this.analyticsService.getDashboardData();
  }

  @Post('track')
  @ApiOperation({ summary: 'Mencatat jejak kunjungan pengunjung website' })
  async trackVisit(@Body() body: { path?: string; device?: string; referer?: string }, @Req() req: any) {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
    const userAgent = req.headers['user-agent'] || 'Unknown';

    await this.analyticsService.trackVisit({
      path: body.path,
      ip: Array.isArray(ip) ? ip[0] : ip,
      userAgent,
      device: body.device,
      referer: body.referer || req.headers['referer'],
    });

    return { success: true };
  }
}
