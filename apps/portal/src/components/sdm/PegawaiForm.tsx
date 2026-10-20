'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Briefcase, GraduationCap, Loader2, Mail, MapPin, Search, UserCheck } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { SearchSelect } from '@/components/ui/SearchSelect';

export interface PegawaiItem {
  id: string;
  nip: string;
  nidn?: string;
  nuptk?: string;
  fullName: string;
  titlePrefix?: string;
  titleSuffix?: string;
  gender: 'Laki-laki' | 'Perempuan';
  category: 'Dosen Tetap' | 'Dosen Luar Biasa' | 'Tenaga Kependidikan' | string;
  employmentStatus: 'PNS / ASN' | 'Tetap Yayasan' | 'Kontrak (PKWT)' | 'Honorer' | 'Outsourcing (Alih Daya)';
  streetAddress?: string;
  rtRw?: string;
  kelurahan?: string;
  kecamatan?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  educationInstitution?: string;
  educationMajor?: string;
  graduationYear?: string;
  /** Perusahaan penyedia tenaga kerja (khusus outsourcing). */
  vendorName?: string;
  /** false = pegawai tanpa akun login (data kepegawaian saja). */
  hasLogin?: boolean;
  department: string;
  /** Tampilan gabungan struktural · fungsional (diisi server, hanya-baca). */
  position?: string;
  structuralPosition?: string;
  functionalPosition?: string;
  email: string;
  phone: string;
  education: 'D3' | 'S1' | 'S2' | 'S3' | 'Profesi';
  joinDate: string;
  status: 'Aktif' | 'Cuti' | 'Pensiun' | 'Tugas Belajar';
  avatarUrl?: string;
  shiftId?: string | null;
  shiftName?: string | null;
}

export const departmentOptions = [
  'Semua Unit',
  'Biro Administrasi Akademik & Kemahasiswaan (BAAK)',
  'Biro Administrasi Keuangan (BAK)',
  'Direktorat Sistem Teknologi Informasi (DSTI)',
  'Fakultas Teknik',
  'Fakultas Ilmu Komputer',
  'Fakultas Ekonomi & Bisnis',
  'Lembaga Penelitian & Pengabdian Masyarakat (LPPM)',
  'Biro Urusan Rumah Tangga & Sarpras (URT)',
  'Perpustakaan Pusat & Arsip',
];

/** Kategori tenaga penunjang (di luar dosen & tenaga kependidikan). Status outsourcing diatur terpisah di Status Kepegawaian. */
export const supportCategoryOptions = [
  'Satpam / Petugas Keamanan',
  'Office Boy / Office Girl (OB/OG)',
  'Petugas Kebersihan (Cleaning Service)',
  'Sopir / Pengemudi',
  'Teknisi / Pemeliharaan Gedung',
  'Petugas Taman',
  'Tenaga Penunjang Lainnya',
];

export const categoryOptions = [
  'Semua Kategori',
  'Tenaga Kependidikan',
  'Dosen Tetap',
  'Dosen Luar Biasa',
  ...supportCategoryOptions,
];

export const employmentStatusOptions = [
  'Semua Status',
  'PNS / ASN',
  'Tetap Yayasan',
  'Kontrak (PKWT)',
  'Honorer',
  'Outsourcing (Alih Daya)',
];

export const OUTSOURCING = 'Outsourcing (Alih Daya)';
export const structuralPositionOptions = [
  'Rektor',
  'Wakil Rektor I (Bidang Akademik)',
  'Wakil Rektor II (Bidang Keuangan & SDM)',
  'Wakil Rektor III (Bidang Kemahasiswaan)',
  'Dekan',
  'Wakil Dekan',
  'Ketua Program Studi (Kaprodi)',
  'Sekretaris Program Studi',
  'Direktur',
  'Kepala Biro',
  'Kepala Bagian',
  'Kepala Sub Bagian (Kasubag)',
  'Kepala Lembaga / Pusat',
  'Kepala UPT / Laboratorium',
  'Kepala Perpustakaan',
  'Koordinator',
  'Sekretaris',
  'Staf Administrasi',
  'Staf Akademik & Kemahasiswaan',
  'Staf Keuangan',
  'Staf Kepegawaian (SDM)',
  'Staf IT / Teknologi Informasi',
  'Staf Perpustakaan',
  'Staf Layanan & Umum',
  'Staf Laboratorium',
  'Kepala Regu / Koordinator Lapangan',
];

