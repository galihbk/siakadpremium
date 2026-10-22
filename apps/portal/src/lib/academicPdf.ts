/**
 * Pembuat PDF dokumen akademik mahasiswa (KHS, Transkrip Nilai Sementara, KRS) langsung dari data --
 * bukan "foto" halaman -- sehingga teksnya bisa diseleksi, ukurannya kecil, dan tata letaknya tidak
 * bergantung pada tampilan layar. KOP mengikuti Profil Institusi; tanda tangan mengikuti Aturan Tanda Tangan.
 */
import { getApiBaseUrl } from '@/lib/api';
import { parseLetterBody } from '@/lib/letterText';

export interface PdfInstitution {
  campusName: string;
  foundationName?: string;
  kopLine1?: string;
  kopLine2?: string;
  kopContact?: string;
  contactAddress?: string;
  contactPhone?: string;
  website?: string;
  logoUrl?: string | null;
  logoInitials?: string;
  doubleBorderKop?: boolean;
}

export interface PdfSemester {
  namaSemester: string;
  tahunAkademik: string;
  ipkKumulatif: number | null;
  sksKumulatif: number;
  nilaiList: Array<{ kode: string; nama: string; sks: number; nilaiHuruf: string; nilaiAngka: number }>;
}

export interface PdfStudent {
  name: string;
  nim: string;
  prodi: string;
  faculty: string;
  advisor: string;
  id?: string | null;
}

interface Signer {
  roleLabel: string;
  name: string | null;
  nip: string | null;
  available: boolean;
}

type Color = [number, number, number];
const W = 210;
const H = 297;
const M = 15;

async function loadImage(url: string): Promise<{ data: string; format: 'PNG' | 'JPEG' | 'WEBP'; w: number; h: number } | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const type = blob.type.toLowerCase();
    const format = type.includes('png') ? 'PNG' : type.includes('webp') ? 'WEBP' : type.includes('jpeg') || type.includes('jpg') ? 'JPEG' : null;
    if (!format) return null; // mis. SVG tidak didukung jsPDF
    const data: string = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(String(fr.result));
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
    const size: { w: number; h: number } = await new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ w: img.naturalWidth || 1, h: img.naturalHeight || 1 });
      img.onerror = () => resolve({ w: 1, h: 1 });
      img.src = data;
    });
    return { data, format, ...size };
  } catch {
    return null;
  }
}

async function loadSigners(documentCode: string, studentId?: string | null): Promise<{ signer1: Signer; signer2: Signer | null } | null> {
  try {
    const params = new URLSearchParams({ documentCode });
    if (studentId) params.set('studentId', studentId);
    const res = await fetch(`${getApiBaseUrl()}/document-signatures/resolve?${params.toString()}`);
    if (!res.ok) return null;
    const j = await res.json();
    const d = j?.data ?? j;
    return d?.signer1 ? { signer1: d.signer1, signer2: d.signer2 ?? null } : null;
  } catch {
    return null;
  }
}

