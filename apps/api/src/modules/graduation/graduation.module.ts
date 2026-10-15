import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { GraduationController } from './graduation.controller';
import { GraduationService } from './graduation.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [GraduationController],
  providers: [GraduationService],
  exports: [GraduationService],
})
export class GraduationModule {}
