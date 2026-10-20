'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Copy,
  FileUp,
  Loader2,
  Search,
  Send,
  X,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';

// ---------------------------------------------------------------------------
// Tipe & konstanta (mengikuti formulir PMB online)
// ---------------------------------------------------------------------------

interface Wave {
  id: string;
  name: string;
  jenjang?: string;
  status?: string;
  isDefault?: boolean;
  startDate?: string;
  endDate?: string;
  registrationFee?: number | null;
  reRegistrationFee?: number | null;
}
interface RegType {
  id: string;
  name: string;
  isKip: boolean;
}
interface NamedItem {
  id: string;
  name: string;
}
interface Prodi {
  id: string;
  code: string;
  name: string;
  degreeLevel: string;
  facultyName: string;
}
interface Options {
  waves: Wave[];
  registrationTypes: RegType[];
  tracks: NamedItem[];
  classes: NamedItem[];
  studyPrograms: Prodi[];
}
interface Region {
  id: string;
  name: string;
}
interface School {
  id: string;
  npsn: string;
  name: string;
  bentuk: string;
  status: string;
  regency: string;
}

const DEGREE_INFO: Record<string, { title: string; subtitle: string; badge: string; showTrackClass: boolean }> = {
  S1: { title: 'Sarjana (S1)', subtitle: 'Program Sarjana Strata 1', badge: 'Reguler & KIP', showTrackClass: true },
  D4: { title: 'Sarjana Terapan (D4)', subtitle: 'Program Diploma IV / Vokasi', badge: 'Vokasi D4', showTrackClass: true },
  D3: { title: 'Diploma (D3)', subtitle: 'Program Diploma III', badge: 'Vokasi D3', showTrackClass: false },
  S2: { title: 'Magister (S2)', subtitle: 'Program Pascasarjana Strata 2', badge: 'Pascasarjana', showTrackClass: false },
  S3: { title: 'Doktoral (S3)', subtitle: 'Program Doktoral Strata 3', badge: 'Riset Doktoral', showTrackClass: false },
};
const JENJANG_ORDER = ['S1', 'D4', 'D3', 'S2', 'S3'];

const STEPS = [
  { step: 1, title: 'Pilihan', desc: 'Jenjang & Prodi' },
  { step: 2, title: 'Data Diri', desc: 'NIK & Biodata' },
  { step: 3, title: 'Sekolah', desc: 'Asal Sekolah' },
  { step: 4, title: 'Orang Tua', desc: 'Data Ayah & Ibu' },
  { step: 5, title: 'Finalisasi', desc: 'Berkas & Kirim' },
];

const RELIGIONS = ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];
const JOBS = [
  'Karyawan Swasta',
  'PNS / ASN',
  'Wiraswasta / Usaha Mandiri',
  'Petani / Peternak / Nelayan',
  'Buruh / Pekerja Lepas',
  'Pegawai BUMN / BUMD',
  'TNI / Polri',
  'Ibu Rumah Tangga (IRT)',
  'Pensiunan',
  'Sudah Meninggal',
  'Tidak Bekerja / Lainnya',
];
const INCOMES = [
  'Tidak Berpenghasilan',
  '< Rp1.000.000',
  'Rp1.000.000 - Rp2.500.000',
  'Rp2.500.000 - Rp5.000.000',
  'Rp5.000.000 - Rp10.000.000',
  '> Rp10.000.000',
];
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const REGION_API = 'https://www.emsifa.com/api-wilayah-indonesia/api';

const inputCls =
  'w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/15 disabled:bg-slate-50 disabled:text-slate-400';
const labelCls = 'block text-xs font-bold text-slate-700 mb-1';

const emptyForm = {
  waveId: '',
  registrationTypeId: '',
  trackId: '',
  classId: '',
  studyProgramId: '',
  isKip: false,
  nik: '',
  fullName: '',
  birthPlace: '',
  birthDate: '',
  gender: '',
  religion: '',
  email: '',
  phone: '',
  streetAddress: '',
  rtRw: '',
  postalCode: '',
  schoolName: '',
  npsn: '',
  nisn: '',
  graduationYear: String(new Date().getFullYear()),
  major: '',
  fatherName: '',
  fatherPhone: '',
  fatherJob: '',
  fatherIncome: '',
  motherName: '',
  motherPhone: '',
  motherJob: '',
  motherIncome: '',
  fileKtp: '',
  fileKk: '',
  fileIjazah: '',
  fileFoto: '',
  fileKip: '',
  paidOnSite: false,
  statementAgreed: false,
};
type FormState = typeof emptyForm;

const toTitle = (s: string) =>
  s.trim().replace(/\s+/g, ' ').split(' ').map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w)).join(' ');
const rupiah = (n?: number | null) => `Rp${Number(n ?? 0).toLocaleString('id-ID')}`;

// ---------------------------------------------------------------------------
// Unggah berkas
// ---------------------------------------------------------------------------