export const functionalDosenOptions = ['Tenaga Pengajar', 'Asisten Ahli', 'Lektor', 'Lektor Kepala', 'Profesor'];

interface Region {
  id: string;
  name: string;
}
const REGION_API = 'https://www.emsifa.com/api-wilayah-indonesia/api';
const titleCase = (v: string) => v.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
async function fetchRegions(path: string): Promise<Region[]> {
  try {
    const res = await fetch(`${REGION_API}/${path}.json`);
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

interface University {
  kode: string;
  name: string;
  shortName: string;
}

/** Pilihan perguruan tinggi dengan pencarian (data PDDikti lewat API sendiri); nama yang tidak ketemu boleh ditulis manual. */
function UniversityPicker({ value, onChange }: { value: string; onChange: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<University[]>([]);
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const search = (text: string) => {
    setQuery(text);
    setUnavailable(false);
    if (timer.current) clearTimeout(timer.current);
    if (text.trim().length < 3) {
      setHits([]);
      return;
    }
    timer.current = setTimeout(async () => {
      setBusy(true);
      try {
        const res = await fetch(`${getApiBaseUrl()}/employees/universities?search=${encodeURIComponent(text.trim())}`);
        const json = await res.json();
        const d = json.data ?? json;
        setHits(Array.isArray(d.items) ? d.items : []);
        setUnavailable(!!d.unavailable);
      } catch {
        setHits([]);
        setUnavailable(true);
      } finally {
        setBusy(false);
      }
    }, 600);
  };

  const pick = (name: string) => {
    onChange(name);
    setOpen(false);
    setQuery('');
    setHits([]);
  };

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-left flex items-center justify-between gap-2 focus:outline-none focus:border-[#1E3A8A]"
      >
        <span className={`truncate ${value ? 'text-slate-800' : 'text-slate-400'}`}>{value || 'Cari & pilih perguruan tinggi…'}</span>
        <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100 relative">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => search(e.target.value)}
              placeholder="Ketik minimal 3 huruf, mis. Diponegoro"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
            />
            {busy && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400 absolute right-5 top-1/2 -translate-y-1/2" />}
          </div>
          <ul className="max-h-60 overflow-y-auto divide-y divide-slate-100">
            {hits.map((u) => (
              <li key={u.kode || u.name}>
                <button type="button" onClick={() => pick(u.name)} className="w-full text-left px-3 py-2 hover:bg-blue-50 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-800 block">{u.name}</span>
                  <span className="text-[10px] text-slate-400">
                    {u.shortName ? `${u.shortName} · ` : ''}Kode PT {u.kode}
                  </span>
                </button>
              </li>
            ))}
            {!busy && query.trim().length >= 3 && hits.length === 0 && (
              <li className="px-3 py-3 text-[11px] text-slate-400">
                {unavailable ? 'Pencarian PDDikti sedang dibatasi/tidak tersedia. Coba lagi sebentar atau tulis nama kampus secara manual.' : 'Perguruan tinggi tidak ditemukan.'}
              </li>
            )}
            {query.trim().length >= 3 && (
              <li>
                <button type="button" onClick={() => pick(query.trim())} className="w-full text-left px-3 py-2 text-[11px] font-semibold text-[#1E3A8A] hover:bg-blue-50 cursor-pointer">
                  Gunakan &ldquo;{query.trim()}&rdquo; (tulis manual)
                </button>
              </li>
            )}
            {query.trim().length < 3 && <li className="px-3 py-3 text-[11px] text-slate-400">Ketik nama kampus untuk mencari.</li>}
          </ul>
          {value && (
            <button type="button" onClick={() => pick('')} className="w-full px-3 py-2 text-[11px] font-semibold text-rose-600 border-t border-slate-100 hover:bg-rose-50 cursor-pointer">
              Kosongkan pilihan
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export type PegawaiFormData = Omit<PegawaiItem, 'id'>;

export const emptyPegawai = (): PegawaiFormData => ({
  nip: '',
  nidn: '',
  nuptk: '',
  fullName: '',
  titlePrefix: '',
  titleSuffix: '',
  gender: 'Laki-laki',
  category: 'Tenaga Kependidikan',
  employmentStatus: 'Tetap Yayasan',
  department: 'Biro Administrasi Akademik & Kemahasiswaan (BAAK)',
  structuralPosition: '',
  functionalPosition: '',
  vendorName: '',
  streetAddress: '',
  rtRw: '',
  kelurahan: '',
  kecamatan: '',
  city: '',
  province: '',
  postalCode: '',
  educationInstitution: '',
  educationMajor: '',
  graduationYear: '',
  email: '',
  phone: '',
  education: 'S1',
  joinDate: new Date().toISOString().split('T')[0],
  status: 'Aktif',
  shiftId: '',
});

export function toFormData(emp: PegawaiItem): PegawaiFormData {
  return {
    nip: emp.nip,
    nidn: emp.nidn || '',
    nuptk: emp.nuptk || '',
    fullName: emp.fullName,
    titlePrefix: emp.titlePrefix || '',
    titleSuffix: emp.titleSuffix || '',
    gender: emp.gender,
    category: emp.category,
    employmentStatus: emp.employmentStatus,
    department: emp.department,
    structuralPosition: emp.structuralPosition || '',
    functionalPosition: emp.functionalPosition || '',
    vendorName: emp.vendorName || '',
    streetAddress: emp.streetAddress || '',
    rtRw: emp.rtRw || '',
    kelurahan: emp.kelurahan || '',
    kecamatan: emp.kecamatan || '',
    city: emp.city || '',
    province: emp.province || '',
    postalCode: emp.postalCode || '',
    educationInstitution: emp.educationInstitution || '',
    educationMajor: emp.educationMajor || '',
    graduationYear: emp.graduationYear || '',
    email: emp.email,
    phone: emp.phone,
    education: emp.education,
    joinDate: emp.joinDate,
    status: emp.status,
    shiftId: emp.shiftId || '',
  };
}

interface Props {
  initial: PegawaiFormData;
  shiftOptions: { id: string; name: string; isDefault: boolean }[];
  submitLabel?: string;
  saving?: boolean;
  onSubmit: (data: PegawaiFormData) => void | Promise<void>;
  onCancel: () => void;
}

/** Formulir data pegawai -- dipakai modal Tambah Pegawai dan halaman Edit Pegawai. */
export function PegawaiForm({ initial, shiftOptions, submitLabel = 'Simpan Data Pegawai', saving = false, onSubmit, onCancel }: Props) {
  const [formData, setFormData] = useState<PegawaiFormData>(initial);

  // Wilayah administrasi bertingkat (Provinsi -> Kota/Kab -> Kecamatan -> Kelurahan), sama seperti formulir PMB.
  const [provinces, setProvinces] = useState<Region[]>([]);
  const [regencies, setRegencies] = useState<Region[]>([]);
  const [districts, setDistricts] = useState<Region[]>([]);
  const [villages, setVillages] = useState<Region[]>([]);
  const [ids, setIds] = useState({ province: '', regency: '', district: '' });

  useEffect(() => {
    let alive = true;
    (async () => {
      const prov = await fetchRegions('provinces');
      if (!alive) return;
      setProvinces(prov);
      // data tersimpan hanya berisi nama -> cari id-nya agar pilihan bertingkat terisi saat edit
      const p = initial.province ? prov.find((x) => sameName(x.name, initial.province!)) : undefined;
      if (!p) return;
      const regs = await fetchRegions(`regencies/${p.id}`);
      if (!alive) return;
      setRegencies(regs);
      const r = initial.city ? regs.find((x) => sameName(x.name, initial.city!)) : undefined;
      const next = { province: p.id, regency: r?.id || '', district: '' };
      if (r) {
        const dists = await fetchRegions(`districts/${r.id}`);
        if (!alive) return;
        setDistricts(dists);
        const d = initial.kecamatan ? dists.find((x) => sameName(x.name, initial.kecamatan!)) : undefined;
        next.district = d?.id || '';
        if (d) {
          const vils = await fetchRegions(`villages/${d.id}`);
          if (!alive) return;
          setVillages(vils);
        }
      }
      setIds(next);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onProvince = async (id: string) => {
    const name = titleCase(provinces.find((x) => x.id === id)?.name || '');
    setIds({ province: id, regency: '', district: '' });
    setFormData((f) => ({ ...f, province: name, city: '', kecamatan: '', kelurahan: '' }));
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
    if (id) setRegencies(await fetchRegions(`regencies/${id}`));
  };
  const onRegency = async (id: string) => {
    const name = titleCase(regencies.find((x) => x.id === id)?.name || '');
    setIds((v) => ({ ...v, regency: id, district: '' }));
    setFormData((f) => ({ ...f, city: name, kecamatan: '', kelurahan: '' }));
    setDistricts([]);
    setVillages([]);
    if (id) setDistricts(await fetchRegions(`districts/${id}`));
  };
  const onDistrict = async (id: string) => {
    const name = titleCase(districts.find((x) => x.id === id)?.name || '');
    setIds((v) => ({ ...v, district: id }));
    setFormData((f) => ({ ...f, kecamatan: name, kelurahan: '' }));
    setVillages([]);
    if (id) setVillages(await fetchRegions(`villages/${id}`));
  };

  // Nilai yang sudah tersimpan tapi tidak ada di daftar baku tetap ditampilkan agar tidak hilang saat disimpan.
  const isOutsourcing = formData.employmentStatus === OUTSOURCING;
  const isDosen = formData.category.includes('Dosen');
  const isSupport = (supportCategoryOptions as string[]).includes(formData.category);
  const extraFunctional =
    formData.functionalPosition && !functionalDosenOptions.includes(formData.functionalPosition) ? formData.functionalPosition : '';

  const structuralOptions = Array.from(
    new Set([...structuralPositionOptions, ...(initial.structuralPosition ? [initial.structuralPosition] : [])]),
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      alert('Nama lengkap wajib diisi.');
      return;
    }
    if (!isOutsourcing && !formData.nip.trim()) {
      alert('NIP pegawai wajib diisi.');
      return;
    }
    if (isDosen && !(formData.nidn || '').trim() && !(formData.nuptk || '').trim()) {
      alert('Dosen wajib memiliki NIDN atau NUPTK. Isi salah satunya.');
      return;
    }
    if (isDosen && !formData.email.trim()) {
      alert('Email dosen wajib diisi (dipakai untuk akun login).');
      return;
    }
    if (isOutsourcing && !(formData.vendorName || '').trim()) {
      alert('Perusahaan penyedia (vendor) wajib diisi untuk pegawai outsourcing.');
      return;
    }
    const hasStructural = !!(formData.structuralPosition || '').trim();
    const hasFunctional = isDosen && !!(formData.functionalPosition || '').trim();
    if (isDosen && !hasStructural && !hasFunctional) {
      alert('Isi minimal salah satu: Jabatan Struktural atau Jabatan Fungsional.');
      return;
    }
    if (!isDosen && !isSupport && !hasStructural) {
      alert('Jabatan Struktural wajib dipilih untuk tenaga kependidikan.');
      return;
    }
    void onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4 text-xs">
      {/* Seksi 1: Data Identitas Utama */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
    <UserCheck className="w-4 h-4 text-[#1E3A8A]" />
    <span>Identitas & Data Pribadi</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
    <div>
      <label className="block text-[11px] font-bold text-slate-700 mb-1">
        {isOutsourcing ? 'NIP / No. Induk dari Vendor' : 'NIP Pegawai'} {!isOutsourcing && <span className="text-rose-500">*</span>}
      </label>
      <input
        type="text"
        required
        placeholder="Contoh: 19850315 201001 1 002"
        value={formData.nip}
        onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
      />
    </div>
    <div>
      <label className="block text-[11px] font-bold text-slate-700 mb-1">
        NIDN
      </label>
      <input
        type="text"
        inputMode="numeric"
        disabled={!isDosen}
        placeholder={isDosen ? 'Contoh: 0015038501' : 'Khusus dosen'}
        value={isDosen ? formData.nidn || '' : ''}
        onChange={(e) => setFormData({ ...formData, nidn: e.target.value.replace(/\D/g, '').slice(0, 10) })}
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A] disabled:bg-slate-100 disabled:text-slate-400"
      />
    </div>
    <div>
      <label className="block text-[11px] font-bold text-slate-700 mb-1">
        NUPTK
      </label>
      <input
        type="text"
        inputMode="numeric"
        disabled={!isDosen}
        placeholder={isDosen ? 'Contoh: 1234567890123456' : 'Khusus dosen'}
        value={isDosen ? formData.nuptk || '' : ''}
        onChange={(e) => setFormData({ ...formData, nuptk: e.target.value.replace(/\D/g, '').slice(0, 16) })}
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A] disabled:bg-slate-100 disabled:text-slate-400"
      />
      {isDosen && <p className="text-[10px] text-slate-400 mt-1">Dosen wajib punya NIDN atau NUPTK. Dosen baru umumnya memakai NUPTK.</p>}
    </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
    <div className="sm:col-span-1">
      <label className="block text-[11px] font-bold text-slate-700 mb-1">Gelar Depan</label>
      <input
        type="text"
        placeholder="Dr. / Prof."
        value={formData.titlePrefix || ''}
        onChange={(e) => setFormData({ ...formData, titlePrefix: e.target.value })}
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
      />
    </div>
    <div className="sm:col-span-2">
      <label className="block text-[11px] font-bold text-slate-700 mb-1">
        Nama Lengkap (Tanpa Gelar) <span className="text-rose-500">*</span>
      </label>
      <input
        type="text"
        required
        placeholder="Contoh: Hendra Gunawan"
        value={formData.fullName}
        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
      />
    </div>
    <div className="sm:col-span-1">
      <label className="block text-[11px] font-bold text-slate-700 mb-1">Gelar Belakang</label>
      <input
        type="text"
        placeholder="M.Kom. / S.T."
        value={formData.titleSuffix || ''}
        onChange={(e) => setFormData({ ...formData, titleSuffix: e.target.value })}
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
      />
    </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
    <div>
      <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenis Kelamin</label>
      <select
        value={formData.gender}
        onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
      >
        <option value="Laki-laki">Laki-laki</option>
        <option value="Perempuan">Perempuan</option>
      </select>
    </div>
        </div>
      </div>

      {/* Seksi: Alamat */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#1E3A8A]" />
          <span>Alamat Domisili</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Provinsi</label>
            <SearchSelect
              value={ids.province}
              options={provinces.map((p) => ({ value: p.id, label: titleCase(p.name) }))}
              onChange={(v) => void onProvince(v)}
              placeholder={provinces.length ? '-- Pilih Provinsi --' : 'Memuat…'}
              searchPlaceholder="Cari provinsi…"
              fallbackLabel={formData.province}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Kota / Kabupaten</label>
            <SearchSelect
              value={ids.regency}
              options={regencies.map((r) => ({ value: r.id, label: titleCase(r.name) }))}
              onChange={(v) => void onRegency(v)}
              placeholder="-- Pilih Kota / Kabupaten --"
              searchPlaceholder="Cari kota / kabupaten…"
              disabled={!ids.province}
              fallbackLabel={formData.city}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Kecamatan</label>
            <SearchSelect
              value={ids.district}
              options={districts.map((d) => ({ value: d.id, label: titleCase(d.name) }))}
              onChange={(v) => void onDistrict(v)}
              placeholder="-- Pilih Kecamatan --"
              searchPlaceholder="Cari kecamatan…"
              disabled={!ids.regency}
              fallbackLabel={formData.kecamatan}
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Kelurahan / Desa</label>
            <SearchSelect
              value={villages.find((v) => sameName(v.name, formData.kelurahan || ''))?.id || ''}
              options={villages.map((v) => ({ value: v.id, label: titleCase(v.name) }))}
              onChange={(v) => setFormData({ ...formData, kelurahan: titleCase(villages.find((x) => x.id === v)?.name || '') })}
              placeholder="-- Pilih Kelurahan / Desa --"
              searchPlaceholder="Cari kelurahan / desa…"
              disabled={!ids.district}
              fallbackLabel={formData.kelurahan}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Alamat Jalan / No. Rumah</label>
            <input type="text" placeholder="Jl. Melati No. 12" value={formData.streetAddress || ''} onChange={(e) => setFormData({ ...formData, streetAddress: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A] disabled:bg-slate-100 disabled:text-slate-400" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">RT / RW</label>
            <input type="text" placeholder="001 / 002" value={formData.rtRw || ''} onChange={(e) => setFormData({ ...formData, rtRw: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A] disabled:bg-slate-100 disabled:text-slate-400" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Kode Pos</label>
            <input type="text" inputMode="numeric" placeholder="59311" value={formData.postalCode || ''} onChange={(e) => setFormData({ ...formData, postalCode: e.target.value.replace(/\D/g, '').slice(0, 5) })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A] disabled:bg-slate-100 disabled:text-slate-400" />
          </div>
        </div>
      </div>

      {/* Seksi: Pendidikan */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
          <GraduationCap className="w-4 h-4 text-[#1E3A8A]" />
          <span>Pendidikan Terakhir</span>
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenjang Pendidikan</label>
            <select value={formData.education} onChange={(e) => setFormData({ ...formData, education: e.target.value as any })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A] disabled:bg-slate-100 disabled:text-slate-400">
              <option value="D3">Diploma 3 (D3)</option>
              <option value="S1">Sarjana (S1)</option>
              <option value="Profesi">Profesi / Spesialis</option>
              <option value="S2">Magister (S2)</option>
              <option value="S3">Doktor (S3)</option>
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Tahun Lulus</label>
            <input type="text" inputMode="numeric" placeholder="Contoh: 2018" value={formData.graduationYear || ''} onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value.replace(/\D/g, '').slice(0, 4) })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A] disabled:bg-slate-100 disabled:text-slate-400" />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Perguruan Tinggi / Institusi</label>
            <UniversityPicker value={formData.educationInstitution || ''} onChange={(name) => setFormData({ ...formData, educationInstitution: name })} />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Program Studi / Bidang Ilmu</label>
            <input type="text" placeholder="Contoh: Pendidikan Matematika" value={formData.educationMajor || ''} onChange={(e) => setFormData({ ...formData, educationMajor: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A] disabled:bg-slate-100 disabled:text-slate-400" />
          </div>
        </div>
      </div>

      {/* Seksi 2: Jabatan & Unit Kerja */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
    <Briefcase className="w-4 h-4 text-[#1E3A8A]" />
    <span>Jabatan & Penempatan Institusi</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div>
      <label className="block text-[11px] font-bold text-slate-700 mb-1">Kategori Pegawai</label>
      <select
        value={formData.category}
        onChange={(e) => {
          const category = e.target.value;
          setFormData({ ...formData, category, ...(category.includes('Dosen') ? {} : { functionalPosition: '' }) });
        }}
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
      >
        <optgroup label="Akademik & Kependidikan">
          <option value="Tenaga Kependidikan">Tenaga Kependidikan (Tendik)</option>
          <option value="Dosen Tetap">Dosen Tetap</option>
          <option value="Dosen Luar Biasa">Dosen Luar Biasa</option>
        </optgroup>
        <optgroup label="Tenaga Penunjang">
          {supportCategoryOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </optgroup>
      </select>
    </div>

    <div>
      <label className="block text-[11px] font-bold text-slate-700 mb-1">Status Kepegawaian</label>
      <select
        value={formData.employmentStatus}
        onChange={(e) => {
          const employmentStatus = e.target.value as any;
          setFormData({ ...formData, employmentStatus, ...(employmentStatus === OUTSOURCING ? {} : { vendorName: '' }) });
        }}
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A] disabled:bg-slate-100 disabled:text-slate-500"
      >
        <option value="PNS / ASN">PNS / ASN</option>
        <option value="Tetap Yayasan">Pegawai Tetap Yayasan</option>
        <option value="Kontrak (PKWT)">Kontrak Waktu Tertentu (PKWT)</option>
        <option value="Honorer">Honorer / Part-Time</option>
        <option value="Outsourcing (Alih Daya)">Outsourcing (Alih Daya)</option>
      </select>
    </div>
        </div>

        {isOutsourcing && (
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Perusahaan Penyedia (Vendor) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Contoh: PT Karya Prima Sejahtera"
              value={formData.vendorName || ''}
              onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
            />
            <p className="text-[10px] text-slate-400 mt-1">Pegawai outsourcing dipekerjakan oleh vendor, bukan oleh yayasan.</p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-3">
    <div>
      <label className="block text-[11px] font-bold text-slate-700 mb-1">Unit Kerja / Biro / Fakultas</label>
      <select
        value={formData.department}
        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
      >
        {departmentOptions.filter((d) => d !== 'Semua Unit').map((dept) => (
          <option key={dept} value={dept}>
            {dept}
          </option>
        ))}
      </select>
    </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Jabatan Struktural
              </label>
              <select
                value={formData.structuralPosition || ''}
                onChange={(e) => setFormData({ ...formData, structuralPosition: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
              >
                <option value="">Tidak ada jabatan struktural</option>
                {structuralOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">{isSupport ? 'Opsional, mis. Kepala Regu / Koordinator Lapangan.' : 'Jabatan pimpinan/penugasan di unit. Kosongkan bila tidak ada.'}</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Jabatan Fungsional</label>
              <select
                value={isDosen ? formData.functionalPosition || '' : ''}
                disabled={!isDosen}
                onChange={(e) => setFormData({ ...formData, functionalPosition: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A] disabled:bg-slate-100 disabled:text-slate-400"
              >
                <option value="">{isDosen ? 'Belum ada jabatan fungsional' : 'Khusus dosen'}</option>
                {extraFunctional && <option value={extraFunctional}>{extraFunctional}</option>}
                {functionalDosenOptions.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Jabatan akademik khusus dosen. Tenaga kependidikan cukup mengisi jabatan struktural.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div>
      <label className="block text-[11px] font-bold text-slate-700 mb-1">Tanggal Mulai Bekerja (TMT)</label>
      <input
        type="date"
        value={formData.joinDate}
        onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
      />
    </div>
    <div>
      <label className="block text-[11px] font-bold text-slate-700 mb-1">Status Keaktifan</label>
      <select
        value={formData.status}
        onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
      >
        <option value="Aktif">Aktif Bekerja</option>
        <option value="Cuti">Cuti</option>
        <option value="Tugas Belajar">Tugas Belajar</option>
        <option value="Pensiun">Pensiun</option>
      </select>
    </div>
        </div>

        <div>
    <label className="block text-[11px] font-bold text-slate-700 mb-1">Shift Jam Kerja</label>
    <select
      value={formData.shiftId || ''}
      onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
    >
      <option value="">Ikut Shift Default</option>
      {shiftOptions.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
          {s.isDefault ? ' (Default)' : ''}
        </option>
      ))}
    </select>
        </div>
      </div>

      {/* Seksi 3: Kontak & Komunikasi */}
      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
        <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
    <Mail className="w-4 h-4 text-[#1E3A8A]" />
    <span>{isDosen ? 'Kontak & Akses Akun' : 'Kontak'}</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
    <div>
      <label className="block text-[11px] font-bold text-slate-700 mb-1">
        {isDosen ? 'Email Resmi Kampus' : 'Email Kontak (opsional)'} {isDosen && <span className="text-rose-500">*</span>}
      </label>
      <input
        type="email"
        placeholder="nama.pegawai@kampus.ac.id"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
      />
    </div>
    <div>
      <label className="block text-[11px] font-bold text-slate-700 mb-1">Nomor WhatsApp / Ponsel</label>
      <input
        type="tel"
        placeholder="0812-xxxx-xxxx"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-[#1E3A8A]"
      />
    </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
        <button
    type="button"
    onClick={onCancel}
    className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
        >
    Batal
        </button>
        <button
    type="submit"
    disabled={saving}
    className="px-5 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl shadow-xs transition-all disabled:opacity-50"
        >
    {saving ? 'Menyimpan…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
