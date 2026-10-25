import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

/** Notifikasi milik pengguna yang login (identitas dari JWT). */
@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar notifikasi terbaru dan jumlah yang belum dibaca' })
  list(@Req() req: any, @Query('limit') limit?: string) {
    return this.notifications.list(req.user.sub, limit ? parseInt(limit, 10) || 30 : 30);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Jumlah notifikasi belum dibaca' })
  unread(@Req() req: any) {
    return this.notifications.unreadCount(req.user.sub);
  }

  @Post('read')
  @ApiOperation({ summary: 'Menandai notifikasi dibaca (ids kosong = semua)' })
  read(@Req() req: any, @Body() body: { ids?: string[] }) {
    return this.notifications.markRead(req.user.sub, body?.ids);
  }
}
