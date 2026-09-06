import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './shared/prisma/prisma.module';
import { RedisModule } from './shared/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { FacultiesModule } from './modules/faculties/faculties.module';
import { StudyProgramsModule } from './modules/study-programs/study-programs.module';
import { StudentsModule } from './modules/students/students.module';
import { LecturersModule } from './modules/lecturers/lecturers.module';
import { AcademicModule } from './modules/academic/academic.module';
import { AdmissionsModule } from './modules/admissions/admissions.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env'],
    }),
    PrismaModule,
    RedisModule,
    AuthModule,
    FacultiesModule,
    StudyProgramsModule,
    StudentsModule,
    LecturersModule,
    AcademicModule,
    AdmissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
