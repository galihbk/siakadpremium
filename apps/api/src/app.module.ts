import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { ProxyThrottlerGuard } from './common/guards/proxy-throttler.guard';
import { JwtModule } from '@nestjs/jwt';
import { GlobalAuthGuard } from './common/guards/global-auth.guard';
import { PrismaModule } from './shared/prisma/prisma.module';
import { RedisModule } from './shared/redis/redis.module';
import { BootstrapModule } from './shared/bootstrap/bootstrap.module';
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
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ShiftsModule } from './modules/shifts/shifts.module';
import { Lp3mModule } from './modules/lp3m/lp3m.module';
import { P2mModule } from './modules/p2m/p2m.module';
import { UsersModule } from './modules/users/users.module';
import { StorageModule } from './modules/storage/storage.module';
import { IntegrationSettingsModule } from './modules/integration-settings/integration-settings.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { MobileSubscriptionModule } from './modules/mobile-subscription/mobile-subscription.module';
import { SiakadContractModule } from './modules/siakad-contract/siakad-contract.module';
import { LettersModule } from './modules/letters/letters.module';
import { DocumentSignaturesModule } from './modules/document-signatures/document-signatures.module';
import { ThesisModule } from './modules/thesis/thesis.module';
import { FieldActivityModule } from './modules/field-activity/field-activity.module';
import { GraduationModule } from './modules/graduation/graduation.module';
import { ExamsModule } from './modules/exams/exams.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ProdiModule } from './modules/prodi/prodi.module';
import { BackupsModule } from './modules/backups/backups.module';
import { ObeIntegrationModule } from './modules/obe-integration/obe-integration.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // JwtService untuk GlobalAuthGuard (rahasia sama dengan AuthModule).
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'siakad_premium_jwt_secret_2026'),
      }),
    }),
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
    BootstrapModule,
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
    AttendanceModule,
    ShiftsModule,
    Lp3mModule,
    P2mModule,
    UsersModule,
    StorageModule,
    IntegrationSettingsModule,
    MonitoringModule,
    LettersModule,
    DocumentSignaturesModule,
    ThesisModule,
    FieldActivityModule,
    GraduationModule,
    ExamsModule,
    NotificationsModule,
    ProdiModule,
    BackupsModule,
    ObeIntegrationModule,
    MobileSubscriptionModule,
    SiakadContractModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ProxyThrottlerGuard },
    // Semua endpoint wajib login kecuali yang terdaftar publik (lihat global-auth.guard.ts).
    { provide: APP_GUARD, useClass: GlobalAuthGuard },
  ],
})
export class AppModule {}
