import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';

@ApiTags('System Monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get('server')
  @ApiOperation({ summary: 'Mendapatkan status kesehatan server, resource, dan koneksi layanan (Khusus Super Admin)' })
  async getServerHealth() {
    return this.monitoringService.getServerHealth();
  }

  @Get('history')
  @ApiOperation({ summary: 'Mendapatkan riwayat penggunaan CPU, RAM, dan Storage untuk grafik real-time (Khusus Super Admin)' })
  getHistory() {
    return this.monitoringService.getHistory();
  }
}
