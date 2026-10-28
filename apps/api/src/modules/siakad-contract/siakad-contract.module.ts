import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SiakadContractController } from './siakad-contract.controller';
import { SiakadContractService } from './siakad-contract.service';

/** Kontrak API SIAKAD untuk aplikasi mobile NextVersa (login + profil mahasiswa). AuthModule menyediakan JwtService. */
@Module({
  imports: [AuthModule],
  controllers: [SiakadContractController],
  providers: [SiakadContractService],
})
export class SiakadContractModule {}
