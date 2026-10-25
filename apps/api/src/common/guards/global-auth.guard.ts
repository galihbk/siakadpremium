import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface PublicRule {
  methods: Method[] | '*';
  path: RegExp;
}

/**
 * Daftar SATU-SATUNYA endpoint yang boleh diakses tanpa login. Semua yang lain wajib membawa
 * token JWT yang valid. Tambah ke sini hanya bila memang untuk publik (situs publik, login, pendaftar PMB).
 */
const PUBLIC_RULES: PublicRule[] = [
  { methods: ['GET'], path: /^\/(health)?$/ },
  // Validasi dokumen lewat QR (data minimum, tanpa login)
  { methods: ['GET'], path: /^\/verify$/ },
  { methods: ['GET'], path: /^\/app-config$/ },
  { methods: ['POST'], path: /^\/auth\/login$/ },

  // Situs publik (web, p2m, p3m)
  { methods: ['GET'], path: /^\/landing-page$/ },
  { methods: ['GET'], path: /^\/landing-page\/articles$/ },
  { methods: ['GET'], path: /^\/landing-page\/articles\/slug\/[^/]+$/ },
  { methods: ['GET'], path: /^\/faculties(\/[^/]+)?$/ },
  { methods: ['GET'], path: /^\/study-programs(\/[^/]+)?$/ },
  { methods: ['GET'], path: /^\/academic\/calendar-events$/ },
  { methods: ['GET'], path: /^\/academic\/courses$/ },
  { methods: ['POST'], path: /^\/analytics\/track$/ },
  { methods: ['GET'], path: /^\/(p2m|lp3m)\/public\/landing$/ },
  { methods: ['POST'], path: /^\/(p2m|lp3m)\/documents\/[^/]+\/download$/ },

  // Integrasi sistem OBE: server-ke-server, dijaga API key (OBE_API_KEY) oleh ObeApiKeyGuard di controller-nya,
  // bukan JWT pengguna. Hanya baca (GET).
  { methods: ['GET'], path: /^\/integrations\/obe\/[a-z-]+$/ },

  // Berkas privat: diakses lewat URL bertanda tangan (HMAC) yang diperiksa di controller-nya
  { methods: ['GET'], path: /^\/storage\/private$/ },

  // PMB: pendaftaran, login, dan opsi formulir terbuka. Data/aksi pendaftar (me, draft, submit, bayar)
  // memakai JWT pendaftar (peran PMB_APPLICANT) -- lihat ROLE_RULES.
  { methods: '*', path: /^\/admissions\/pmb\/(register|login|options|schools)$/ },
  { methods: ['POST'], path: /^\/admissions\/pmb\/chat\/visitor\/start$/ },
  { methods: ['GET'], path: /^\/admissions\/pmb\/chat\/status$/ },
  { methods: ['POST'], path: /^\/admissions\/(register|resend-verification|login|forgot-password|reset-password)$/ },
  { methods: ['POST'], path: /^\/auth\/(forgot-password|reset-password)$/ },
  { methods: ['GET'], path: /^\/admissions\/(verify-email|batches|status\/[^/]+)$/ },
];

interface RoleRule {
  /** Batasi hanya metode ini; kosong = semua metode. */
  methods?: Method[];
  path: RegExp;
  roles: string[];
  /** Jalur yang dikecualikan dari aturan ini (cukup login). */
  except?: RegExp;
}

const PMB_STAFF = ['ADMIN_PMB', 'ADMIN_BAAK', 'STAFF'];
const BAAK = ['ADMIN_BAAK', 'STAFF'];
const WRITE: Method[] = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Pembatasan peran tambahan di atas "wajib login". SUPER_ADMIN selalu lolos.
 * ATURAN PERTAMA YANG COCOK (jalur + metode) YANG MENENTUKAN -- letakkan yang spesifik sebelum yang umum.
 * Endpoint yang tidak cocok aturan apa pun cukup login; kepemilikan data ("data milik sendiri")
 * ditangani di controller/service endpoint itu (identitas selalu dari token).
 */
