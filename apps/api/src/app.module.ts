import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './shared/prisma/prisma.module';
import { RedisModule } from './shared/redis/redis.module';
import { MailModule } from './shared/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { FacultiesModule } from './modules/faculties/faculties.module';
import { StudyProgramsModule } from './modules/study-programs/study-programs.module';
import { StudentsModule } from './modules/students/students.module';
import { LecturersModule } from './modules/lecturers/lecturers.module';
import { AcademicModule } from './modules/academic/academic.module';
import { AdmissionsModule } from './modules/admissions/admissions.module';
import { LandingPageModule } from './modules/landing-page/landing-page.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { BuildingsModule } from './modules/buildings/buildings.module';
import { FinanceModule } from './modules/finance/finance.module';
import { Lp3mModule } from './modules/lp3m/lp3m.module';
import { UsersModule } from './modules/users/users.module';
import { StorageModule } from './modules/storage/storage.module';
import { IntegrationSettingsModule } from './modules/integration-settings/integration-settings.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env', '../../.env'],
    }),
    // Batas laju permintaan default seluruh API — pertahanan dasar terhadap brute-force
    // dan penyalahgunaan otomatis. Endpoint sensitif (mis. login) diberi batas lebih ketat
    // sendiri lewat dekorator @Throttle di controller-nya.
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    PrismaModule,
    RedisModule,
    MailModule,
    AuthModule,
    FacultiesModule,
    StudyProgramsModule,
    StudentsModule,
    LecturersModule,
    AcademicModule,
    AdmissionsModule,
    LandingPageModule,
    AnalyticsModule,
    EmployeesModule,
    BuildingsModule,
    FinanceModule,
    Lp3mModule,
    UsersModule,
    StorageModule,
    IntegrationSettingsModule,
    MonitoringModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
