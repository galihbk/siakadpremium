import { Module } from '@nestjs/common';
import { AcademicController } from './academic.controller';
import { AcademicService } from './academic.service';
import { AssessmentSchemesService } from './assessment-schemes.service';
import { CourseCategoriesService } from './course-categories.service';
import { ThesisModule } from '../thesis/thesis.module';

@Module({
  imports: [ThesisModule],
  controllers: [AcademicController],
  providers: [AcademicService, AssessmentSchemesService, CourseCategoriesService],
  exports: [AcademicService, AssessmentSchemesService, CourseCategoriesService],
})
export class AcademicModule {}
