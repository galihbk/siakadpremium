import { Module } from '@nestjs/common';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProdiController } from './prodi.controller';
import { ProdiService } from './prodi.service';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [ProdiController],
  providers: [ProdiService],
  exports: [ProdiService],
})
export class ProdiModule {}
