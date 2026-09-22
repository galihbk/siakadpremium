import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { UpdateBankSettingDto } from './dto/update-bank-setting.dto';
import { UpdatePddiktiSettingDto } from './dto/update-pddikti-setting.dto';

const BANK_SETTING_ID = 'default-bank-setting';
const PDDIKTI_SETTING_ID = 'default-pddikti-setting';

function maskSecret(value?: string | null): string | null {
  if (!value) return null;
  if (value.length <= 4) return '••••';
  return `••••${value.slice(-4)}`;
}

@Injectable()
export class IntegrationSettingsService {
  constructor(private prisma: PrismaService) {}

  async getBankSetting() {
    const setting = await this.prisma.bankGatewaySetting.upsert({
      where: { id: BANK_SETTING_ID },
      update: {},
      create: { id: BANK_SETTING_ID },
    });

    return {
      ...setting,
      apiKey: maskSecret(setting.apiKey),
      apiSecret: maskSecret(setting.apiSecret),
      hasApiKey: Boolean(setting.apiKey),
      hasApiSecret: Boolean(setting.apiSecret),
    };
  }

  async updateBankSetting(dto: UpdateBankSettingDto, userId?: string) {
    const data: any = { ...dto };
    // Jangan timpa kredensial tersimpan kalau field dikirim kosong (frontend hanya isi saat mau ganti)
    if (!data.apiKey) delete data.apiKey;
    if (!data.apiSecret) delete data.apiSecret;
    if (userId) data.updatedByUserId = userId;

    await this.prisma.bankGatewaySetting.upsert({
      where: { id: BANK_SETTING_ID },
      update: data,
      create: { id: BANK_SETTING_ID, ...data },
    });

    try {
      await this.prisma.systemAuditLog.create({
        data: {
          action: 'BANK_SETTING_UPDATE',
          detail: 'Super Administrator memperbarui konfigurasi payment gateway bank',
        },
      });
    } catch {
      // non-blocking
    }

    return this.getBankSetting();
  }

  async getPddiktiSetting() {
    const setting = await this.prisma.pddiktiSetting.upsert({
      where: { id: PDDIKTI_SETTING_ID },
      update: {},
      create: { id: PDDIKTI_SETTING_ID },
    });

    return {
      ...setting,
      password: maskSecret(setting.password),
      secretKey: maskSecret(setting.secretKey),
      hasPassword: Boolean(setting.password),
      hasSecretKey: Boolean(setting.secretKey),
      isConnected: Boolean(setting.isActive && setting.baseUrl && setting.username && setting.password),
    };
  }

  async updatePddiktiSetting(dto: UpdatePddiktiSettingDto, userId?: string) {
    const data: any = { ...dto };
    if (!data.password) delete data.password;
    if (!data.secretKey) delete data.secretKey;
    if (userId) data.updatedByUserId = userId;

    await this.prisma.pddiktiSetting.upsert({
      where: { id: PDDIKTI_SETTING_ID },
      update: data,
      create: { id: PDDIKTI_SETTING_ID, ...data },
    });

    try {
      await this.prisma.systemAuditLog.create({
        data: {
          action: 'PDDIKTI_SETTING_UPDATE',
          detail: 'Super Administrator memperbarui konfigurasi koneksi Web Service Neo Feeder PDDIKTI',
        },
      });
    } catch {
      // non-blocking
    }

    return this.getPddiktiSetting();
  }

  async testPddiktiConnection() {
    const setting = await this.prisma.pddiktiSetting.findUnique({ where: { id: PDDIKTI_SETTING_ID } });
    if (!setting?.baseUrl || !setting?.username || !setting?.password) {
      return { success: false, message: 'URL, username, dan password Web Service belum lengkap diisi.' };
    }

    try {
      const res = await fetch(setting.baseUrl, { method: 'GET', signal: AbortSignal.timeout(8000) });
      return {
        success: res.ok,
        message: res.ok
          ? 'Endpoint Web Service Neo Feeder dapat dijangkau.'
          : `Endpoint merespons dengan status ${res.status}.`,
      };
    } catch (err: any) {
      return { success: false, message: `Gagal menjangkau endpoint: ${err?.message || 'Unknown error'}` };
    }
  }
}
