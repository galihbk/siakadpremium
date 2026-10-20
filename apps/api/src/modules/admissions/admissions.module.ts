import { Module } from '@nestjs/common';
import { AdmissionsController } from './admissions.controller';
import { AdmissionsService } from './admissions.service';
import { PmbService } from './pmb.service';
import { PmbChatController } from './pmb-chat.controller';
import { PmbChatService } from './pmb-chat.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { FinanceModule } from '../finance/finance.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, FinanceModule, AuthModule],
  controllers: [AdmissionsController, PmbChatController],
  providers: [AdmissionsService, PmbService, PmbChatService],
  exports: [AdmissionsService, PmbService],
})
export class AdmissionsModule {}


