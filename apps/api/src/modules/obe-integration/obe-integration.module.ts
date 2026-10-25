import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ObeApiKeyGuard } from './obe-api-key.guard';
import { ObeApiViewsService } from './obe-api-views.service';
import { ObePortalController } from './obe-portal.controller';
import { ObePortalService } from './obe-portal.service';
import { ObeStatusController } from './obe-status.controller';
import { ObeStatusService } from './obe-status.service';
import { ObeIntegrationController } from './obe-integration.controller';
import { ObeIntegrationService } from './obe-integration.service';

/** Endpoint baca-saja untuk sistem OBE, dan view baca-saja di database (skema obe_api). PrismaModule bersifat global. */
@Module({
  // AuthModule menyediakan JwtService untuk JwtAuthGuard pada halaman status Super Admin.
  imports: [AuthModule],
  controllers: [ObeIntegrationController, ObeStatusController, ObePortalController],
  providers: [ObeIntegrationService, ObeApiKeyGuard, ObeApiViewsService, ObeStatusService, ObePortalService],
})
export class ObeIntegrationModule {}
