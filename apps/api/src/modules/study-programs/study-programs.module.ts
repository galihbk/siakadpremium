import { Module } from '@nestjs/common';
import { StudyProgramsController } from './study-programs.controller';
import { StudyProgramsService } from './study-programs.service';

@Module({
  controllers: [StudyProgramsController],
  providers: [StudyProgramsService],
  exports: [StudyProgramsService],
})
export class StudyProgramsModule {}
