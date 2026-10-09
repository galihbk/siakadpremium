import { Module } from '@nestjs/common';
import { LecturersController } from './lecturers.controller';
import { LecturersService } from './lecturers.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [LecturersController],
  providers: [LecturersService],
  exports: [LecturersService],
})
export class LecturersModule {}
