import { Module } from '@nestjs/common';
import { AdmissionsController } from './admissions.controller';
import { AdmissionsService } from './admissions.service';
import { PmbService } from './pmb.service';
import { PmbChatController } from './pmb-chat.controller';
import { PmbChatService } from './pmb-chat.service';
import { PmbChatGateway } from './pmb-chat.gateway';
import { PddiktiPublicService } from './pddikti-public.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { FinanceModule } from '../finance/finance.module';
import { AuthModule } from '../auth/auth.module';
import { IntegrationSettingsModule } from '../integration-settings/integration-settings.module';

@Module({
  imports: [PrismaModule, FinanceModule, AuthModule, IntegrationSettingsModule],
  controllers: [AdmissionsController, PmbChatController],
  providers: [AdmissionsService, PmbService, PmbChatService, PmbChatGateway, PddiktiPublicService],
  exports: [AdmissionsService, PmbService],
})
export class AdmissionsModule {}


