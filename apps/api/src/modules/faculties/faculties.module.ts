import { Module } from '@nestjs/common';
import { FacultiesController } from './faculties.controller';
import { FacultiesService } from './faculties.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [FacultiesController],
  providers: [FacultiesService],
  exports: [FacultiesService],
})
export class FacultiesModule {}
