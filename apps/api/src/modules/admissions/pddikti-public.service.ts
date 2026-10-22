import { Injectable, Logger } from '@nestjs/common';

const BASE_URL = 'https://pddikti.kemdiktisaintek.go.id';
const HEADERS: Record<string, string> = {
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
  Origin: BASE_URL,
  Referer: `${BASE_URL}/`,
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
};

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // data perguruan tinggi/prodi jarang berubah
const TIMEOUT_MS = 10000;
/** Batas upstream 60 permintaan/menit; kita pakai 40 agar ada sisa untuk lonjakan. */
const MAX_CALLS_PER_MINUTE = 40;
/** Upstream mengembalikan sampel ACAK maksimal 100 baris per panggilan, jadi daftar prodi digabung dari beberapa panggilan. */
const PRODI_SAMPLES = 3;
/** Jumlah sampel maksimal untuk pencarian perguruan tinggi. */
const SEARCH_SAMPLES = 3;

export interface OriginUniversity {
  id: string; // kode perguruan tinggi (6 digit), sama dengan kode_perguruan_tinggi di Neo Feeder
  code: string;
  name: string;
  shortName: string;
  source: 'PDDIKTI';
}

export interface OriginProgram {
  id: string;
  name: string;
  jenjang: string;
  label: string;
  /** ID program studi di Feeder; PDDIKTI tidak memilikinya, jadi kosong (dicari lewat nama saat sinkronisasi). */
  feederId: string | null;
}

export type OriginStatus = 'OK' | 'UNAVAILABLE';

