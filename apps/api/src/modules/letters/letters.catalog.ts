// Katalog resmi jenis Layanan Surat Mahasiswa. Sumber tunggal untuk backend —
// nama & aturan verifikasi TIDAK dipercaya dari input klien, selalu diturunkan
// dari kode (typeCode) yang dikirim mahasiswa.
export interface LetterCatalogEntry {
  code: string;
  name: string;
  // true: harus diverifikasi Dosen Pembimbing Akademik dulu sebelum masuk antrian BAAK.
  // false: langsung ke tahap BAAK (baik diterbitkan otomatis maupun diproses manual),
  // karena kelayakannya bukan wewenang dosen PA (mis. status pembayaran, data perpustakaan).
  requiresAdvisorApproval: boolean;
  // true: sistem mencoba menerbitkan otomatis saat syarat administratif terpenuhi.
  // Kalau tidak terpenuhi, permohonan tetap dibuat tapi jatuh ke antrian manual BAAK
  // dengan catatan alasannya — tidak pernah ditolak otomatis begitu saja.
  autoIssueEligible: boolean;
  numberPrefix: string;
}

export const LETTER_CATALOG: Record<string, LetterCatalogEntry> = {
  SKAK: {
    code: 'SKAK',
    name: 'Surat Keterangan Aktif Kuliah (SKAK)',
    requiresAdvisorApproval: false,
    autoIssueEligible: true,
    numberPrefix: '421.4',
  },
  SKP: {
    code: 'SKP',
    name: 'Surat Pengantar Kerja Praktik (KP) / Magang',
    requiresAdvisorApproval: true,
    autoIssueEligible: false,
    numberPrefix: '422.1',
  },
  SIP: {
    code: 'SIP',
    name: 'Surat Izin Penelitian / Pengambilan Data',
    requiresAdvisorApproval: true,
    autoIssueEligible: false,
    numberPrefix: '423.5',
  },
  SRB: {
    code: 'SRB',
    name: 'Surat Rekomendasi Beasiswa & Kompetisi',
    requiresAdvisorApproval: true,
    autoIssueEligible: false,
    numberPrefix: '424.2',
  },
  SKBB: {
    code: 'SKBB',
    name: 'Surat Keterangan Berkelakuan Baik (SKBB)',
    requiresAdvisorApproval: true,
    autoIssueEligible: false,
    numberPrefix: '425.1',
  },
  SKBP: {
    code: 'SKBP',
    name: 'Surat Keterangan Bebas Perpustakaan & Lab',
    // Bukan wewenang dosen PA — data pinjaman perpustakaan/lab diverifikasi BAAK.
    requiresAdvisorApproval: false,
    autoIssueEligible: false,
    numberPrefix: '426.3',
  },
};

export const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
