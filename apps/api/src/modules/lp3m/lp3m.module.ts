import { Module } from '@nestjs/common';
import { Lp3mController } from './lp3m.controller';
import { Lp3mService } from './lp3m.service';

@Module({
  controllers: [Lp3mController],
  providers: [Lp3mService],
  exports: [Lp3mService],
})
export class Lp3mModule {}
