import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { MobileSubscriptionController } from './mobile-subscription.controller';
import { MobileSubscriptionService } from './mobile-subscription.service';

/** SEMENTARA: menu Langganan Mobile App untuk Super Admin. AuthModule menyediakan JwtService untuk JwtAuthGuard. */
@Module({
  imports: [AuthModule],
  controllers: [MobileSubscriptionController],
  providers: [MobileSubscriptionService],
})
export class MobileSubscriptionModule {}
