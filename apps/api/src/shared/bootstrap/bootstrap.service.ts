import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Role } from '@siakad/database';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Menyiapkan instance BARU yang databasenya masih kosong (mis. demo/kampus baru) tanpa seed data kampus lain.
 *
 * Aktif hanya bila variabel lingkungan berikut diisi dan belum ada satu pun akun SUPER_ADMIN:
 *   BOOTSTRAP_ADMIN_EMAIL      email Super Admin pertama
 *   BOOTSTRAP_ADMIN_PASSWORD   kata sandi awal (minimal 8 karakter; segera ganti setelah login)
 *   BOOTSTRAP_ADMIN_NAME       opsional, nama tampilan (bawaan "Super Administrator")
 *   BOOTSTRAP_CAMPUS_NAME      opsional, nama kampus untuk profil institusi awal
 *   BOOTSTRAP_CAMPUS_SHORT     opsional, singkatan kampus (maks. 5 huruf)
 *
 * Aman dijalankan berulang kali: tidak berbuat apa-apa bila Super Admin sudah ada, dan tidak pernah
 * menimpa profil institusi yang sudah ada.
 */
@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger('Bootstrap');

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    const email = this.config.get<string>('BOOTSTRAP_ADMIN_EMAIL')?.trim().toLowerCase();
    const password = this.config.get<string>('BOOTSTRAP_ADMIN_PASSWORD');
    if (!email || !password) return;

    try {
      const existing = await this.prisma.user.count({ where: { role: Role.SUPER_ADMIN } });
      if (existing > 0) return;

      if (password.length < 8) {
        this.logger.error('BOOTSTRAP_ADMIN_PASSWORD minimal 8 karakter -- Super Admin awal tidak dibuat.');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        this.logger.error('BOOTSTRAP_ADMIN_EMAIL tidak valid -- Super Admin awal tidak dibuat.');
        return;
      }

      const name = this.config.get<string>('BOOTSTRAP_ADMIN_NAME')?.trim() || 'Super Administrator';
      await this.prisma.user.create({
        data: {
          email,
          fullName: name,
          role: Role.SUPER_ADMIN,
          passwordHash: await bcrypt.hash(password, 10),
          isActive: true,
        },
      });
      this.logger.log(`Super Admin awal dibuat: ${email}. Segera ganti kata sandinya setelah login pertama.`);

      await this.createInstitutionProfile();
    } catch (err) {
      this.logger.error(`Bootstrap gagal: ${err instanceof Error ? err.message : err}`);
    }
  }

  /** Profil institusi awal yang bersih: hanya nama kampus, tanpa data kampus lain. */
  private async createInstitutionProfile() {
    const name = this.config.get<string>('BOOTSTRAP_CAMPUS_NAME')?.trim();
    if (!name) return;
    const short = (this.config.get<string>('BOOTSTRAP_CAMPUS_SHORT')?.trim() || name.split(/\s+/).map((w) => w[0]).join('')).toUpperCase().slice(0, 5);

    const exists = await this.prisma.landingPageSetting.findUnique({ where: { id: 'default-setting' } });
    if (exists) return;

    await this.prisma.landingPageSetting.create({
      data: {
        id: 'default-setting',
        campusName: name,
        campusShortName: short,
        logoInitials: short,
        tagline: '',
        heroBadge: 'Penerimaan Mahasiswa Baru',
        heroTitle: `Selamat datang di ${name}`,
        heroSubtitle: '',
        rectorName: '',
        rectorTitle: '',
        rectorQuote: '',
        rectorSpeech: '',
        announcementActive: false,
        announcementBadge: '',
        announcementText: '',
        announcementLink: null,
        contactAddress: '',
        contactPhone: '',
        contactEmail: '',
        contactWhatsapp: '',
        socialInstagram: null,
        socialYoutube: null,
        socialLinkedin: null,
        foundationName: '',
        website: '',
        academicEmail: '',
        accreditation: '',
        accreditationSk: '',
        accreditationValidUntil: '',
        ptStatus: '',
        npsn: '',
        ptCode: '',
        establishmentSk: '',
        viceRector1: '',
        viceRector2: '',
        viceRector3: '',
        kopLine1: '',
        kopLine2: name.toUpperCase(),
        kopContact: '',
      },
    });
    this.logger.log(`Profil institusi awal dibuat: ${name} (${short}). Lengkapi di Super Admin > Profil Institusi.`);
  }
}
