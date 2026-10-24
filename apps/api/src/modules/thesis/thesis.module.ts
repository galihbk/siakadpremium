import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { StorageModule } from '../storage/storage.module';
import { ThesisController } from './thesis.controller';
import { ThesisService } from './thesis.service';

@Module({
  imports: [PrismaModule, AuthModule, StorageModule],
  controllers: [ThesisController],
  providers: [ThesisService],
  exports: [ThesisService],
})
export class ThesisModule {}
