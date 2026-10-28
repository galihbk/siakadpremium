import { Body, Controller, Get, Headers, Post, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { ContractError, SiakadContractService } from './siakad-contract.service';

/**
 * Kontrak API SIAKAD standar NextVersa: {baseUrl}/{apiVersion}/auth/login dan /student/profile.
 * Responsnya mengikuti kontrak (`{ success, data }` / `{ success: false, error }`), jadi galat
 * dikirim langsung, tidak lewat filter galat portal.
 */
@ApiExcludeController()
@Controller('siakad-contract/v1')
export class SiakadContractController {
  constructor(private readonly service: SiakadContractService) {}

  // Pemanggilnya Gateway NextVersa (satu alamat untuk semua mahasiswa), jadi batasnya longgar;
  // pembatasan per akun dilakukan Gateway.
  @Post('auth/login')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  login(@Body() body: { username?: unknown; password?: unknown }, @Res() res: Response) {
    return this.reply(res, () => this.service.login(body?.username, body?.password));
  }

  @Post('auth/refresh')
  @Throttle({ default: { limit: 120, ttl: 60000 } })
  refresh(@Body() body: { refreshToken?: unknown }, @Res() res: Response) {
    return this.reply(res, () => this.service.refresh(body?.refreshToken));
  }

  @Get('student/profile')
  profile(@Headers('authorization') authorization: string | undefined, @Res() res: Response) {
    return this.reply(res, () => this.service.profile(authorization));
  }

  @Get('student/profile/detail')
  profileDetail(@Headers('authorization') authorization: string | undefined, @Res() res: Response) {
    return this.reply(res, () => this.service.profileDetail(authorization));
  }

  private async reply(res: Response, run: () => Promise<unknown>): Promise<void> {
    res.setHeader('Cache-Control', 'no-store');
    try {
      res.status(200).json({ success: true, data: await run() });
    } catch (error) {
      if (!(error instanceof ContractError)) {
        res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan pada server.' } });
        return;
      }
      res.status(error.status).json({
        success: false,
        error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) },
      });
    }
  }
}
