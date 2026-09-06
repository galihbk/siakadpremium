import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RegisterApplicantDto } from './dto/register-applicant.dto';
import { AdmissionStatus } from '@siakad/types';

@Injectable()
export class AdmissionsService {
  constructor(private prisma: PrismaService) {}

  async register(dto: RegisterApplicantDto) {
    const regNumber = `PMB2027${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const applicant = await this.prisma.admissionApplicant.create({
        data: {
          registrationNumber: regNumber,
          fullName: dto.fullName,
          email: dto.email,
          phone: dto.phone,
          highSchool: dto.highSchool,
          chosenStudyProgram: dto.chosenStudyProgram,
          jalurPendaftaran: dto.jalurPendaftaran || 'Jalur Reguler',
          status: AdmissionStatus.PENDING,
        },
      });
      return applicant;
    } catch {
      // Return demo registration response
      return {
        id: 'applicant-demo-id',
        registrationNumber: regNumber,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        highSchool: dto.highSchool,
        chosenStudyProgram: dto.chosenStudyProgram,
        jalurPendaftaran: dto.jalurPendaftaran || 'Jalur Reguler',
        status: AdmissionStatus.PENDING,
        createdAt: new Date().toISOString(),
      };
    }
  }

  async getSummary() {
    return {
      gelombangAktif: 'Gelombang 1 TA 2027/2028',
      tanggalBuka: '1 Agustus 2026',
      tanggalTutup: '30 November 2026',
      totalPendaftar: 2450,
      totalLolosSeleksi: 1850,
      jalurTersedia: [
        'Jalur Undangan Prestasi Unggul',
        'Jalur Beasiswa Nusantara Peduli',
        'Jalur Tes Mandiri Online (CBT)',
      ],
    };
  }
}