const ROLE_RULES: RoleRule[] = [
  // ---- hanya Super Admin
  { path: /^\/users(\/|$)/, roles: [] },
  { path: /^\/document-signatures\/(rules|roles)/, roles: [] },
  { path: /^\/academic\/superadmin-dashboard$/, roles: [] },
  { methods: WRITE, path: /^\/(faculties|study-programs)(\/|$)/, roles: [] },
  { methods: WRITE, path: /^\/landing-page$/, roles: [] },
  { methods: WRITE, path: /^\/academic\/calendar-events(\/|$)/, roles: [] },

  // ---- SDM
  // Direktori ringkas pegawai (nama, kontak, unit) untuk pilihan penanggung jawab/pengawas -- tanpa data sensitif
  { methods: ['GET'], path: /^\/employees\/directory$/, roles: [...BAAK, 'SDM'] },
  { path: /^\/employees(\/|$)/, roles: ['SDM'] },
  { path: /^\/shifts(\/|$)/, roles: ['SDM'] },
  { path: /^\/attendance\/(import|recap|recap-tahunan)$/, roles: ['SDM'] },
  { path: /^\/lecturers\/(employment-status|[^/]+\/employment-status)$/, roles: ['SDM'] },

  // ---- Keuangan (mahasiswa hanya: tagihan miliknya & kirim bukti bayar -- kepemilikan dicek di controller)
  { path: /^\/finance\/payment-mode$/, roles: ['STUDENT', 'ADMIN_KEUANGAN'] },
  { path: /^\/finance\/invoices\/student\/[^/]+$/, roles: ['STUDENT', 'ADMIN_KEUANGAN'] },
  { methods: ['POST'], path: /^\/finance\/transactions\/[^/]+\/submit-payment$/, roles: ['STUDENT', 'ADMIN_KEUANGAN'] },
  { path: /^\/finance(\/|$)/, roles: ['ADMIN_KEUANGAN'] },

  // ---- PMB, LP3M, P2M
  { path: /^\/admissions\/pmb\/(chat|chat\/read)$/, roles: ['PMB_APPLICANT', 'PMB_VISITOR'] },
  { path: /^\/admissions\/pmb\/(me|draft|submit|origin-universities|origin-study-programs|payments\/[^/]+\/pay)$/, roles: ['PMB_APPLICANT'] },
  { path: /^\/admissions\/admin\/pmb\/chat(\/|$)/, roles: ['ADMIN_PMB', 'ADMIN_BAAK', 'STAFF'] },
  { methods: ['POST'], path: /^\/admissions\/admin\/pmb\/applications$/, roles: ['ADMIN_PMB', 'ADMIN_BAAK', 'STAFF'] },
  { path: /^\/admissions\/admin\//, roles: ['ADMIN_PMB', 'ADMIN_BAAK', 'ADMIN_KEUANGAN', 'STAFF'] },
  { path: /^\/admissions(\/|$)/, roles: PMB_STAFF },
  { path: /^\/lp3m(\/|$)/, roles: ['LP3M', 'ADMIN_LP3M', 'LECTURER'] },
  { path: /^\/p2m(\/|$)/, roles: ['P2M', 'ADMIN_P2M'] },

  // ---- Akademik (BAAK)
  { path: /^\/academic\/admin-dashboard$/, roles: BAAK },
  { path: /^\/academic\/(krs-overview|attendance-overview|feeder-entities)(\/|$)/, roles: BAAK },
  { path: /^\/academic\/grades\/(summary|lock)$/, roles: BAAK },
  { path: /^\/academic\/assessment-schemes(\/|$)/, roles: BAAK },
  { path: /^\/academic\/grades(\/|$)/, roles: [...BAAK, 'LECTURER'] },
  { methods: WRITE, path: /^\/academic\/(courses|curriculums)(\/|$)/, roles: [...BAAK, 'ADMIN_PRODI'] },
  { methods: WRITE, path: /^\/academic\/(years|schedules|grade-scale|thesis-supervisions)(\/|$)/, roles: BAAK },
  { methods: WRITE, path: /^\/buildings(\/|$)/, roles: BAAK },

  // ---- Mahasiswa (data milik sendiri) & data induk mahasiswa
  { path: /^\/students\/(dashboard|krs|schedule|attendance|khs)$/, roles: ['STUDENT'] },
  { path: /^\/students\/(list|advisor-counts)$/, roles: [...BAAK, 'ADMIN_KEUANGAN', 'ADMIN_PRODI'] },
  { path: /^\/students(\/[^/]+)?$/, roles: [...BAAK, 'ADMIN_PRODI'] },

  // ---- Dosen
  { path: /^\/lecturers\/(dashboard|schedules|academic-years|classes|advisees|p3m)(\/|$)/, roles: ['LECTURER'] },
  { methods: WRITE, path: /^\/lecturers(\/|$)/, roles: [...BAAK, 'SDM'] },

  // ---- Surat
  { path: /^\/letters\/advisor\//, roles: ['LECTURER'] },
  { methods: ['POST'], path: /^\/letters\/[^/]+\/(advisor-approve|advisor-reject)$/, roles: ['LECTURER'] },
  { methods: ['POST'], path: /^\/letters\/[^/]+\/(issue|reject)$/, roles: BAAK },
  { methods: ['GET'], path: /^\/letters(\/pending-count)?$/, roles: BAAK },
];

@Injectable()
export class GlobalAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;
    const req = context.switchToHttp().getRequest();
    const method = String(req.method).toUpperCase() as Method;
    if ((method as string) === 'OPTIONS' || (method as string) === 'HEAD') return true;

    const path = this.normalize(req.originalUrl || req.url || '/');

    // Token (bila ada) selalu diperiksa agar req.user tersedia bagi controller.
    const header: string | undefined = req.headers?.authorization;
    let payload: any = null;
    if (header?.startsWith('Bearer ')) {
      try {
        payload = this.jwt.verify(header.slice(7));
        req.user = payload;
      } catch {
        payload = null;
      }
    }

    const isPublic = PUBLIC_RULES.some((r) => (r.methods === '*' || r.methods.includes(method)) && r.path.test(path));
    if (isPublic) return true;

    if (!payload) {
      throw new UnauthorizedException('Anda harus login untuk mengakses sumber daya ini.');
    }

    // Token pengunjung (tamu) hanya berlaku untuk live chat -- tidak untuk data pendaftar maupun sistem lain.
    if (payload.role === 'PMB_VISITOR' && !/^\/admissions\/pmb\/chat(\/read)?$/.test(path)) {
      throw new ForbiddenException('Token tamu hanya berlaku untuk live chat PMB.');
    }

    // Token pendaftar PMB hanya berlaku untuk jalur pendaftar -- tidak boleh menjangkau data sistem lain.
    if (payload.role === 'PMB_APPLICANT' && !/^\/admissions\/pmb\//.test(path)) {
      throw new ForbiddenException('Akun pendaftar hanya dapat mengakses layanan pendaftaran PMB.');
    }

    for (const rule of ROLE_RULES) {
      if (rule.methods && !rule.methods.includes(method)) continue;
      if (!rule.path.test(path)) continue;
      if (rule.except && rule.except.test(path)) continue;
      if (payload.role === 'SUPER_ADMIN' || rule.roles.includes(payload.role)) break;
      throw new ForbiddenException('Akses ditolak: peran Anda tidak diizinkan untuk sumber daya ini.');
    }
    return true;
  }

  /** `/api/v1/foo/bar?x=1` -> `/foo/bar` */
  private normalize(url: string): string {
    const noQuery = url.split('?')[0];
    const stripped = noQuery.replace(/^\/api\/v1/, '');
    const p = stripped.length > 1 ? stripped.replace(/\/+$/, '') : stripped;
    return p || '/';
  }
}
