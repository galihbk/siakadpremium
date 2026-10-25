import { Module } from '@nestjs/common';
import { LecturersController } from './lecturers.controller';
import { LecturersService } from './lecturers.service';
import { AuthModule } from '../auth/auth.module';
import { AcademicModule } from '../academic/academic.module';
import { ThesisModule } from '../thesis/thesis.module';

@Module({
  imports: [AuthModule, AcademicModule, ThesisModule],
  controllers: [LecturersController],
  providers: [LecturersService],
  exports: [LecturersService],
})
export class LecturersModule {}