function FileCard({
  label,
  sublabel,
  accept,
  value,
  required,
  onChange,
  onError,
}: {
  label: string;
  sublabel: string;
  accept: string;
  value: string;
  required?: boolean;
  onChange: (v: string) => void;
  onError: (m: string) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const pick = (file?: File) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      onError(`Berkas "${file.name}" melebihi 5 MB.`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(String(reader.result || ''));
    reader.onerror = () => onError('Gagal membaca berkas.');
    reader.readAsDataURL(file);
  };
  const isImage = value.startsWith('data:image');
  return (
    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p className="text-xs font-bold text-slate-800">
            {label} {required && <span className="text-red-500">*</span>}
          </p>
          <p className="text-[11px] text-slate-500 leading-snug">{sublabel}</p>
        </div>
        {value && (
          <button type="button" onClick={() => onChange('')} className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white cursor-pointer" aria-label="Hapus berkas">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {value ? (
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white border border-emerald-200">
          {isImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={label} className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
          ) : (
            <span className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-500">PDF</span>
          )}
          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4" /> Berkas terpilih
          </span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-5 rounded-xl border-2 border-dashed border-slate-300 text-xs font-semibold text-slate-500 hover:border-[#1E3A8A] hover:text-[#1E3A8A] bg-white cursor-pointer"
        >
          <FileUp className="w-4 h-4" /> Pilih berkas (JPG / PNG / PDF, maks. 5 MB)
        </button>
      )}
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => { pick(e.target.files?.[0]); e.target.value = ''; }} />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Halaman
// ---------------------------------------------------------------------------

export default function TambahCalonMahasiswaPage() {
  const apiBase = getApiBaseUrl();
  const [options, setOptions] = useState<Options>({ waves: [], registrationTypes: [], tracks: [], classes: [], studyPrograms: [] });
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [jenjang, setJenjang] = useState('');
  const [facultyFilter, setFacultyFilter] = useState('ALL');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<null | { registrationNumber: string; email: string; temporaryPassword: string }>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  // alamat (wilayah administrasi)
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [regencies, setRegencies] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [villages, setVillages] = useState<Region[]>([]);
  const [addr, setAddr] = useState({ provinceId: '', province: '', regencyId: '', city: '', districtId: '', kecamatan: '', kelurahan: '' });

  // pencarian sekolah
  const [schoolHits, setSchoolHits] = useState<School[]>([]);
  const [schoolBusy, setSchoolBusy] = useState(false);
  const schoolTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${apiBase}/admissions/pmb/options`, { cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.message || 'Gagal memuat pilihan formulir.');
        setOptions((json.data ?? json) as Options);
      } catch (e) {
        setOptionsError(e instanceof Error ? e.message : 'Gagal memuat pilihan formulir.');
      } finally {
        setLoadingOptions(false);
      }
    })();
  }, [apiBase]);

  const fetchRegions = async (path: string): Promise<Region[]> => {
    try {
      const res = await fetch(`${REGION_API}/${path}.json`);
      return res.ok ? await res.json() : [];
    } catch {
      return [];
    }
  };
  useEffect(() => {
    void fetchRegions('provinces').then(setProvinces);
  }, []);

  const availableJenjang = useMemo(() => {
    const known = Array.from(new Set(options.studyPrograms.map((p) => p.degreeLevel))).filter((d) => d in DEGREE_INFO);
    return known.sort((a, b) => JENJANG_ORDER.indexOf(a) - JENJANG_ORDER.indexOf(b));
  }, [options.studyPrograms]);

  const wavesForJenjang = useMemo(() => options.waves.filter((w) => (w.jenjang || 'S1') === jenjang), [options.waves, jenjang]);
  const activeWave = useMemo(
    () => wavesForJenjang.find((w) => w.id === form.waveId) || wavesForJenjang.find((w) => w.status === 'OPEN') || wavesForJenjang.find((w) => w.isDefault) || wavesForJenjang[0] || null,
    [wavesForJenjang, form.waveId],
  );
  const showTrackClass = DEGREE_INFO[jenjang]?.showTrackClass ?? false;
  const faculties = useMemo(
    () => Array.from(new Set(options.studyPrograms.filter((p) => p.degreeLevel === jenjang).map((p) => p.facultyName))).sort(),
    [options.studyPrograms, jenjang],
  );
  const prodiList = useMemo(
    () => options.studyPrograms.filter((p) => p.degreeLevel === jenjang && (facultyFilter === 'ALL' || p.facultyName === facultyFilter)),
    [options.studyPrograms, jenjang, facultyFilter],
  );
  const chosenProdi = options.studyPrograms.find((p) => p.id === form.studyProgramId);
  const chosenTrack = options.tracks.find((t) => t.id === form.trackId);
  const chosenClass = options.classes.find((c) => c.id === form.classId);

  const chooseJenjang = (j: string) => {
    setJenjang(j);
    setFacultyFilter('ALL');
    const wave = options.waves.find((w) => (w.jenjang || 'S1') === j && w.status === 'OPEN') || options.waves.find((w) => (w.jenjang || 'S1') === j);
    setForm((f) => ({ ...f, studyProgramId: '', waveId: wave?.id || '' }));
  };

  // ---- alamat bertingkat ----
  const onProvince = async (id: string) => {
    const p = provinces.find((x) => x.id === id);
    setAddr({ provinceId: id, province: p?.name || '', regencyId: '', city: '', districtId: '', kecamatan: '', kelurahan: '' });
    setRegencies([]); setDistricts([]); setVillages([]);
    if (id) setRegencies(await fetchRegions(`regencies/${id}`));
  };
  const onRegency = async (id: string) => {
    const r = regencies.find((x) => x.id === id);
    setAddr((a) => ({ ...a, regencyId: id, city: r?.name || '', districtId: '', kecamatan: '', kelurahan: '' }));
    setDistricts([]); setVillages([]);
    if (id) setDistricts(await fetchRegions(`districts/${id}`));
  };
  const onDistrict = async (id: string) => {
    const d = districts.find((x) => x.id === id);
    setAddr((a) => ({ ...a, districtId: id, kecamatan: d?.name || '', kelurahan: '' }));
    setVillages([]);
    if (id) setVillages(await fetchRegions(`villages/${id}`));
  };

  // ---- NIK -> tanggal lahir & gender otomatis ----
  const onNik = (raw: string) => {
    const nik = raw.replace(/\D/g, '').slice(0, 16);
    setForm((f) => {
      const next = { ...f, nik };
      if (nik.length === 16) {
        let day = parseInt(nik.slice(6, 8), 10);
        const month = parseInt(nik.slice(8, 10), 10);
        const yy = parseInt(nik.slice(10, 12), 10);
        const female = day > 40;
        if (female) day -= 40;
        const year = yy <= new Date().getFullYear() % 100 ? 2000 + yy : 1900 + yy;
        next.gender = female ? 'Perempuan' : 'Laki-laki';
        if (!f.birthDate && day >= 1 && day <= 31 && month >= 1 && month <= 12) {
          next.birthDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
      return next;
    });
  };

  // ---- cari sekolah ----
  const onSchool = (val: string) => {
    set('schoolName', val);
    if (schoolTimer.current) clearTimeout(schoolTimer.current);
    if (val.trim().length < 3) {
      setSchoolHits([]);
      return;
    }
    schoolTimer.current = setTimeout(async () => {
      setSchoolBusy(true);
      try {
        const res = await fetch(`${apiBase}/admissions/pmb/schools?search=${encodeURIComponent(val.trim())}`);
        const json = await res.json();
        const list = json.data ?? json;
        setSchoolHits(Array.isArray(list) ? list.slice(0, 8) : []);
      } catch {
        setSchoolHits([]);
      } finally {
        setSchoolBusy(false);
      }
    }, 400);
  };

  // ---- validasi per langkah ----
  const validate = (s: number): string | null => {
    if (s === 1) {
      if (!jenjang) return 'Pilih jenjang pendidikan terlebih dahulu.';
      if (!activeWave) return `Belum ada gelombang pendaftaran untuk jenjang ${jenjang}. Buat gelombang di menu Gelombang Pendaftaran.`;
      if (showTrackClass && !form.trackId) return 'Pilih Jenis Mahasiswa / Jalur.';
      if (!form.studyProgramId) return 'Pilih salah satu Program Studi.';
    }
    if (s === 2) {
      if (!form.fullName.trim()) return 'Nama lengkap wajib diisi.';
      if (form.nik.length !== 16) return 'NIK wajib 16 digit angka.';
      if (!form.birthPlace.trim() || !form.birthDate) return 'Tempat dan tanggal lahir wajib diisi.';
      if (!form.gender) return 'Jenis kelamin wajib dipilih.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) return 'Email aktif pendaftar tidak valid.';
      if (!/^(\+?62|0)8\d{7,12}$/.test(form.phone.replace(/[\s-]/g, ''))) return 'Nomor WhatsApp tidak valid (contoh 081234567890).';
      if (!addr.province || !addr.city) return 'Pilih Provinsi dan Kota/Kabupaten domisili.';
      if (!form.streetAddress.trim()) return 'Alamat jalan / no. rumah wajib diisi.';
    }
    if (s === 3 && !form.schoolName.trim()) return 'Nama asal sekolah / kampus wajib diisi.';
    if (s === 4) {
      if (!form.fatherName.trim()) return 'Nama ayah wajib diisi.';
      if (!form.motherName.trim()) return 'Nama ibu wajib diisi.';
    }
    if (s === 5) {
      if (form.isKip && !form.fileKip) return 'Pendaftar KIP-Kuliah wajib mengunggah bukti/kartu KIP.';
      if (!form.statementAgreed) return 'Centang pernyataan kebenaran data terlebih dahulu.';
    }
    return null;
  };

  const goTo = (n: number) => {
    setStep(n);
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const next = () => {
    const msg = validate(step);
    setError(msg);
    if (!msg) goTo(Math.min(step + 1, 5));
  };
  const prev = () => {
    setError(null);
    goTo(Math.max(step - 1, 1));
  };

  const submit = async () => {
    for (let s = 1; s <= 5; s++) {
      const msg = validate(s);
      if (msg) {
        setError(msg);
        goTo(s);
        return;
      }
    }
    setSubmitting(true);
    setError(null);
    try {
      const addressLine = [form.streetAddress.trim(), form.rtRw && `Rt/rw: ${form.rtRw}`, addr.kelurahan && `Kel. ${addr.kelurahan}`, addr.kecamatan && `Kec. ${addr.kecamatan}`, addr.city, addr.province && `Prov. ${addr.province}`, form.postalCode && `Kode Pos ${form.postalCode}`]
        .filter(Boolean)
        .join(', ');
      const payload = {
        ...form,
        waveId: activeWave?.id,
        registrationTypeId: form.registrationTypeId || undefined,
        trackId: form.trackId || options.tracks[0]?.id,
        classId: form.classId || options.classes[0]?.id,
        fullName: toTitle(form.fullName),
        birthPlace: toTitle(form.birthPlace),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.replace(/[\s-]/g, ''),
        address: addressLine,
        province: addr.province,
        city: addr.city,
        kecamatan: addr.kecamatan,
        kelurahan: addr.kelurahan,
        schoolName: toTitle(form.schoolName),
        fileKip: form.fileKip || undefined,
      };
      const res = await fetch(`${apiBase}/admissions/admin/pmb/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const m = json?.message;
        throw new Error(Array.isArray(m) ? m.join(', ') : m || 'Gagal mendaftarkan calon mahasiswa.');
      }
      const d = json.data ?? json;
      setResult({ registrationNumber: d.registrationNumber, email: d.email, temporaryPassword: d.temporaryPassword });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal mendaftarkan calon mahasiswa.');
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* abaikan */
    }
  };

  const resetAll = () => {
    setResult(null);
    setForm(emptyForm);
    setJenjang('');
    setAddr({ provinceId: '', province: '', regencyId: '', city: '', districtId: '', kecamatan: '', kelurahan: '' });
    setRegencies([]); setDistricts([]); setVillages([]);
    setStep(1);
    setError(null);
  };

  // =========================================================================
  // Layar sukses
  // =========================================================================
  if (result) {
    return (
      <PortalLayout role="pmb" userName="" userIdText="">
        <div className="max-w-xl mx-auto mt-6 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 text-center">
          <span className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </span>
          <h1 className="text-xl font-black text-slate-900">Calon mahasiswa berhasil didaftarkan</h1>
          <p className="text-sm text-slate-500 mt-1">Data sudah masuk ke daftar pendaftar dan alur verifikasi PMB.</p>

          <div className="mt-6 text-left space-y-3">
            {[
              { k: 'reg', label: 'Nomor Pendaftaran', value: result.registrationNumber },
              { k: 'email', label: 'Email / Username Login PMB', value: result.email },
              { k: 'pwd', label: 'Kata Sandi Sementara', value: result.temporaryPassword },
            ].map((r) => (
              <div key={r.k} className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{r.label}</p>
                  <p className="text-sm font-bold text-slate-900 font-mono truncate">{r.value}</p>
                </div>
                <button onClick={() => copy(r.value, r.k)} className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold text-[#1E3A8A] bg-white border border-slate-200 rounded-lg hover:border-[#1E3A8A] cursor-pointer">
                  {copied === r.k ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied === r.k ? 'Tersalin' : 'Salin'}
                </button>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 mt-4 text-left leading-relaxed">
            Kata sandi sementara hanya ditampilkan sekali. Serahkan ke pendaftar dan sarankan menggantinya lewat &ldquo;Lupa Kata Sandi&rdquo; di halaman login PMB.
          </p>

          <div className="mt-6 flex flex-col sm:flex-row gap-2 justify-center">
            <Link href="/admin/pmb/pendaftar" className="px-5 py-2.5 text-sm font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl">
              Lihat Data Pendaftar
            </Link>
            <button onClick={resetAll} className="px-5 py-2.5 text-sm font-bold text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-xl cursor-pointer">
              Tambah Calon Lainnya
            </button>
          </div>
        </div>
      </PortalLayout>
    );
  }

  // =========================================================================
  // Formulir
  // =========================================================================
  return (
    <PortalLayout role="pmb" userName="" userIdText="">
      <div className="space-y-4" ref={topRef}>
        <Link href="/admin/pmb/pendaftar" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#1E3A8A]">
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Data Calon Mahasiswa
        </Link>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Kepala + stepper */}
          <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] text-white p-6 sm:p-8">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#FDE047]">Formulir Pendaftaran oleh Panitia</span>
            <h1 className="text-xl sm:text-2xl font-black mt-1">Tambah Calon Mahasiswa Baru</h1>
            <p className="text-xs text-blue-100 mt-1">Isi data sesuai formulir PMB online. Pendaftar akan menerima akun login dengan email di bawah.</p>
            <div className="grid grid-cols-5 gap-2 mt-6">
              {STEPS.map((s) => (
                <button
                  key={s.step}
                  type="button"
                  disabled={s.step > step}
                  onClick={() => {
                    if (s.step < step) {
                      setError(null);
                      goTo(s.step);
                    }
                  }}
                  className={`text-left p-2.5 rounded-lg border transition-all ${
                    step === s.step
                      ? 'bg-white text-[#1E3A8A] border-white'
                      : s.step < step
                        ? 'bg-blue-900/60 text-emerald-300 border-blue-800 cursor-pointer hover:bg-blue-800/80'
                        : 'bg-blue-900/30 text-blue-300/50 border-transparent cursor-not-allowed'
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-xs font-black">
                    0{s.step} {s.step < step && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                  </span>
                  <span className="text-[11px] font-bold block truncate">{s.title}</span>
                  <span className="text-[9px] opacity-80 hidden md:block truncate">{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 sm:p-8">
            {loadingOptions ? (
              <p className="py-16 text-center text-sm text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat pilihan formulir…
              </p>
            ) : optionsError ? (
              <p className="py-10 text-center text-sm text-red-600">{optionsError}</p>
            ) : (
              <>
                {/* ============ LANGKAH 1 ============ */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">1. Pilih Jenjang Pendidikan</p>
                      <div className={`grid grid-cols-1 gap-3 ${availableJenjang.length <= 2 ? 'md:grid-cols-2' : availableJenjang.length === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
                        {availableJenjang.map((j) => {
                          const info = DEGREE_INFO[j];
                          const on = jenjang === j;
                          return (
                            <button
                              key={j}
                              type="button"
                              onClick={() => chooseJenjang(j)}
                              className={`p-4 rounded-xl border-2 text-left cursor-pointer transition-all ${on ? 'border-[#1E3A8A] bg-blue-50/60 ring-1 ring-[#1E3A8A]/30' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                            >
                              <span className="flex items-center justify-between">
                                <span className={`text-xs font-black ${on ? 'text-[#1E3A8A]' : 'text-slate-900'}`}>{info.title}</span>
                                <span className={`w-4 h-4 rounded-full border flex items-center justify-center ${on ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white' : 'border-slate-300'}`}>
                                  {on && <Check className="w-2.5 h-2.5" />}
                                </span>
                              </span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mt-1">{info.subtitle}</span>
                              <span className={`inline-block mt-3 text-[10px] font-bold px-2 py-0.5 rounded-full ${on ? 'bg-[#1E3A8A] text-white' : 'bg-slate-100 text-slate-600'}`}>{info.badge}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {jenjang && (
                      <div>
                        <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Gelombang Pendaftaran ({jenjang})</p>
                        {activeWave ? (
                          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${activeWave.status === 'OPEN' ? 'bg-blue-50/70 border-blue-200' : 'bg-amber-50/70 border-amber-200'}`}>
                            <div className="flex items-start gap-3">
                              <span className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 ${activeWave.status === 'OPEN' ? 'bg-[#1E3A8A]' : 'bg-amber-600'}`}>
                                <Calendar className="w-5 h-5" />
                              </span>
                              <div>
                                {wavesForJenjang.length > 1 ? (
                                  <select value={activeWave.id} onChange={(e) => set('waveId', e.target.value)} className="text-xs font-black text-slate-900 bg-transparent border-b border-slate-300 focus:outline-none">
                                    {wavesForJenjang.map((w) => (
                                      <option key={w.id} value={w.id}>{w.name}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <p className="text-xs font-black text-slate-900">{activeWave.name}</p>
                                )}
                                <p className="text-[11px] text-slate-600 mt-1">
                                  Periode: <strong>{activeWave.startDate || '-'}</strong> s.d. <strong>{activeWave.endDate || '-'}</strong>
                                </p>
                                {activeWave.status !== 'OPEN' && (
                                  <p className="text-[11px] font-semibold text-amber-700 mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5" /> Gelombang ini tidak berstatus dibuka — panitia tetap dapat mendaftarkan.
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0 text-xs">
                              <div className="bg-white px-3 py-2 rounded-xl border border-blue-200">
                                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Biaya Registrasi</span>
                                <span className="font-extrabold text-[#1E3A8A]">{rupiah(activeWave.registrationFee)}</span>
                              </div>
                              <div className="bg-white px-3 py-2 rounded-xl border border-emerald-200">
                                <span className="text-[10px] text-slate-500 font-semibold block uppercase">Daftar Ulang</span>
                                <span className="font-extrabold text-emerald-700">{rupiah(activeWave.reRegistrationFee)}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 text-amber-800 text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" /> Belum ada gelombang pendaftaran untuk jenjang {jenjang}.
                          </div>
                        )}
                      </div>
                    )}

                    {jenjang && !loadingOptions && options.tracks.length === 0 && (
                      <div className="p-4 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 text-amber-800 text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>
                          Jalur pendaftaran belum dibuat, sehingga pendaftaran tidak dapat disimpan. Tambahkan di menu{' '}
                          <Link href="/admin/pmb/jalur" className="font-bold underline">Jalur, Jenis &amp; Kelas</Link>.
                        </span>
                      </div>
                    )}

                    {jenjang && showTrackClass && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Jenis Pendaftaran</p>
                          <div className="space-y-2">
                            {options.registrationTypes.map((rt) => {
                              const on = form.registrationTypeId === rt.id || (!form.registrationTypeId && (rt.isKip ? form.isKip : !form.isKip));
                              return (
                                <label key={rt.id} className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer ${on ? 'border-[#1E3A8A] bg-blue-50/50 ring-1 ring-[#1E3A8A]/30' : 'border-slate-200 hover:border-slate-300'}`}>
                                  <input type="radio" name="regType" checked={on} onChange={() => setForm((f) => ({ ...f, registrationTypeId: rt.id, isKip: rt.isKip }))} className="text-[#1E3A8A]" />
                                  <span className="text-xs font-bold text-slate-900">{rt.name}</span>
                                  {rt.isKip && <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Bebas biaya</span>}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className={labelCls}>Jenis Mahasiswa / Jalur <span className="text-red-500">*</span></label>
                            <select value={form.trackId} onChange={(e) => set('trackId', e.target.value)} className={inputCls}>
                              <option value="">-- Pilih --</option>
                              {options.tracks.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className={labelCls}>Kelas Kuliah</label>
                            <select value={form.classId} onChange={(e) => set('classId', e.target.value)} className={inputCls}>
                              <option value="">-- Pilih --</option>
                              {options.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {jenjang && (
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                          <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Pilih Program Studi <span className="text-red-500">*</span></p>
                          {faculties.length > 1 && (
                            <select value={facultyFilter} onChange={(e) => setFacultyFilter(e.target.value)} className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white">
                              <option value="ALL">Semua Fakultas</option>
                              {faculties.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {prodiList.map((p) => {
                            const on = form.studyProgramId === p.id;
                            return (
                              <button key={p.id} type="button" onClick={() => set('studyProgramId', p.id)} className={`p-3.5 rounded-xl border-2 text-left cursor-pointer ${on ? 'border-[#1E3A8A] bg-blue-50/60' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                                <span className="flex items-start justify-between gap-2">
                                  <span className="text-sm font-bold text-slate-900">{p.name}</span>
                                  <span className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${on ? 'bg-[#1E3A8A] border-[#1E3A8A] text-white' : 'border-slate-300'}`}>{on && <Check className="w-2.5 h-2.5" />}</span>
                                </span>
                                <span className="text-[11px] text-slate-500 block mt-0.5">{p.facultyName}</span>
                              </button>
                            );
                          })}
                          {prodiList.length === 0 && <p className="text-xs text-slate-400 col-span-full text-center py-6">Tidak ada program studi pada pilihan ini.</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ============ LANGKAH 2 ============ */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>NIK <span className="text-red-500">*</span></label>
                        <input value={form.nik} onChange={(e) => onNik(e.target.value)} inputMode="numeric" maxLength={16} placeholder="16 digit sesuai KTP/KK" className={inputCls} />
                        <p className="text-[10px] text-slate-400 mt-1">Tanggal lahir dan jenis kelamin terisi otomatis dari NIK.</p>
                      </div>
                      <div>
                        <label className={labelCls}>Nama Lengkap <span className="text-red-500">*</span></label>
                        <input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Sesuai KTP / Ijazah" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Tempat Lahir <span className="text-red-500">*</span></label>
                        <input value={form.birthPlace} onChange={(e) => set('birthPlace', e.target.value)} placeholder="Contoh: Kudus" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Tanggal Lahir <span className="text-red-500">*</span></label>
                        <input type="date" value={form.birthDate} onChange={(e) => set('birthDate', e.target.value)} className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Jenis Kelamin <span className="text-red-500">*</span></label>
                        <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className={inputCls}>
                          <option value="">-- Pilih --</option>
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Agama</label>
                        <select value={form.religion} onChange={(e) => set('religion', e.target.value)} className={inputCls}>
                          <option value="">-- Pilih --</option>
                          {RELIGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Email Aktif <span className="text-red-500">*</span></label>
                        <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="nama@email.com" className={inputCls} />
                        <p className="text-[10px] text-slate-400 mt-1">Dipakai pendaftar untuk login ke akun PMB.</p>
                      </div>
                      <div>
                        <label className={labelCls}>Nomor WhatsApp <span className="text-red-500">*</span></label>
                        <input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="081234567890" className={inputCls} />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Alamat Domisili</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className={labelCls}>Provinsi <span className="text-red-500">*</span></label>
                          <select value={addr.provinceId} onChange={(e) => void onProvince(e.target.value)} className={inputCls}>
                            <option value="">{provinces.length ? '-- Pilih Provinsi --' : 'Memuat…'}</option>
                            {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Kota / Kabupaten <span className="text-red-500">*</span></label>
                          <select value={addr.regencyId} onChange={(e) => void onRegency(e.target.value)} disabled={!regencies.length} className={inputCls}>
                            <option value="">-- Pilih Kota / Kabupaten --</option>
                            {regencies.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Kecamatan</label>
                          <select value={addr.districtId} onChange={(e) => void onDistrict(e.target.value)} disabled={!districts.length} className={inputCls}>
                            <option value="">-- Pilih Kecamatan --</option>
                            {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className={labelCls}>Kelurahan / Desa</label>
                          <select
                            value={villages.find((v) => v.name === addr.kelurahan)?.id || ''}
                            onChange={(e) => setAddr((a) => ({ ...a, kelurahan: villages.find((v) => v.id === e.target.value)?.name || '' }))}
                            disabled={!villages.length}
                            className={inputCls}
                          >
                            <option value="">-- Pilih Kelurahan / Desa --</option>
                            {villages.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                          </select>
                        </div>
                        <div className="md:col-span-2">
                          <label className={labelCls}>Alamat Jalan / No. Rumah <span className="text-red-500">*</span></label>
                          <input value={form.streetAddress} onChange={(e) => set('streetAddress', e.target.value)} placeholder="Jl. Melati No. 12" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>RT / RW</label>
                          <input value={form.rtRw} onChange={(e) => set('rtRw', e.target.value)} placeholder="001 / 002" className={inputCls} />
                        </div>
                        <div>
                          <label className={labelCls}>Kode Pos</label>
                          <input value={form.postalCode} onChange={(e) => set('postalCode', e.target.value.replace(/\D/g, '').slice(0, 5))} inputMode="numeric" placeholder="59311" className={inputCls} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ============ LANGKAH 3 ============ */}
                {step === 3 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2 relative">
                      <label className={labelCls}>Asal Sekolah / Kampus <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input value={form.schoolName} onChange={(e) => onSchool(e.target.value)} placeholder="Ketik minimal 3 huruf untuk mencari sekolah…" className={`${inputCls} pl-9`} />
                        {schoolBusy && <Loader2 className="w-4 h-4 animate-spin text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />}
                      </div>
                      {schoolHits.length > 0 && (
                        <ul className="absolute z-20 left-0 right-0 mt-1 max-h-64 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-lg divide-y divide-slate-100">
                          {schoolHits.map((s) => (
                            <li key={s.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setForm((f) => ({ ...f, schoolName: s.name, npsn: s.npsn }));
                                  setSchoolHits([]);
                                }}
                                className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 cursor-pointer"
                              >
                                <span className="text-sm font-semibold text-slate-900 block">{s.name}</span>
                                <span className="text-[11px] text-slate-500">{s.bentuk} · {s.status} · {s.regency} · NPSN {s.npsn}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">Bila sekolah tidak ditemukan, ketik nama sekolah secara manual.</p>
                    </div>
                    <div>
                      <label className={labelCls}>NPSN</label>
                      <input value={form.npsn} onChange={(e) => set('npsn', e.target.value.replace(/\D/g, '').slice(0, 8))} inputMode="numeric" placeholder="8 digit" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>NISN</label>
                      <input value={form.nisn} onChange={(e) => set('nisn', e.target.value.replace(/\D/g, '').slice(0, 10))} inputMode="numeric" placeholder="10 digit" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Tahun Lulus</label>
                      <input value={form.graduationYear} onChange={(e) => set('graduationYear', e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Jurusan / Peminatan</label>
                      <input value={form.major} onChange={(e) => set('major', e.target.value)} placeholder="Contoh: IPA / TKJ" className={inputCls} />
                    </div>
                  </div>
                )}

                {/* ============ LANGKAH 4 ============ */}
                {step === 4 && (
                  <div className="space-y-6">
                    {(['father', 'mother'] as const).map((who) => {
                      const title = who === 'father' ? 'Data Ayah' : 'Data Ibu';
                      const k = (s: string) => `${who}${s}` as keyof FormState;
                      return (
                        <div key={who} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50">
                          <p className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">{title}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className={labelCls}>Nama Lengkap <span className="text-red-500">*</span></label>
                              <input value={form[k('Name')] as string} onChange={(e) => set(k('Name'), e.target.value as never)} className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Nomor HP</label>
                              <input type="tel" value={form[k('Phone')] as string} onChange={(e) => set(k('Phone'), e.target.value as never)} placeholder="08…" className={inputCls} />
                            </div>
                            <div>
                              <label className={labelCls}>Pekerjaan</label>
                              <select value={form[k('Job')] as string} onChange={(e) => set(k('Job'), e.target.value as never)} className={inputCls}>
                                <option value="">-- Pilih --</option>
                                {JOBS.map((j) => <option key={j} value={j}>{j}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className={labelCls}>Penghasilan per Bulan</label>
                              <select value={form[k('Income')] as string} onChange={(e) => set(k('Income'), e.target.value as never)} className={inputCls}>
                                <option value="">-- Pilih --</option>
                                {INCOMES.map((i) => <option key={i} value={i}>{i}</option>)}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* ============ LANGKAH 5 ============ */}
                {step === 5 && (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 text-xs grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                      <p><span className="text-slate-400">Nama:</span> <strong>{toTitle(form.fullName) || '-'}</strong></p>
                      <p><span className="text-slate-400">Email:</span> <strong>{form.email || '-'}</strong></p>
                      <p><span className="text-slate-400">Jenjang / Prodi:</span> <strong>{jenjang} · {chosenProdi?.name || '-'}</strong></p>
                      <p><span className="text-slate-400">Gelombang:</span> <strong>{activeWave?.name || '-'}</strong></p>
                      {showTrackClass && <p><span className="text-slate-400">Jalur / Kelas:</span> <strong>{chosenTrack?.name || '-'} · {chosenClass?.name || '-'}</strong></p>}
                      <p><span className="text-slate-400">Sekolah:</span> <strong>{toTitle(form.schoolName) || '-'}</strong></p>
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Unggah Berkas Persyaratan</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 mb-3">JPG, PNG, atau PDF (maks. 5 MB). Boleh dilengkapi kemudian bila berkas belum siap.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FileCard label="Kartu Tanda Penduduk (KTP)" sublabel="Scan / foto e-KTP calon mahasiswa" accept="image/jpeg,image/png,image/webp,application/pdf" value={form.fileKtp} onChange={(v) => set('fileKtp', v)} onError={setError} />
                        <FileCard label="Kartu Keluarga (KK)" sublabel="Lembar KK terbaru" accept="image/jpeg,image/png,image/webp,application/pdf" value={form.fileKk} onChange={(v) => set('fileKk', v)} onError={setError} />
                        <FileCard label="Ijazah / SKL / Rapor" sublabel="Ijazah, Surat Keterangan Lulus, atau rapor semester akhir" accept="image/jpeg,image/png,image/webp,application/pdf" value={form.fileIjazah} onChange={(v) => set('fileIjazah', v)} onError={setError} />
                        <FileCard label="Pas Foto 3x4" sublabel="Foto formal terbaru berlatar merah / biru" accept="image/jpeg,image/png,image/webp" value={form.fileFoto} onChange={(v) => set('fileFoto', v)} onError={setError} />
                      </div>
                      {form.isKip && (
                        <div className="mt-4 p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/70">
                          <FileCard label="Kartu KIP / Bukti Akun KIP-Kuliah" sublabel="Foto Kartu KIP, KKS, SKTM, atau bukti pendaftaran KIP-Kuliah" accept="image/jpeg,image/png,image/webp,application/pdf" value={form.fileKip} required onChange={(v) => set('fileKip', v)} onError={setError} />
                        </div>
                      )}
                    </div>

                    {!form.isKip && (
                      <label className="flex items-start gap-3 p-4 rounded-xl border border-emerald-200 bg-emerald-50/60 cursor-pointer">
                        <input type="checkbox" checked={form.paidOnSite} onChange={(e) => set('paidOnSite', e.target.checked)} className="mt-0.5 w-4 h-4 accent-emerald-600" />
                        <span className="text-xs text-slate-700">
                          <strong>Biaya registrasi sudah dibayar langsung di loket</strong> ({rupiah(activeWave?.registrationFee)})
                          <span className="block text-[11px] text-slate-500 mt-0.5">Tagihan registrasi ditandai lunas dan berkas langsung masuk antrean verifikasi. Bila tidak dicentang, pendaftar membayar lewat akun PMB-nya.</span>
                        </span>
                      </label>
                    )}

                    <label className="flex items-start gap-3 p-4 rounded-xl border border-blue-200 bg-blue-50/60 cursor-pointer">
                      <input type="checkbox" checked={form.statementAgreed} onChange={(e) => set('statementAgreed', e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#1E3A8A]" />
                      <span className="text-xs text-slate-700">Saya menyatakan data dan dokumen yang diisikan sesuai dengan yang diserahkan calon mahasiswa dan dapat dipertanggungjawabkan.</span>
                    </label>
                  </div>
                )}

                {/* Navigasi */}
                <div className="mt-8 pt-5 border-t border-slate-200">
                  {error && (
                    <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between gap-3 text-red-800 text-xs font-semibold">
                      <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-600 shrink-0" /> {error}</span>
                      <button type="button" onClick={() => setError(null)} className="underline shrink-0 cursor-pointer">Tutup</button>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      {step > 1 ? (
                        <button type="button" onClick={prev} className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-700 border border-slate-300 hover:bg-slate-50 rounded-xl cursor-pointer">
                          <ArrowLeft className="w-4 h-4" /> Kembali
                        </button>
                      ) : (
                        <Link href="/admin/pmb/pendaftar" className="inline-flex items-center px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-800">Batal</Link>
                      )}
                    </div>
                    {step < 5 ? (
                      <button type="button" onClick={next} className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl cursor-pointer">
                        Lanjutkan <ArrowRight className="w-4 h-4" />
                      </button>
                    ) : (
                      <button type="button" onClick={() => void submit()} disabled={submitting} className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50 cursor-pointer">
                        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        {submitting ? 'Menyimpan…' : 'Daftarkan Calon Mahasiswa'}
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
