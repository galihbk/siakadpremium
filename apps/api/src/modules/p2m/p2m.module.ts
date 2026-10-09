import { Module } from '@nestjs/common';
import { P2mController } from './p2m.controller';
import { P2mService } from './p2m.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [P2mController],
  providers: [P2mService],
  exports: [P2mService],
})
export class P2mModule {}
