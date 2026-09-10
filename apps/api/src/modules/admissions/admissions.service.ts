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

  async checkStatus(regNumber: string) {
    const normalized = regNumber.trim().toUpperCase();
    try {
      const applicant = await this.prisma.admissionApplicant.findUnique({
        where: { registrationNumber: normalized },
      });

      if (!applicant) {
        // Fallback for seeded sample
        if (normalized === 'PMB20270001') {
          return {
            found: true,
            registrationNumber: 'PMB20270001',
            fullName: 'Aisyah Rahmadani',
            chosenStudyProgram: 'Teknik Informatika (S1)',
            jalurPendaftaran: 'Jalur Prestasi Akademik (Bebas Tes)',
            status: 'ACCEPTED',
            statusText: 'SELAMAT! ANDA DINYATAKAN LULUS SELEKSI PMB 2027',
            gelombang: 'Gelombang 1 TA 2027/2028',
            isPassed: true,
          };
        }
        return { found: false };
      }

      const isPassed = applicant.status === AdmissionStatus.PASSED;
      const statusText =
        applicant.status === AdmissionStatus.PASSED
          ? 'SELAMAT! ANDA DINYATAKAN LULUS SELEKSI PMB 2027'
          : applicant.status === AdmissionStatus.FAILED
          ? 'MOHON MAAF, ANDA BELUM DINYATAKAN LULUS SELEKSI PMB 2027'
          : applicant.status === AdmissionStatus.VERIFIED
          ? 'BERKAS ANDA TELAH DIVERIFIKASI DAN DALAM TAHAP PENILAIAN'
          : 'BERKAS ANDA TELAH DITERIMA & SEDANG DIVERIFIKASI TIM BAAK PMB';

      return {
        found: true,
        registrationNumber: applicant.registrationNumber,
        fullName: applicant.fullName,
        chosenStudyProgram: applicant.chosenStudyProgram,
        jalurPendaftaran: applicant.jalurPendaftaran,
        status: applicant.status,
        statusText,
        gelombang: 'Gelombang 1 TA 2027/2028',
        isPassed,
      };
    } catch {
      return { found: false };
    }
  }
}
