import { Module } from '@nestjs/common';
import { AcademicController } from './academic.controller';
import { AcademicService } from './academic.service';
import { AssessmentSchemesService } from './assessment-schemes.service';

@Module({
  controllers: [AcademicController],
  providers: [AcademicService, AssessmentSchemesService],
  exports: [AcademicService, AssessmentSchemesService],
})
export class AcademicModule {}
