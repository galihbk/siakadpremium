import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@siakad/types';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ActivateMobileSubscriptionDto } from './dto/activate-mobile-subscription.dto';
import {
  MobilePackage,
  MobileSubscriptionActivation,
  MobileSubscriptionService,
  MobileSubscriptionStatus,
} from './mobile-subscription.service';

/** SEMENTARA: langganan aplikasi mobile NextVersa untuk kampus ini (khusus Super Admin). */
@ApiTags('Langganan Mobile App')
@Controller('mobile-subscription')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class MobileSubscriptionController {
  constructor(private readonly service: MobileSubscriptionService) {}

  @Get()
  @ApiOperation({ summary: 'Status langganan mobile app kampus ini (ditanyakan ke NextVersa)' })
  status(): Promise<MobileSubscriptionStatus> {
    return this.service.status();
  }

  @Get('packages')
  @ApiOperation({ summary: 'Paket langganan yang dapat dipilih (milik NextVersa)' })
  packages(): Promise<MobilePackage[]> {
    return this.service.packages();
  }

  @Post('activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mengaktifkan atau memperpanjang langganan mobile app kampus ini dengan sebuah paket' })
  activate(@Body() dto: ActivateMobileSubscriptionDto, @Req() req: { user?: { sub?: string } }): Promise<MobileSubscriptionActivation> {
    return this.service.activate({ packageId: dto.packageId, durationMonths: dto.durationMonths }, req.user?.sub ?? 'tidak diketahui');
  }
}
