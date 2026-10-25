import { Module } from '@nestjs/common';
import { LettersController, VerifyController } from './letters.controller';
import { LettersService } from './letters.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [LettersController, VerifyController],
  providers: [LettersService],
  exports: [LettersService],
})
export class LettersModule {}
