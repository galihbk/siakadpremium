import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { FinanceModule } from '../finance/finance.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [FinanceModule, AuthModule],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