const norm = (v: unknown) =>
  String(v ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/**
 * Pencarian perguruan tinggi dan program studi asal lewat API publik PDDIKTI (endpoint pencarian situs pddikti.kemdiktisaintek.go.id,
 * sama dengan yang dipakai PDDIKTI-API-Wrapper). Endpoint ini TIDAK resmi: dibatasi laju, hasilnya sampel acak, dan bisa berubah atau
 * diblokir sewaktu-waktu. Karena itu semua hasil di-cache 24 jam, panggilan sama digabung, dan jumlah panggilan dibatasi.
 */
@Injectable()
export class PddiktiPublicService {
  private readonly log = new Logger('PddiktiPublic');
  private readonly cache = new Map<string, { data: unknown; expiresAt: number }>();
  private readonly inflight = new Map<string, Promise<unknown>>();
  private calls: number[] = [];

  private cached<T>(key: string): T | null {
    const hit = this.cache.get(key);
    return hit && hit.expiresAt > Date.now() ? (hit.data as T) : null;
  }

  private remember(key: string, data: unknown) {
    if (this.cache.size > 2000) this.cache.clear();
    this.cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  }

  private allowCall(): boolean {
    const now = Date.now();
    this.calls = this.calls.filter((t) => now - t < 60000);
    if (this.calls.length >= MAX_CALLS_PER_MINUTE) return false;
    this.calls.push(now);
    return true;
  }

  /** Satu panggilan ke upstream; null bila gagal/ditolak/melebihi batas. Panggilan identik yang sedang berjalan digabung. */
  private async rawSearch(term: string): Promise<{ pt: any[]; prodi: any[] } | null> {
    const key = `raw:${norm(term)}:${Math.floor(Date.now() / 1000)}`;
    const running = this.inflight.get(key);
    if (running) return running as Promise<{ pt: any[]; prodi: any[] } | null>;

    const job = (async () => {
      if (!this.allowCall()) {
        this.log.warn(`Batas ${MAX_CALLS_PER_MINUTE} panggilan/menit ke PDDIKTI tercapai; pencarian "${term}" ditunda.`);
        return null;
      }
      const started = Date.now();
      try {
        const res = await fetch(`${BASE_URL}/api/pencarian/enc/all/${encodeURIComponent(term)}`, {
          headers: HEADERS,
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (!res.ok) {
          this.log.warn(`PDDIKTI membalas HTTP ${res.status} untuk "${term}" (${Date.now() - started} ms).`);
          return null;
        }
        const json: any = await res.json();
        const data = json?.data ?? {};
        return { pt: Array.isArray(data.pt) ? data.pt : [], prodi: Array.isArray(data.prodi) ? data.prodi : [] };
      } catch (err: any) {
        this.log.warn(`PDDIKTI gagal untuk "${term}" setelah ${Date.now() - started} ms: ${err?.message || err}`);
        return null;
      }
    })();
    this.inflight.set(key, job);
    try {
      return await job;
    } finally {
      this.inflight.delete(key);
    }
  }

  /** Cari perguruan tinggi berdasarkan nama/singkatan (min. 3 huruf). */
  async searchUniversities(query: string): Promise<{ items: OriginUniversity[]; status: OriginStatus }> {
    const q = String(query ?? '').trim();
    if (q.length < 3) return { items: [], status: 'OK' };
    const key = `pt:${norm(q)}`;
    const hit = this.cached<OriginUniversity[]>(key);
    if (hit) return { items: hit, status: 'OK' };

    const nq = norm(q);
    const tokens = nq.split(' ').filter(Boolean);
    // Relevansi: 4 = nama diawali kata kunci, 3 = nama/singkatan memuat kata kunci berurutan, 2 = memuat semua kata, 1 = kecocokan longgar
    const scoreOf = (name: string, short: string) => {
      const hay = `${norm(name)} ${norm(short)}`;
      if (hay.includes(nq)) return norm(name).startsWith(nq) ? 4 : 3;
      return tokens.every((t) => hay.includes(t)) ? 2 : 1;
    };

    // Upstream hanya memberi sampel acak; gabungkan beberapa sampel sampai tidak ada lagi hasil relevan yang baru.
    const union = new Map<string, { r: OriginUniversity; score: number }>();
    let anyOk = false;
    for (let i = 0; i < SEARCH_SAMPLES; i++) {
      const raw = await this.rawSearch(q);
      if (!raw) continue;
      anyOk = true;
      let added = 0;
      for (const x of raw.pt) {
        const r: OriginUniversity = {
          id: String(x.kode ?? '').trim(),
          code: String(x.kode ?? '').trim(),
          name: String(x.nama ?? '').trim(),
          shortName: String(x.nama_singkat ?? '').trim(),
          source: 'PDDIKTI',
        };
        if (!r.code || !r.name || union.has(r.code)) continue;
        const score = scoreOf(r.name, r.shortName);
        union.set(r.code, { r, score });
        if (score >= 2) added++;
      }
      if (i > 0 && added === 0) break;
    }
    if (!anyOk) return { items: [], status: 'UNAVAILABLE' };

    const scored = Array.from(union.values());
    // bila ada yang cocok sungguhan, buang kecocokan longgar
    const best = Math.max(0, ...scored.map((x) => x.score));
    const items = scored
      .filter((x) => best < 2 || x.score >= 2)
      .sort((a, b) => b.score - a.score || a.r.name.localeCompare(b.r.name, 'id'))
      .map((x) => x.r)
      .slice(0, 15);
    this.remember(key, items);
    return { items, status: 'OK' };
  }

  /**
   * Program studi pada satu perguruan tinggi. PDDIKTI mengaitkan prodi ke PT lewat nama, jadi pencarian memakai nama PT lalu hasilnya
   * disaring ke PT itu; beberapa sampel acak digabung agar daftar lebih lengkap. `query` menyaring hasil menurut nama prodi.
   */
  async searchStudyPrograms(universityName: string, query?: string): Promise<{ items: OriginProgram[]; status: OriginStatus }> {
    const pt = String(universityName ?? '').trim();
    if (pt.length < 3) return { items: [], status: 'OK' };
    const q = norm(query);
    const key = `prodi:${norm(pt)}`;
    let all = this.cached<OriginProgram[]>(key);

    if (!all) {
      const union = new Map<string, OriginProgram>();
      let anyOk = false;
      for (let i = 0; i < PRODI_SAMPLES; i++) {
        const raw = await this.rawSearch(pt);
        if (!raw) continue;
        anyOk = true;
        const before = union.size;
        for (const r of raw.prodi) {
          if (norm(r.pt) !== norm(pt)) continue;
          const name = String(r.nama ?? '').trim();
          const jenjang = String(r.jenjang ?? '').trim();
          if (!name) continue;
          const id = String(r.id ?? `${jenjang}:${name}`);
          union.set(`${norm(jenjang)}:${norm(name)}`, { id, name, jenjang, label: jenjang ? `${jenjang} ${name}` : name, feederId: null });
        }
        // sampel baru tidak menambah apa pun -> daftar sudah lengkap
        if (i > 0 && union.size === before) break;
      }
      if (!anyOk) return { items: [], status: 'UNAVAILABLE' };
      all = Array.from(union.values()).sort((a, b) => a.label.localeCompare(b.label, 'id'));
      this.remember(key, all);
    }
    const items = q ? all.filter((p) => norm(p.label).includes(q)) : all;
    return { items: items.slice(0, 40), status: 'OK' };
  }
}
