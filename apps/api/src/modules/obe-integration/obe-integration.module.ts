import { Module } from '@nestjs/common';
import { ObeApiKeyGuard } from './obe-api-key.guard';
import { ObeIntegrationController } from './obe-integration.controller';
import { ObeIntegrationService } from './obe-integration.service';

/** Endpoint baca-saja untuk sistem OBE. PrismaModule bersifat global di aplikasi ini. */
@Module({
  controllers: [ObeIntegrationController],
  providers: [ObeIntegrationService, ObeApiKeyGuard],
})
export class ObeIntegrationModule {}
