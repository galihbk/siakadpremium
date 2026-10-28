import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { AcademicModule } from '../academic/academic.module';
import { FinanceModule } from '../finance/finance.module';
import { FieldActivityController } from './field-activity.controller';
import { FieldActivityService } from './field-activity.service';

@Module({
  imports: [PrismaModule, AuthModule, AcademicModule, FinanceModule],
  controllers: [FieldActivityController],
  providers: [FieldActivityService],
  exports: [FieldActivityService],
})
export class FieldActivityModule {}
