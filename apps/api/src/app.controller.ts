import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): { message: string; timestamp: string } {
    return this.appService.getHello();
  }

  /**
   * Alamat publik antar-layanan (website, portal, PMB, P2M, P3M) dari konfigurasi server, dibaca browser saat runtime.
   * Diisi lewat PUBLIC_WEB_URL / PUBLIC_PORTAL_URL / PUBLIC_PMB_URL / PUBLIC_P2M_URL / PUBLIC_P3M_URL di .env.
   * Kosong = frontend menurunkannya dari domain yang sedang dibuka.
   */
  @Get('app-config')
  getAppConfig() {
    const env = (name: string) => process.env[name]?.trim().replace(/\/+$/, '') || null;
    return {
      webUrl: env('PUBLIC_WEB_URL'),
      portalUrl: env('PUBLIC_PORTAL_URL'),
      pmbUrl: env('PUBLIC_PMB_URL'),
      p2mUrl: env('PUBLIC_P2M_URL'),
      p3mUrl: env('PUBLIC_P3M_URL'),
      // Tombol "akun demo" di halaman login hanya tampil bila diaktifkan (PUBLIC_DEMO_ACCOUNTS=true) -- mati bila tidak diisi.
      demoAccounts: process.env.PUBLIC_DEMO_ACCOUNTS?.trim().toLowerCase() === 'true',
    };
  }

  @Get('health')
  getHealth(): { status: string; uptime: number } {
    return this.appService.getHealth();
  }
}
