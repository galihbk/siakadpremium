import { Controller, Get, Put, Post, Body, Req, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  IntegrationSettingsService,
  RemoteProdiItem,
  RemoteDosenItem,
  RemoteMahasiswaItem,
  RemoteCourseItem,
  RemoteCurriculumItem,
  RemoteCourseClassItem,
  RemoteAcademicYearItem,
  RemoteEnrollmentItem,
  RemoteGradeScaleItem,
} from './integration-settings.service';
import { UpdateBankSettingDto } from './dto/update-bank-setting.dto';
import { UpdatePddiktiSettingDto } from './dto/update-pddikti-setting.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@siakad/types';

@ApiTags('Integration Settings')
@Controller('integration-settings')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class IntegrationSettingsController {
  constructor(private readonly integrationSettingsService: IntegrationSettingsService) {}

  @Get('bank')
  @ApiOperation({ summary: 'Mendapatkan konfigurasi payment gateway bank (Khusus Super Admin)' })
  async getBankSetting() {
    return this.integrationSettingsService.getBankSetting();
  }

  @Put('bank')
  @ApiOperation({ summary: 'Memperbarui konfigurasi payment gateway bank (Khusus Super Admin)' })
  async updateBankSetting(@Body() dto: UpdateBankSettingDto, @Req() req: any) {
    const userId = req?.user?.sub || req?.user?.id;
    return this.integrationSettingsService.updateBankSetting(dto, userId);
  }

  @Get('pddikti')
  @ApiOperation({ summary: 'Mendapatkan konfigurasi koneksi Web Service Neo Feeder PDDIKTI (Khusus Super Admin)' })
  async getPddiktiSetting() {
    return this.integrationSettingsService.getPddiktiSetting();
  }

  // Status ringkas (tanpa kredensial) boleh dilihat BAAK/Staff juga -- hanya Super Admin
  // yang boleh melihat/mengubah kredensial sungguhan lewat endpoint GET/PUT di atas.
  @Get('pddikti/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Status ringkas koneksi PDDIKTI tanpa kredensial (BAAK & Super Admin)' })
  async getPddiktiStatus() {
    return this.integrationSettingsService.getPddiktiConnectionStatus();
  }

  @Put('pddikti')
  @ApiOperation({ summary: 'Memperbarui konfigurasi koneksi PDDIKTI (Khusus Super Admin)' })
  async updatePddiktiSetting(@Body() dto: UpdatePddiktiSettingDto, @Req() req: any) {
    const userId = req?.user?.sub || req?.user?.id;
    return this.integrationSettingsService.updatePddiktiSetting(dto, userId);
  }

  @Post('pddikti/test-connection')
  @ApiOperation({ summary: 'Menguji koneksi ke endpoint Web Service Neo Feeder PDDIKTI' })
  async testPddiktiConnection() {
    return this.integrationSettingsService.testPddiktiConnection();
  }

  // Menarik & menyinkronkan data prodi membuat/mengubah data induk Program Studi
  // (termasuk assign fakultas), jadi ini tetap wewenang Super Admin -- BAAK hanya
  // melaporkan data transaksional (mahasiswa, KRS, nilai, dst), bukan data induk kampus.
  @Get('pddikti/prodi')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Menarik daftar program studi dari Web Service Neo Feeder PDDIKTI (Khusus Super Admin)' })
  async pullProdiFromFeeder() {
    return this.integrationSettingsService.pullProdiFromFeeder();
  }

  @Post('pddikti/prodi/sync')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Menyinkronkan hasil tarikan data prodi dari Feeder ke Program Studi lokal (Khusus Super Admin)' })
  async syncProdiFromFeeder(@Body() body: { items: RemoteProdiItem[] }) {
    return this.integrationSettingsService.syncProdiFromFeeder(body?.items || []);
  }

  // Mata kuliah & kurikulum: Pull/Sync di sini cuma menulis ke database lokal (bukan ke
  // Feeder), sama risikonya dengan Pull/Sync Dosen & Mahasiswa -- jadi BAAK & Staff juga
  // boleh, dibedakan dari Push (kalau nanti dibangun) yang menulis ke Feeder sungguhan.
  @Get('pddikti/mata-kuliah')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menarik daftar mata kuliah dari Web Service Neo Feeder PDDIKTI (Super Admin & BAAK)' })
  async pullMataKuliahFromFeeder() {
    return this.integrationSettingsService.pullMataKuliahFromFeeder();
  }

  @Post('pddikti/mata-kuliah/sync')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menyinkronkan hasil tarikan mata kuliah dari Feeder ke data lokal (Super Admin & BAAK)' })
  async syncMataKuliahFromFeeder(@Body() body: { items: RemoteCourseItem[] }) {
    return this.integrationSettingsService.syncMataKuliahFromFeeder(body?.items || []);
  }

  @Get('pddikti/kurikulum')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menarik daftar kurikulum dari Web Service Neo Feeder PDDIKTI (Super Admin & BAAK)' })
  async pullKurikulumFromFeeder() {
    return this.integrationSettingsService.pullKurikulumFromFeeder();
  }

  @Post('pddikti/kurikulum/sync')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menyinkronkan hasil tarikan kurikulum dari Feeder ke data lokal (Super Admin & BAAK)' })
  async syncKurikulumFromFeeder(@Body() body: { items: RemoteCurriculumItem[] }) {
    return this.integrationSettingsService.syncKurikulumFromFeeder(body?.items || []);
  }

  // Tahun akademik/semester: data referensi master -- Pull/Sync cuma menulis lokal, sama
  // kebijakannya dengan Mata Kuliah/Kurikulum/Kelas Kuliah di bawah.
  @Get('pddikti/tahun-akademik')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menarik daftar periode semester dari Web Service Neo Feeder PDDIKTI (Super Admin & BAAK)' })
  async pullTahunAkademikFromFeeder() {
    return this.integrationSettingsService.pullTahunAkademikFromFeeder();
  }

  @Post('pddikti/tahun-akademik/sync')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menyinkronkan hasil tarikan periode semester dari Feeder ke data lokal (Super Admin & BAAK)' })
  async syncTahunAkademikFromFeeder(@Body() body: { items: RemoteAcademicYearItem[] }) {
    return this.integrationSettingsService.syncTahunAkademikFromFeeder(body?.items || []);
  }

  // Kelas perkuliahan & dosen pengampu: sama seperti Mata Kuliah/Kurikulum di atas, Pull/Sync
  // di sini cuma menulis ke database lokal -- Push belum dibangun karena dokumentasi Feeder
  // yang tersedia cuma mendaftar method pengambilan data (Get...), tidak ada Insert/Update
  // untuk kelas_kuliah.
  @Get('pddikti/kelas-kuliah')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menarik daftar kelas perkuliahan & dosen pengampu dari Web Service Neo Feeder PDDIKTI (Super Admin & BAAK)' })
  async pullKelasKuliahFromFeeder() {
    return this.integrationSettingsService.pullKelasKuliahFromFeeder();
  }

  @Post('pddikti/kelas-kuliah/sync')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menyinkronkan hasil tarikan kelas perkuliahan dari Feeder ke data lokal (Super Admin & BAAK)' })
  async syncKelasKuliahFromFeeder(@Body() body: { items: RemoteCourseClassItem[] }) {
    return this.integrationSettingsService.syncKelasKuliahFromFeeder(body?.items || []);
  }

  // Nilai perkuliahan: Feeder cuma mau kasih nilai PER KELAS (GetDetailNilaiPerkuliahanKelas
  // wajib difilter id_kelas_kuliah, versi tanpa filter selalu timeout) -- untuk ~2500 kelas
  // itu ribuan panggilan Feeder terpisah, jadi dijalankan di BACKGROUND (fire-and-forget,
  // status job dipoll via endpoint status), bukan satu request Pull+Sync biasa.
  @Post('pddikti/nilai-perkuliahan/pull-sync/start')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Memulai Pull+Sync Nilai Perkuliahan Semester dari Feeder di background (Super Admin & BAAK)' })
  async startNilaiPerkuliahanSync() {
    return this.integrationSettingsService.startNilaiPerkuliahanSync();
  }

  @Get('pddikti/nilai-perkuliahan/pull-sync/status')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Status job background Pull+Sync Nilai Perkuliahan (Super Admin & BAAK)' })
  async getNilaiPerkuliahanSyncStatus() {
    return this.integrationSettingsService.getNilaiSyncJobStatus();
  }

  // KRS & rencana studi: sama seperti Kelas Kuliah di atas, Pull/Sync cuma menulis lokal --
  // Push belum dibangun (belum ada dokumentasi Insert untuk peserta kelas kuliah).
  @Get('pddikti/krs')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menarik daftar peserta KRS dari Web Service Neo Feeder PDDIKTI (Super Admin & BAAK)' })
  async pullKrsFromFeeder() {
    return this.integrationSettingsService.pullKrsFromFeeder();
  }

  @Post('pddikti/krs/sync')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menyinkronkan hasil tarikan KRS dari Feeder ke data lokal (Super Admin & BAAK)' })
  async syncKrsFromFeeder(@Body() body: { items: RemoteEnrollmentItem[] }) {
    return this.integrationSettingsService.syncKrsFromFeeder(body?.items || []);
  }

  // Skala nilai: cuma Pull (baca Feeder) + "sync" di sini artinya membuat grup skala nilai
  // lokal baru, bukan menulis ke Feeder -- jadi roles-nya sama seperti Pull/Sync lain,
  // bukan dibatasi Super Admin seperti Push.
  @Get('pddikti/skala-nilai')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menarik skala nilai per program studi dari Web Service Neo Feeder PDDIKTI (Super Admin & BAAK)' })
  async pullSkalaNilaiFromFeeder() {
    return this.integrationSettingsService.pullSkalaNilaiFromFeeder();
  }

  @Post('pddikti/skala-nilai/sync')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Membuat grup skala nilai lokal baru dari skala satu program studi hasil tarikan Feeder (Super Admin & BAAK)' })
  async syncSkalaNilaiFromFeeder(@Body() body: { items: RemoteGradeScaleItem[]; label?: string }) {
    return this.integrationSettingsService.syncSkalaNilaiFromFeeder(body?.items || [], body?.label);
  }

  // Push MENULIS ke basis data resmi Dikti (bukan cuma baca seperti Pull/Sync di atas) --
  // dibatasi Super Admin saja, sama kebijakannya dengan Push Mahasiswa.
  @Post('pddikti/mata-kuliah/push')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Push mata kuliah lokal yang belum terdaftar ke Web Service Neo Feeder PDDIKTI (Khusus Super Admin)' })
  async pushMataKuliahBaruToFeeder(@Body() body: { courseIds?: string[] }) {
    return this.integrationSettingsService.pushMataKuliahBaruToFeeder(body?.courseIds);
  }

  @Post('pddikti/kurikulum/push')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Push kurikulum lokal yang belum terdaftar ke Web Service Neo Feeder PDDIKTI (Khusus Super Admin)' })
  async pushKurikulumBaruToFeeder(@Body() body: { curriculumIds?: string[] }) {
    return this.integrationSettingsService.pushKurikulumBaruToFeeder(body?.curriculumIds);
  }

  // Menarik & menyinkronkan data dosen itu biodata/roster personel untuk pelaporan
  // rutin -- bukan membangun struktur organisasi (beda dengan Prodi) -- jadi tetap
  // wewenang operasional BAAK, sama seperti data Mahasiswa.
  @Get('pddikti/dosen')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menarik daftar dosen dari Web Service Neo Feeder PDDIKTI (Super Admin & BAAK)' })
  async pullDosenFromFeeder() {
    return this.integrationSettingsService.pullDosenFromFeeder();
  }

  @Post('pddikti/dosen/sync')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menyinkronkan hasil tarikan data dosen dari Feeder ke data Dosen lokal (Super Admin & BAAK)' })
  async syncDosenFromFeeder(@Body() body: { items: RemoteDosenItem[] }) {
    return this.integrationSettingsService.syncDosenFromFeeder(body?.items || []);
  }

  // Mahasiswa itu data transaksional/roster -- wewenang operasional BAAK, sama seperti Dosen.
  @Get('pddikti/mahasiswa/angkatan')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Daftar tahun angkatan yang tersedia untuk dipilih sebelum Pull Mahasiswa (Super Admin & BAAK)' })
  async getMahasiswaAngkatanOptions() {
    return this.integrationSettingsService.getMahasiswaAngkatanOptions();
  }

  @Get('pddikti/mahasiswa')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menarik daftar mahasiswa dari Web Service Neo Feeder PDDIKTI, opsional difilter tahun angkatan (Super Admin & BAAK)' })
  async pullMahasiswaFromFeeder(@Query('angkatan') angkatan?: string) {
    return this.integrationSettingsService.pullMahasiswaFromFeeder(angkatan);
  }

  @Post('pddikti/mahasiswa/sync')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN_BAAK, UserRole.STAFF)
  @ApiOperation({ summary: 'Menyinkronkan hasil tarikan data mahasiswa dari Feeder ke data Mahasiswa lokal (Super Admin & BAAK)' })
  async syncMahasiswaFromFeeder(@Body() body: { items: RemoteMahasiswaItem[] }) {
    return this.integrationSettingsService.syncMahasiswaFromFeeder(body?.items || []);
  }

  // Push MENULIS ke basis data resmi Dikti (bukan cuma baca seperti Pull/Sync di atas) --
  // dibatasi Super Admin saja, bukan BAAK/Staff, karena salah kirim berarti data salah
  // masuk ke sistem nasional PDDIKTI, bukan cuma database lokal yang gampang diperbaiki.
  @Post('pddikti/mahasiswa/push')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Push mahasiswa aktif lokal yang belum terdaftar ke Web Service Neo Feeder PDDIKTI (Khusus Super Admin)' })
  async pushMahasiswaBaruToFeeder(@Body() body: { studentIds?: string[] }) {
    return this.integrationSettingsService.pushMahasiswaBaruToFeeder(body?.studentIds);
  }
}
