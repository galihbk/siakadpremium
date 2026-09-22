import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@siakad/types';

@ApiTags('System Monitoring')
@Controller('monitoring')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
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
