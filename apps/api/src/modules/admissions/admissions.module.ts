import { Module } from '@nestjs/common';
import { AdmissionsController } from './admissions.controller';
import { AdmissionsService } from './admissions.service';
import { PmbService } from './pmb.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { FinanceModule } from '../finance/finance.module';

@Module({
  imports: [PrismaModule, FinanceModule],
  controllers: [AdmissionsController],
  providers: [AdmissionsService, PmbService],
  exports: [AdmissionsService, PmbService],
})
export class AdmissionsModule {}


