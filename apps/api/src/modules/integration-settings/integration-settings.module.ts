import { Module } from '@nestjs/common';
import { IntegrationSettingsController } from './integration-settings.controller';
import { IntegrationSettingsService } from './integration-settings.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [IntegrationSettingsController],
  providers: [IntegrationSettingsService],
  exports: [IntegrationSettingsService],
})
export class IntegrationSettingsModule {}
