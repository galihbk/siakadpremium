import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface EmailQueueJob {
  id: string;
  to: string;
  fullName: string;
  verificationUrl?: string;
  resetUrl?: string;
  type: 'VERIFICATION' | 'PASSWORD_RESET';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  error?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter;

  // In-Memory Queue State
  private queue: EmailQueueJob[] = [];
  private isProcessing = false;
  private processedCount = 0;
  private failedCount = 0;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST || 'smtp.hostinger.com',
      port: Number(process.env.MAIL_PORT) || 587,
      secure: false, // Port 587 uses STARTTLS
      auth: {
        user: process.env.MAIL_USERNAME || 'noreply@bibsport.id',
        pass: process.env.MAIL_PASSWORD || 'Fath0303$',
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Mengirim email verifikasi akun pendaftaran PMB via Queue Asinkron
   */
  async sendVerificationEmail(
    to: string,
    fullName: string,
    verificationUrl: string,
  ): Promise<boolean> {
    const jobId = `mail-verif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const job: EmailQueueJob = {
      id: jobId,
      to,
      fullName,
      verificationUrl,
      type: 'VERIFICATION',
      status: 'PENDING',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
    };

    this.queue.push(job);
    this.logger.log(`[MailQueue] Job #${job.id} masuk antrean verifikasi untuk ${to}. Total antrean: ${this.queue.length}`);

    this.processQueue().catch((err) => {
      this.logger.error(`[MailQueue] Worker queue error:`, err);
    });

    return true;
  }

  /**
   * Mengirim email reset kata sandi pendaftaran PMB via Queue Asinkron
   */
  async sendPasswordResetEmail(
    to: string,
    fullName: string,
    resetUrl: string,
  ): Promise<boolean> {
    const jobId = `mail-reset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const job: EmailQueueJob = {
      id: jobId,
      to,
      fullName,
      resetUrl,
      type: 'PASSWORD_RESET',
      status: 'PENDING',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
    };

    this.queue.push(job);
    this.logger.log(`[MailQueue] Job #${job.id} masuk antrean reset password untuk ${to}. Total antrean: ${this.queue.length}`);

    this.processQueue().catch((err) => {
      this.logger.error(`[MailQueue] Worker queue error:`, err);
    });

    return true;
  }

  /**
   * Worker pemroses antrean email (FIFO) dengan mekanisme auto-retry
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const job = this.queue[0];
      job.status = 'PROCESSING';
      job.attempts += 1;

      this.logger.log(
        `[MailQueue] Memproses antrean #${job.id} (${job.type} - Percobaan ${job.attempts}/${job.maxAttempts}) ke: ${job.to}`,
      );

      try {
        let success = false;
        if (job.type === 'PASSWORD_RESET') {
          success = await this.deliverPasswordResetEmail(job);
        } else {
          success = await this.deliverVerificationEmail(job);
        }

        if (success) {
          job.status = 'COMPLETED';
          this.processedCount += 1;
          this.queue.shift(); // Hapus job yang sukses
          this.logger.log(`[MailQueue] Job #${job.id} sukses terkirim ke ${job.to}`);
        } else {
          throw new Error('Pengiriman SMTP mengembalikan nilai false');
        }
      } catch (error: any) {
        job.error = error?.message || String(error);
        this.logger.warn(
          `[MailQueue] Job #${job.id} gagal pada percobaan ke-${job.attempts}: ${job.error}`,
        );

        if (job.attempts < job.maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } else {
          job.status = 'FAILED';
          this.failedCount += 1;
          this.queue.shift();
          this.logger.error(
            `[MailQueue] Job #${job.id} gagal permanen untuk ${job.to} setelah ${job.attempts} kali percobaan`,
          );
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * Eksekusi pengiriman email verifikasi via SMTP
   */
  private async deliverVerificationEmail(job: EmailQueueJob): Promise<boolean> {
    const fromName = process.env.MAIL_FROM_NAME || 'STKIP MAJENANG';
    const fromAddress = process.env.MAIL_FROM_ADDRESS || 'noreply@bibsport.id';

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifikasi Akun PMB</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      color: #1e293b;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      color: #bfdbfe;
    }
    .content {
      padding: 36px 32px;
      line-height: 1.6;
    }
    .greeting {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .lead {
      font-size: 14px;
      color: #475569;
      margin-bottom: 24px;
    }
    .cta-box {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background-color: #1E3A8A;
      color: #ffffff !important;
      font-weight: 700;
      font-size: 14px;
      padding: 14px 32px;
      border-radius: 10px;
      text-decoration: none;
      box-shadow: 0 2px 4px rgba(30, 58, 138, 0.2);
    }
    .url-box {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      word-break: break-all;
      font-size: 11px;
      color: #64748b;
      margin-top: 24px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${fromName}</h1>
      <p>Penerimaan Mahasiswa Baru (PMB) TA 2027/2028</p>
    </div>
    <div class="content">
      <div class="greeting">Halo, ${job.fullName}!</div>
      <div class="lead">
        Terima kasih telah melakukan pendaftaran akun calon mahasiswa di <strong>${fromName}</strong>.
        <br><br>
        Satu langkah lagi untuk mengaktifkan akun Anda. Silakan klik tombol di bawah ini untuk memverifikasi alamat email Anda:
      </div>
      <div class="cta-box">
        <a href="${job.verificationUrl}" class="btn" target="_blank">Verifikasi Akun Saya</a>
      </div>
      <p style="font-size: 12px; color: #64748b;">
        Tautan verifikasi ini akan kedaluwarsa dalam <strong>24 jam</strong>.
      </p>
      <div class="url-box">
        Jika tombol di atas tidak berfungsi, salin dan tempel tautan berikut di peramban (browser) Anda:<br>
        <a href="${job.verificationUrl}" style="color: #1E3A8A;">${job.verificationUrl}</a>
      </div>
    </div>
    <div class="footer">
      Email ini dikirim otomatis oleh Panitia PMB ${fromName}.<br>
      Jika Anda tidak pernah mendaftar di sistem ini, silakan abaikan email ini.
    </div>
  </div>
</body>
</html>
    `;

    const info = await this.transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: job.to,
      subject: `Verifikasi Akun Pendaftaran PMB - ${fromName}`,
      html: htmlContent,
    });

    this.logger.log(`[MailQueue] SMTP delivered verification to ${job.to}, messageId: ${info.messageId}`);
    return true;
  }

  /**
   * Eksekusi pengiriman email reset kata sandi via SMTP
   */
  private async deliverPasswordResetEmail(job: EmailQueueJob): Promise<boolean> {
    const fromName = process.env.MAIL_FROM_NAME || 'STKIP MAJENANG';
    const fromAddress = process.env.MAIL_FROM_ADDRESS || 'noreply@bibsport.id';

    const htmlContent = `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Kata Sandi Akun PMB</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f1f5f9;
      color: #1e293b;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #1E3A8A 0%, #1e40af 100%);
      padding: 32px 24px;
      text-align: center;
      color: #ffffff;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      color: #bfdbfe;
    }
    .content {
      padding: 36px 32px;
      line-height: 1.6;
    }
    .greeting {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 12px;
    }
    .lead {
      font-size: 14px;
      color: #475569;
      margin-bottom: 24px;
    }
    .cta-box {
      text-align: center;
      margin: 32px 0;
    }
    .btn {
      display: inline-block;
      background-color: #D4A017;
      color: #0f172a !important;
      font-weight: 800;
      font-size: 14px;
      padding: 14px 32px;
      border-radius: 10px;
      text-decoration: none;
      box-shadow: 0 2px 4px rgba(212, 160, 23, 0.3);
    }
    .url-box {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      word-break: break-all;
      font-size: 11px;
      color: #64748b;
      margin-top: 24px;
    }
    .footer {
      background-color: #f8fafc;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${fromName}</h1>
      <p>Pusat Bantuan & Pemulihan Akun PMB</p>
    </div>
    <div class="content">
      <div class="greeting">Halo, ${job.fullName}!</div>
      <div class="lead">
        Kami menerima permintaan untuk mengatur ulang kata sandi akun pendaftaran PMB Anda di <strong>${fromName}</strong>.
        <br><br>
        Silakan klik tombol di bawah ini untuk membuat kata sandi baru akun Anda:
      </div>
      <div class="cta-box">
        <a href="${job.resetUrl}" class="btn" target="_blank">Atur Ulang Kata Sandi</a>
      </div>
      <p style="font-size: 12px; color: #64748b;">
        Tautan pengaturan ulang kata sandi ini hanya berlaku selama <strong>2 jam</strong> demi keamanan akun Anda.
      </p>
      <div class="url-box">
        Jika tombol di atas tidak dapat diklik, salin dan buka tautan berikut:<br>
        <a href="${job.resetUrl}" style="color: #1E3A8A;">${job.resetUrl}</a>
      </div>
    </div>
    <div class="footer">
      Jika Anda tidak pernah meminta pengaturan ulang kata sandi ini, silakan abaikan pesan email ini. Akun Anda tetap aman.<br>
      Panitia PMB ${fromName}.
    </div>
  </div>
</body>
</html>
    `;

    const info = await this.transporter.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to: job.to,
      subject: `Atur Ulang Kata Sandi Akun PMB - ${fromName}`,
      html: htmlContent,
    });

    this.logger.log(`[MailQueue] SMTP delivered password reset to ${job.to}, messageId: ${info.messageId}`);
    return true;
  }

  /**
   * Mendapatkan status metrik antrean email
   */
  getQueueStatus() {
    return {
      pending: this.queue.length,
      isProcessing: this.isProcessing,
      processedTotal: this.processedCount,
      failedTotal: this.failedCount,
    };
  }
}
