import { Module } from '@nestjs/common';
import { FinanceController } from './finance.controller';
import { FinanceService } from './finance.service';
import { FeeRulesService } from './fee-rules.service';
import { PaymentReliefService } from './payment-relief.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AttendanceModule } from '../attendance/attendance.module';

@Module({
  imports: [PrismaModule, AttendanceModule],
  controllers: [FinanceController],
  providers: [FinanceService, FeeRulesService, PaymentReliefService],
  exports: [FinanceService, FeeRulesService, PaymentReliefService],
})
export class FinanceModule {}