/** KOP surat sesuai Profil Institusi: logo kiri, baris 1-3 di tengah, garis tunggal/ganda. Mengembalikan posisi y berikutnya. */
async function drawKop(doc: any, inst: PdfInstitution): Promise<number> {
  let y = 14;
  const line1 = (inst.kopLine1 || inst.foundationName || '').toUpperCase();
  const line2 = (inst.kopLine2 || inst.campusName || '').toUpperCase();
  const line3 = inst.kopContact || [inst.contactAddress, inst.contactPhone && `Telp. ${inst.contactPhone}`, inst.website].filter(Boolean).join(' | ');
  const LOGO = 21;

  const logo = inst.logoUrl ? await loadImage(inst.logoUrl) : null;
  if (logo) {
    const ratio = logo.w / logo.h;
    const w = ratio >= 1 ? LOGO : LOGO * ratio;
    const h = ratio >= 1 ? LOGO / ratio : LOGO;
    doc.addImage(logo.data, logo.format, M + (LOGO - w) / 2, y + (LOGO - h) / 2, w, h);
  } else {
    doc.setFillColor(30, 58, 138);
    doc.circle(M + LOGO / 2, y + LOGO / 2, LOGO / 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text((inst.logoInitials || '').slice(0, 4), M + LOGO / 2, y + LOGO / 2 + 1.5, { align: 'center' });
  }

  const cx = W / 2;
  const textW = W - 2 * M - 2 * LOGO - 6;
  let ty = y + 3;
  doc.setTextColor(71, 85, 105);
  if (line1) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    const l = doc.splitTextToSize(line1, textW) as string[];
    doc.text(l, cx, ty, { align: 'center' });
    ty += l.length * 4;
  }
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  const l2 = doc.splitTextToSize(line2, textW) as string[];
  doc.text(l2, cx, ty + 1, { align: 'center' });
  ty += l2.length * 6 + 1;
  if (line3) {
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    const l3 = doc.splitTextToSize(line3, textW) as string[];
    doc.text(l3, cx, ty, { align: 'center' });
    ty += l3.length * 3.4;
  }
  y = Math.max(y + LOGO, ty) + 2;

  doc.setDrawColor(15, 23, 42);
  if (inst.doubleBorderKop ?? true) {
    doc.setLineWidth(0.9);
    doc.line(M, y, W - M, y);
    doc.setLineWidth(0.25);
    doc.line(M, y + 1.4, W - M, y + 1.4);
    return y + 7;
  }
  doc.setLineWidth(0.6);
  doc.line(M, y, W - M, y);
  return y + 6;
}

function drawTitle(doc: any, y: number, title: string, subtitle?: string): number {
  const cx = W / 2;
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(title, cx, y, { align: 'center' });
  const tw = doc.getTextWidth(title);
  doc.setLineWidth(0.3);
  doc.line(cx - tw / 2, y + 1, cx + tw / 2, y + 1);
  y += 5.5;
  if (subtitle) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, cx, y, { align: 'center' });
    y += 6;
  } else {
    y += 2;
  }
  return y;
}

function drawIdentity(doc: any, y: number, rows: Array<[string, string, string, string]>): number {
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  const colR = W / 2 + 4;
  for (const [l1, v1, l2, v2] of rows) {
    doc.setFont('helvetica', 'normal');
    doc.text(l1, M, y);
    doc.text(`: ${v1}`.slice(0, 48), M + 30, y);
    doc.text(l2, colR, y);
    doc.text(`: ${v2}`.slice(0, 40), colR + 28, y);
    y += 5;
  }
  return y + 3;
}

/** Tanda tangan sesuai Aturan Tanda Tangan (Super Admin): penandatangan 2 di kiri ("Mengetahui"), penandatangan 1 di kanan. */
async function drawSignatures(doc: any, y: number, documentCode: string, studentId?: string | null): Promise<void> {
  const signers = await loadSigners(documentCode, studentId);
  if (!signers) return;
  if (y > H - 62) {
    doc.addPage();
    y = 18;
  }
  const date = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const BW = 72;
  const drawSigner = (s: Signer, centerX: number, top: number, heading?: string) => {
    let yy = top;
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    if (heading) doc.text(heading, centerX, yy, { align: 'center' });
    yy += 5;
    doc.setFont('helvetica', 'bold');
    const role = doc.splitTextToSize(`${s.roleLabel},`, BW) as string[];
    doc.text(role, centerX, yy, { align: 'center' });
    yy += role.length * 4.2 + 17;
    doc.setFont('helvetica', s.available ? 'bold' : 'italic');
    const c: Color = s.available ? [15, 23, 42] : [148, 163, 184];
    doc.setTextColor(c[0], c[1], c[2]);
    const name = s.name ?? '(belum ditetapkan)';
    doc.text(name, centerX, yy, { align: 'center' });
    if (s.available && s.name) {
      const nw = doc.getTextWidth(name);
      doc.setLineWidth(0.2);
      doc.line(centerX - nw / 2, yy + 0.8, centerX + nw / 2, yy + 0.8);
    }
    if (s.nip) {
      yy += 4.2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(`NIP/NIDN. ${s.nip}`, centerX, yy, { align: 'center' });
    }
  };
  const rightX = W - M - BW / 2;
  const leftX = M + BW / 2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(date, rightX, y, { align: 'center' });
  drawSigner(signers.signer1, rightX, y + 1);
  if (signers.signer2) drawSigner(signers.signer2, leftX, y + 1, 'Mengetahui,');
}

