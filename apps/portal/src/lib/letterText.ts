export const IDENTITY_KEYS = ['Nama', 'NIM', 'Program Studi', 'Fakultas'];

/**
 * Surat yang terbit sebelum format baru menyimpan identitas dalam satu kalimat panjang. Pola itu dikenali di sini dan
 * ditata ulang (surat lain dibiarkan apa adanya); nama institusi lama diganti nama institusi saat ini bila diberikan.
 */
const LEGACY =
  /^Yang bertanda tangan di bawah ini, [^,]+, menerangkan dengan sebenarnya bahwa mahasiswa atas nama (.+?) \(NIM: ([^)]+)\), Program Studi (.+?), (.+?), Semester (\d+) Tahun Akademik ([^,]+), adalah benar mahasiswa terdaftar aktif di lingkungan ([^.\n]+)\./;

export function upgradeLegacy(text: string, campusName?: string): string {
  const m = text.match(LEGACY);
  if (!m) return text;
  const [whole, name, nim, prodi, faculty, semester, year, oldCampus] = m;
  const campus = (campusName || oldCampus).trim();
  const upgraded =
    'Yang bertanda tangan di bawah ini, menerangkan dengan sebenarnya bahwa mahasiswa:\n\n' +
    `Nama: ${name}\nNIM: ${nim}\nProgram Studi: ${prodi}\nFakultas: ${faculty}\n\n` +
    `adalah benar mahasiswa terdaftar aktif pada Semester ${semester} Tahun Akademik ${year} di lingkungan ${campus}.`;
  return text.replace(whole, upgraded);
}


export type LetterBlock = { type: 'p'; text: string } | { type: 'id'; rows: Array<[string, string]> } | { type: 'space' };

/** Memecah isi surat menjadi paragraf, tabel identitas (Nama/NIM/Program Studi/Fakultas), dan jeda. */
export function parseLetterBody(text: string, campusName?: string): LetterBlock[] {
  const lines = upgradeLegacy(text, campusName).split(/\r?\n/);
  const blocks: LetterBlock[] = [];
  let rows: Array<[string, string]> = [];
  const flush = () => {
    if (rows.length) blocks.push({ type: 'id', rows });
    rows = [];
  };
  lines.forEach((line, i) => {
    const m = line.match(/^([A-Za-z ]+):\s*(.+)$/);
    if (m && IDENTITY_KEYS.includes(m[1].trim())) {
      rows.push([m[1].trim(), m[2].trim()]);
      return;
    }
    flush();
    if (line.trim() === '') {
      if (blocks.length && i < lines.length - 1) blocks.push({ type: 'space' });
    } else {
      blocks.push({ type: 'p', text: line });
    }
  });
  flush();
  return blocks;
}
