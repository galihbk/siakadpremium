import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { FeeRulesService } from './fee-rules.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FinanceController],
  providers: [FinanceService, FeeRulesService],
  exports: [FinanceService, FeeRulesService],
})
export class FinanceModule {}

