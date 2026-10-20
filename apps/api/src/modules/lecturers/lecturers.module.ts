import { Module } from '@nestjs/common';
import { LecturersController } from './lecturers.controller';
import { LecturersService } from './lecturers.service';
import { AuthModule } from '../auth/auth.module';
import { AcademicModule } from '../academic/academic.module';

@Module({
  imports: [AuthModule, AcademicModule],
  controllers: [LecturersController],
  providers: [LecturersService],
  exports: [LecturersService],
})
export class LecturersModule {}
