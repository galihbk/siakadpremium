import { BadRequestException, Body, Controller, Get, Param, Patch, Post, Put, Query, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { ChatActor, PmbChatService } from './pmb-chat.service';

/** Pelaku chat dari token: pendaftar ber-akun (PMB_APPLICANT) atau pengunjung anonim (PMB_VISITOR). */
function actorOf(req: any): ChatActor {
  const role = req?.user?.role;
  if (role === 'PMB_APPLICANT') return { kind: 'applicant', id: req.user.sub };
  if (role === 'PMB_VISITOR') return { kind: 'visitor', id: req.user.sub };
  throw new BadRequestException('Token ini tidak dapat dipakai untuk live chat PMB.');
}

/**
 * Live chat PMB. Hak akses diatur di GlobalAuthGuard:
 *  - POST /admissions/pmb/chat/visitor/start -> publik (dibatasi laju & honeypot)
 *  - /admissions/pmb/chat*                   -> token pendaftar atau pengunjung
 *  - /admissions/admin/pmb/chat*             -> Panitia PMB / BAAK
 */
@ApiTags('PMB Live Chat')
@Controller('admissions')
export class PmbChatController {
  constructor(private readonly chat: PmbChatService) {}

  // ---------------- jam operasional ----------------
  @Get('pmb/chat/status')
  @ApiOperation({ summary: 'Publik: status buka/tutup live chat dan jadwal jam operasional' })
  chatStatus() {
    return this.chat.status();
  }

  @Get('admin/pmb/chat/settings')
  @ApiOperation({ summary: 'Panitia: pengaturan jam operasional live chat' })
  staffSettings() {
    return this.chat.getSettings();
  }

  @Put('admin/pmb/chat/settings')
  @ApiOperation({ summary: 'Panitia: simpan pengaturan jam operasional live chat' })
  staffSaveSettings(@Body() body: { mode?: string; schedule?: unknown; offlineMessage?: string; allowOfflineMessages?: boolean }) {
    return this.chat.saveSettings(body ?? {});
  }

  // ---------------- pengunjung anonim ----------------
  @Post('pmb/chat/visitor/start')
  // 5 percakapan baru per jam per alamat -- percakapan sungguhan jarang memulai lebih dari sekali
  @Throttle({ default: { limit: 5, ttl: 3600000 } })
  @ApiOperation({ summary: 'Pengunjung beranda PMB memulai live chat (nama + email/WhatsApp + pesan pertama); mengembalikan token tamu' })
  visitorStart(@Body() body: { name?: string; contact?: string; message?: string; website?: string }) {
    return this.chat.startVisitor(body ?? {});
  }

  // ---------------- peserta (pendaftar / pengunjung) ----------------
  @Get('pmb/chat')
  @ApiOperation({ summary: 'Pesan percakapan milik pemegang token (polling: parameter after = waktu pesan terakhir)' })
  messages(@Req() req: any, @Query('after') after?: string) {
    return this.chat.messages(actorOf(req), after);
  }

  @Post('pmb/chat')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Peserta mengirim pesan ke panitia PMB' })
  send(@Req() req: any, @Body() body: { message?: string }) {
    return this.chat.send(actorOf(req), body?.message);
  }

  @Post('pmb/chat/read')
  @ApiOperation({ summary: 'Peserta menandai balasan panitia sudah dibaca' })
  read(@Req() req: any) {
    return this.chat.markRead(actorOf(req));
  }

  // ---------------- panitia ----------------
  @Get('admin/pmb/chat/unread')
  @ApiOperation({ summary: 'Jumlah pesan yang belum dibaca panitia (untuk lencana menu)' })
  staffUnread() {
    return this.chat.staffUnreadTotal();
  }

  @Get('admin/pmb/chat/threads')
  @ApiOperation({ summary: 'Daftar percakapan (filter: search, status OPEN/CLOSED/UNREAD/VISITOR)' })
  staffThreads(@Query('search') search?: string, @Query('status') status?: string) {
    return this.chat.staffThreads({ search, status });
  }

  @Get('admin/pmb/chat/threads/:id/messages')
  @ApiOperation({ summary: 'Pesan pada satu percakapan' })
  staffMessages(@Param('id') id: string, @Query('after') after?: string) {
    return this.chat.staffMessages(id, after);
  }

  @Post('admin/pmb/chat/threads/:id/messages')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @ApiOperation({ summary: 'Panitia membalas' })
  staffSend(@Param('id') id: string, @Req() req: any, @Body() body: { message?: string }) {
    return this.chat.staffSend(id, req.user, body?.message);
  }

  @Post('admin/pmb/chat/threads/:id/read')
  @ApiOperation({ summary: 'Panitia menandai percakapan sudah dibaca' })
  staffRead(@Param('id') id: string) {
    return this.chat.staffRead(id);
  }

  @Patch('admin/pmb/chat/threads/:id/status')
  @ApiOperation({ summary: 'Menutup / membuka kembali percakapan' })
  staffStatus(@Param('id') id: string, @Body() body: { status?: string }) {
    return this.chat.staffSetStatus(id, String(body?.status ?? ''));
  }
}