function drawPageNumbers(doc: any) {
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Halaman ${i} dari ${pages}`, W / 2, H - 8, { align: 'center' });
  }
}

function tableBase() {
  return {
    margin: { left: M, right: M },
    theme: 'grid' as const,
    styles: { fontSize: 8.5, cellPadding: 1.6, lineColor: [148, 163, 184] as Color, lineWidth: 0.2, textColor: [15, 23, 42] as Color },
    headStyles: { fillColor: [241, 245, 249] as Color, textColor: [15, 23, 42] as Color, halign: 'center' as const, fontStyle: 'bold' as const },
    footStyles: { fillColor: [248, 250, 252] as Color, textColor: [15, 23, 42] as Color, fontStyle: 'bold' as const, halign: 'center' as const },
  };
}

const GRADE_COLUMNS = {
  0: { halign: 'center' as const, cellWidth: 9 },
  1: { cellWidth: 26, font: 'courier' },
  2: { cellWidth: 'auto' as const },
  3: { halign: 'center' as const, cellWidth: 12 },
  4: { halign: 'center' as const, cellWidth: 14, fontStyle: 'bold' as const },
  5: { halign: 'center' as const, cellWidth: 14 },
  6: { halign: 'center' as const, cellWidth: 16 },
};

// ======================================================================================
// KHS & Transkrip Nilai Sementara
// ======================================================================================
export async function downloadAcademicPdf(args: {
  kind: 'khs' | 'transcript';
  inst: PdfInstitution;
  student: PdfStudent;
  semesters: PdfSemester[];
  /** Hanya untuk KHS: IPS semester yang ditampilkan. */
  ips?: string;
  filename: string;
}): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const { kind, inst, student, semesters } = args;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = await drawKop(doc, inst);

  y = drawTitle(
    doc,
    y,
    kind === 'khs' ? 'KARTU HASIL STUDI (KHS)' : 'TRANSKRIP NILAI SEMENTARA',
    kind === 'khs' && semesters[0] ? `${semesters[0].namaSemester}  -  ${semesters[0].tahunAkademik}` : undefined,
  );

  const latest = semesters[semesters.length - 1];
  const ipk = latest?.ipkKumulatif != null ? latest.ipkKumulatif.toFixed(2) : '-';
  y = drawIdentity(doc, y, [
    ['Nama Mahasiswa', student.name, 'Program Studi', student.prodi],
    ['NIM', student.nim, 'Fakultas', student.faculty],
    ['Dosen PA', student.advisor, kind === 'khs' ? 'IPS / IPK' : 'IPK / Total SKS', kind === 'khs' ? `${args.ips ?? '-'} / ${ipk}` : `${ipk} / ${latest?.sksKumulatif ?? 0}`],
  ]);

  const head = [['No', 'Kode', 'Mata Kuliah', 'SKS', 'Huruf', 'Mutu', 'Bobot']];
  const toRow = (n: PdfSemester['nilaiList'][number], i: number) => [String(i + 1), n.kode, n.nama, String(n.sks), n.nilaiHuruf, n.nilaiAngka.toFixed(2), (n.sks * n.nilaiAngka).toFixed(2)];

  if (kind === 'transcript') {
    // Satu daftar menyeluruh (tanpa pemisah semester), nomor berlanjut, total & IPK di akhir
    const all = semesters.flatMap((sm) => sm.nilaiList);
    const totalSks = all.reduce((a, n) => a + n.sks, 0);
    const totalBobot = all.reduce((a, n) => a + n.sks * n.nilaiAngka, 0);
    autoTable(doc, {
      ...tableBase(),
      startY: y,
      head,
      body: all.map(toRow),
      foot: [
        [
          { content: 'Total SKS / Bobot', colSpan: 3, styles: { halign: 'right' } },
          String(totalSks),
          { content: `IPK ${latest?.ipkKumulatif != null ? latest.ipkKumulatif.toFixed(2) : totalSks ? (totalBobot / totalSks).toFixed(2) : '-'}`, colSpan: 2 },
          totalBobot.toFixed(2),
        ],
      ],
      columnStyles: GRADE_COLUMNS,
      showFoot: 'lastPage',
    });
    y = ((doc as any).lastAutoTable?.finalY ?? y) + 5;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Transkrip nilai sementara ini bukan pengganti transkrip resmi yang diterbitkan saat kelulusan.', M, y);
    y += 8;
  } else {
    for (const sm of semesters) {
      const sks = sm.nilaiList.reduce((a, n) => a + n.sks, 0);
      const bobot = sm.nilaiList.reduce((a, n) => a + n.sks * n.nilaiAngka, 0);
      autoTable(doc, {
        ...tableBase(),
        startY: y,
        head,
        body: sm.nilaiList.map(toRow),
        foot: [[{ content: 'Jumlah / IPS', colSpan: 3, styles: { halign: 'right' } }, String(sks), { content: sks ? (bobot / sks).toFixed(2) : '-', colSpan: 2 }, bobot.toFixed(2)]],
        columnStyles: GRADE_COLUMNS,
      });
      y = ((doc as any).lastAutoTable?.finalY ?? y) + 6;
    }
  }

  await drawSignatures(doc, y, kind === 'khs' ? 'KHS' : 'TRANSKRIP', student.id);
  drawPageNumbers(doc);
  doc.save(args.filename);
}

// ======================================================================================
// KRS
// ======================================================================================
export interface PdfKrsCourse {
  kode: string;
  nama: string;
  kelas: string;
  sks: number;
  jadwal: string;
  ruang: string;
  dosen: string;
}

export async function downloadKrsPdf(args: {
  inst: PdfInstitution;
  student: PdfStudent & { currentSemester?: number };
  /** Mis. "Semester Gasal 2026/2027" */
  periodLabel: string;
  statusLabel: string;
  courses: PdfKrsCourse[];
  filename: string;
}): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const { inst, student, courses } = args;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = await drawKop(doc, inst);
  y = drawTitle(doc, y, 'KARTU RENCANA STUDI (KRS)', args.periodLabel);

  const totalSks = courses.reduce((a, c) => a + c.sks, 0);
  y = drawIdentity(doc, y, [
    ['Nama Mahasiswa', student.name, 'Program Studi', student.prodi],
    ['NIM', student.nim, 'Fakultas', student.faculty],
    ['Dosen PA', student.advisor, 'Status KRS', args.statusLabel],
  ]);

  autoTable(doc, {
    ...tableBase(),
    startY: y,
    head: [['No', 'Kode', 'Mata Kuliah', 'Kelas', 'SKS', 'Jadwal', 'Ruang', 'Dosen Pengampu']],
    body: courses.map((c, i) => [String(i + 1), c.kode, c.nama, c.kelas, String(c.sks), c.jadwal, c.ruang, c.dosen]),
    foot: [[{ content: 'Total SKS', colSpan: 4, styles: { halign: 'right' } }, String(totalSks), { content: '', colSpan: 3 }]],
    styles: { ...tableBase().styles, fontSize: 8 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 21, font: 'courier' },
      2: { cellWidth: 'auto' },
      3: { halign: 'center', cellWidth: 14 },
      4: { halign: 'center', cellWidth: 10 },
      5: { cellWidth: 30 },
      6: { cellWidth: 16 },
      7: { cellWidth: 32 },
    },
    showFoot: 'lastPage',
  });
  y = ((doc as any).lastAutoTable?.finalY ?? y) + 8;

  await drawSignatures(doc, y, 'KRS', student.id);
  drawPageNumbers(doc);
  doc.save(args.filename);
}

// ======================================================================================
// Berita Acara Ujian (UTS/UAS) per kelas + lampiran Daftar Hadir
// ======================================================================================
export async function downloadExamBeritaAcaraPdf(args: {
  inst: PdfInstitution;
  typeLabel: string;
  yearName: string;
  courseCode: string;
  courseName: string;
  className: string;
  lecturerName?: string | null;
  dateLabel: string;
  timeLabel: string;
  roomName: string;
  proctor1?: string | null;
  proctor2?: string | null;
  participants: Array<{ seatNo: number | null; nim: string; name: string }>;
  filename: string;
}): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;
  const { inst, participants } = args;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = await drawKop(doc, inst);
  y = drawTitle(doc, y, `BERITA ACARA PELAKSANAAN ${args.typeLabel.toUpperCase()}`, `Tahun Akademik ${args.yearName}`);

  // Satu kolom agar nama mata kuliah yang panjang tidak bertabrakan dengan kolom lain
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  const idRows: Array<[string, string]> = [
    ['Mata Kuliah', `${args.courseCode} - ${args.courseName}`],
    ['Kelas', args.className],
    ['Dosen Pengampu', args.lecturerName || '-'],
    ['Hari / Tanggal', args.dateLabel],
    ['Waktu', args.timeLabel],
    ['Ruang', args.roomName],
    ['Peserta Terdaftar', `${participants.length} mahasiswa`],
  ];
  for (const [k, v] of idRows) {
    doc.setFont('helvetica', 'normal');
    doc.text(k, M, y);
    doc.setFont('helvetica', 'bold');
    const lines = doc.splitTextToSize(`: ${v}`, W - 2 * M - 40) as string[];
    doc.text(lines, M + 40, y);
    y += lines.length * 5;
  }
  y += 3;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  const intro = doc.splitTextToSize(
    `Pada hari ini telah dilaksanakan ${args.typeLabel} pada mata kuliah dan kelas tersebut di atas dengan keterangan sebagai berikut:`,
    W - 2 * M,
  ) as string[];
  doc.text(intro, M, y);
  y += intro.length * 5 + 2;

  const fields: Array<[string, string]> = [
    ['Jumlah peserta hadir', '............ mahasiswa'],
    ['Jumlah peserta tidak hadir', '............ mahasiswa'],
    ['No. kursi peserta tidak hadir', '.............................................................................'],
    ['Ujian dimulai pukul', '............ WIB'],
    ['Ujian selesai pukul', '............ WIB'],
  ];
  for (const [k, v] of fields) {
    doc.text(k, M, y);
    doc.text(`: ${v}`, M + 56, y);
    y += 6.5;
  }

  y += 2;
  doc.text('Catatan kejadian selama ujian:', M, y);
  y += 2;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.25);
  doc.rect(M, y, W - 2 * M, 38);
  y += 38 + 8;

  doc.text('Demikian berita acara ini dibuat dengan sebenarnya.', M, y);
  y += 8;

  // Tanda tangan: Pengawas 1, Pengawas 2, dan Mengetahui
  const colW = (W - 2 * M) / 3;
  const sign = (i: number, title: string, name?: string | null) => {
    const cx = M + colW * i + colW / 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.text(title, cx, y, { align: 'center' });
    const line = name || '';
    doc.setFont('helvetica', 'bold');
    doc.text(line, cx, y + 26, { align: 'center' });
    doc.setLineWidth(0.25);
    doc.line(cx - 28, y + 27, cx + 28, y + 27);
  };
  sign(0, 'Pengawas 1', args.proctor1);
  sign(1, 'Pengawas 2', args.proctor2);
  sign(2, 'Mengetahui, BAAK / Kaprodi');

  // Lampiran: Daftar Hadir
  doc.addPage();
  let y2 = await drawKop(doc, inst);
  y2 = drawTitle(doc, y2, `LAMPIRAN - DAFTAR HADIR ${args.typeLabel.toUpperCase()}`, `${args.courseCode} ${args.courseName} - Kelas ${args.className}`);
  y2 = drawIdentity(doc, y2, [['Hari / Tanggal', args.dateLabel, 'Ruang', args.roomName]]);
  autoTable(doc, {
    ...tableBase(),
    startY: y2,
    head: [['Kursi', 'NIM', 'Nama Mahasiswa', 'Tanda Tangan']],
    body: participants.map((p, i) => [String(p.seatNo ?? i + 1), p.nim, p.name, '']),
    styles: { ...tableBase().styles, fontSize: 8.5, minCellHeight: 8 },
    columnStyles: {
      0: { halign: 'center', cellWidth: 14 },
      1: { cellWidth: 30, font: 'courier' },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 48 },
    },
  });
  drawPageNumbers(doc);
  doc.save(args.filename);
}

// ======================================================================================
// Surat resmi mahasiswa (SKAK, izin penelitian, dll)
// ======================================================================================
export async function downloadLetterPdf(args: {
  inst: PdfInstitution;
  unitName: string;
  title: string;
  letterNo: string;
  body: string;
  placeDate: string;
  signer: { roleLabel: string; name: string };
  coSigner?: { roleLabel: string; name: string | null } | null;
  requestNo: string;
  filename: string;
}): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { inst } = args;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = await drawKop(doc, inst);

  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text(args.unitName.toUpperCase(), W / 2, y, { align: 'center' });
  y += 8;
  y = drawTitle(doc, y, args.title.toUpperCase(), undefined);
  doc.setFont('courier', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text(`Nomor: ${args.letterNo}`, W / 2, y - 3, { align: 'center' });
  y += 4;

  const textW = W - 2 * M;
  const ensure = (need: number) => {
    if (y + need > H - 20) {
      doc.addPage();
      y = 22;
    }
  };
  doc.setTextColor(15, 23, 42);
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  for (const b of parseLetterBody(args.body, inst.campusName)) {
    if (b.type === 'space') {
      y += 3;
    } else if (b.type === 'p') {
      const lines = doc.splitTextToSize(b.text, textW) as string[];
      ensure(lines.length * 5.6);
      doc.text(lines, M, y, { align: 'justify', maxWidth: textW });
      y += lines.length * 5.6;
    } else {
      ensure(b.rows.length * 6);
      for (const [k, v] of b.rows) {
        doc.setFont('times', 'normal');
        doc.text(k, M + 8, y);
        doc.text(':', M + 8 + 36, y);
        doc.setFont('times', 'bold');
        const vl = doc.splitTextToSize(v, textW - 8 - 40) as string[];
        doc.text(vl, M + 8 + 40, y);
        y += vl.length * 5.6;
      }
      doc.setFont('times', 'normal');
    }
  }

  // Tanda tangan
  y += 10;
  ensure(58);
  const rightX = W - M - 38;
  doc.setFont('times', 'normal');
  doc.text(args.placeDate, rightX, y, { align: 'center' });
  doc.setFont('times', 'bold');
  doc.text(`${args.signer.roleLabel},`, rightX, y + 5.5, { align: 'center' });
  if (args.signer.name) {
    doc.text(args.signer.name, rightX, y + 30, { align: 'center' });
    const nameW = doc.getTextWidth(args.signer.name);
    doc.setLineWidth(0.25);
    doc.line(rightX - nameW / 2, y + 31, rightX + nameW / 2, y + 31);
  }

  if (args.coSigner) {
    const leftX = M + 32;
    doc.setFont('times', 'normal');
    doc.text('Mengetahui,', leftX, y + 5.5, { align: 'center' });
    doc.setFont('times', 'bold');
    doc.text(`${args.coSigner.roleLabel},`, leftX, y + 11, { align: 'center' });
    if (args.coSigner.name) doc.text(args.coSigner.name, leftX, y + 30, { align: 'center' });
  }

  // Keterangan validasi
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Dokumen resmi ${args.unitName}. Nomor tiket pengajuan: ${args.requestNo}`, M, H - 12);
  drawPageNumbers(doc);
  doc.save(args.filename);
}
