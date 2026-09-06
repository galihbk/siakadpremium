import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // 1. Global Prefix: /api/v1
  app.setGlobalPrefix('api/v1');

  // 2. Enable CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // 3. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 4. Global Exception Filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // 5. Global Response Transform Interceptor
  app.useGlobalInterceptors(new TransformInterceptor());

  // 6. Swagger OpenAPI Documentation
  const config = new DocumentBuilder()
    .setTitle('SIAKAD Premium Enterprise API')
    .setDescription(
      'Dokumentasi resmi REST API Sistem Informasi Akademik (SIAKAD Premium) Institut Teknologi Nusantara. Dilengkapi endpoint modul Auth, Mahasiswa, Dosen, Akademik, Fakultas, dan PMB.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Masukkan token JWT Anda',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'Autentikasi & Session Pengguna Portal')
    .addTag('Students (Mahasiswa)', 'Data Akademik & Layanan Mahasiswa')
    .addTag('Lecturers (Dosen)', 'Jadwal Mengajar & Bimbingan Akademik')
    .addTag('Academic (Layanan Akademik & Admin)', 'Manajemen Mata Kuliah & Dashboard BAAK')
    .addTag('Faculties (Fakultas)', 'Informasi Fakultas Kampus')
    .addTag('Study Programs (Program Studi)', 'Daftar Program Studi & Akreditasi')
    .addTag('Admissions (Penerimaan Mahasiswa Baru / PMB)', 'Pendaftaran Mahasiswa Baru')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'SIAKAD Premium API Documentation',
    customCss: '.swagger-ui .topbar { background-color: #1E3A8A; }',
  });

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(`================================================================`);
  logger.log(`🚀 SIAKAD Premium API berjalan pada: http://localhost:${port}/api/v1`);
  logger.log(`📖 Dokumentasi Swagger OpenAPI:     http://localhost:${port}/api/docs`);
  logger.log(`================================================================`);
}

bootstrap();
