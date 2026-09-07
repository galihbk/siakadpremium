import { Module } from '@nestjs/common';
import { LandingPageController } from './landing-page.controller';
import { LandingPageService } from './landing-page.service';
import { PrismaModule } from '../../shared/prisma/prisma.module';
import { RedisModule } from '../../shared/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [LandingPageController],
  providers: [LandingPageService],
  exports: [LandingPageService],
})
export class LandingPageModule {}
