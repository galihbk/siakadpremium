'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { getApiBaseUrl } from '@/lib/api';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Cake,
  IdCard,
  Landmark,
  RefreshCw,
  Loader2,
  KeyRound,
  CheckCircle2,
  Edit3,
  Save,
  X,
  ShieldCheck,
} from 'lucide-react';

interface LecturerDetail {
  id: string;
  studyProgramId?: string;
  nidn?: string;
  nuptk?: string;
  nip?: string;
  fullName: string;
  titlePrefix?: string;
  titleSuffix?: string;
  email: string;
  phone?: string;
  studyProgramName?: string;
  facultyCode?: string;
  facultyName?: string;
  isAcademicAdvisor: boolean;
  isActive: boolean;
  createdAt?: string;
  gender?: 'MALE' | 'FEMALE' | null;
  birthPlace?: string;
  birthDate?: string | null;
  employmentStatus?: string;
  functionalPosition?: string;
  lastEducation?: string;
  expertise?: string;
  religion?: string;
  address?: string;
  rtRw?: string;
  kelurahan?: string;
  kecamatan?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  structuralPosition?: 'DEKAN' | 'KAPRODI' | null;
  structuralFacultyName?: string | null;
  structuralStudyProgramName?: string | null;
  bpjsKesehatan?: string;
  bpjsKetenagakerjaan?: string;
}

interface RegionItem {
  id: string;
  name: string;
}

let allRegenciesCache: RegionItem[] | null = null;
let allRegenciesPromise: Promise<RegionItem[]> | null = null;

function loadAllRegencies(): Promise<RegionItem[]> {
  if (allRegenciesCache) return Promise.resolve(allRegenciesCache);
  if (allRegenciesPromise) return allRegenciesPromise;
  allRegenciesPromise = (async () => {
    try {
      const res = await fetch('/data/kabupaten-kota.json');
      const data: RegionItem[] = res.ok ? await res.json() : [];
      allRegenciesCache = data;
      return data;
    } catch {
      return [];
    }
  })();
  return allRegenciesPromise;
}

function formatRegionName(name: string) {
  return name.replace(/^KABUPATEN\s+/i, '').trim();
}

const EMPLOYMENT_STATUS_OPTIONS = [
  'Aktif',
  'Cuti',
  'Tugas Belajar',
  'Diperbantukan/Dipekerjakan (DPK)',
  'Pensiun',
  'Berhenti/Keluar',
  'Tidak Aktif',
];

const FUNCTIONAL_POSITION_OPTIONS = [
  'Tenaga Pengajar',
  'Asisten Ahli',
  'Lektor',
  'Lektor Kepala',
  'Guru Besar/Profesor',
];

const LAST_EDUCATION_OPTIONS = ['SMA/SMK Sederajat', 'D3', 'D4/S1', 'S2', 'S3'];

const EXPERTISE_OPTIONS = [
  'Pendidikan Guru Sekolah Dasar',
  'Pendidikan Ilmu Pengetahuan Alam',
  'Pendidikan Ekonomi',
  'Pedagogi',
  'Manajemen Pendidikan',
  'Teknologi Pendidikan',
  'Bimbingan dan Konseling',
  'Bahasa dan Sastra Indonesia',
  'Bahasa Inggris',
  'Matematika',
  'Teknik Informatika/Ilmu Komputer',
  'Hukum',
  'Ekonomi dan Bisnis',
  'Psikologi',
];

/** Select dengan value lama tetap muncul sebagai opsi kalau tidak ada di daftar standar -- supaya data lama yang teksnya bebas tidak hilang begitu diubah jadi dropdown. */
function PresetSelect({
  options,
  value,
  onChange,
  className,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  className: string;
}) {
  const allOptions = value && !options.includes(value) ? [value, ...options] : options;
  return (
    <select className={className} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">-- Pilih --</option>
      {allOptions.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}

let provincesCache: RegionItem[] | null = null;
let provincesPromise: Promise<RegionItem[]> | null = null;

function loadProvinces(): Promise<RegionItem[]> {
  if (provincesCache) return Promise.resolve(provincesCache);
  if (provincesPromise) return provincesPromise;
  provincesPromise = (async () => {
    try {
      const res = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
      const data: RegionItem[] = res.ok ? await res.json() : [];
      provincesCache = data;
      return data;
    } catch {
      return [];
    }
  })();
  return provincesPromise;
}

async function loadRegenciesByProvince(provinceId: string): Promise<RegionItem[]> {
  try {
    const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${provinceId}.json`);
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

async function loadDistrictsByRegency(regencyId: string): Promise<RegionItem[]> {
  try {
    const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/districts/${regencyId}.json`);
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

async function loadVillagesByDistrict(districtId: string): Promise<RegionItem[]> {
  try {
    const res = await fetch(`https://www.emsifa.com/api-wilayah-indonesia/api/villages/${districtId}.json`);
    return res.ok ? await res.json() : [];
  } catch {
    return [];
  }
}

function findRegionMatch(list: RegionItem[], name?: string): RegionItem | undefined {
  if (!name || name === '-') return undefined;
  const target = formatRegionName(name).toUpperCase().trim();
  return list.find((r) => {
    const candidate = formatRegionName(r.name).toUpperCase().trim();
    return candidate === target || candidate.includes(target) || target.includes(candidate);
  });
}

function dash(val?: string | number | null) {
  return val === undefined || val === null || val === '' || val === '-' ? '-' : val;
}

function InfoRow({ label, value }: { icon?: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800 break-words">{value || '-'}</p>
    </div>
  );
}

function EditField({
  label,
  children,
}: {
  icon?: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="py-2.5">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'mt-1 w-full px-2.5 py-1.5 text-sm font-semibold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  loading,
}: {
  options: RegionItem[];
  value: string;
  onChange: (name: string) => void;
  placeholder: string;
  loading?: boolean;
}) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setQuery(formatRegionName(value));
  }, [value]);

  const filtered =
    query.trim() === ''
      ? options.slice(0, 50)
      : options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase())).slice(0, 50);

  return (
    <div className="relative mt-1">
      <input
        className={inputCls + ' mt-0'}
        value={query}
        placeholder={loading ? 'Memuat daftar kabupaten/kota...' : placeholder}
        disabled={loading}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setTimeout(() => setIsOpen(false), 150)}
      />
      {isOpen && !loading && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto bg-white border border-slate-200 rounded-lg shadow-lg">
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-xs text-slate-400">Tidak ditemukan.</p>
          ) : (
            filtered.map((o) => (
              <button
                type="button"
                key={o.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  const formatted = formatRegionName(o.name);
                  onChange(formatted);
                  setQuery(formatted);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
              >
                {formatRegionName(o.name)}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

interface EditForm {
  fullName: string;
  titlePrefix: string;
  titleSuffix: string;
  nidn: string;
  nuptk: string;
  nip: string;
  gender: string;
  birthPlace: string;
  birthDate: string;
  religion: string;
  email: string;
  phone: string;
  address: string;
  rtRw: string;
  kelurahan: string;
  kecamatan: string;
  city: string;
  province: string;
  postalCode: string;
  employmentStatus: string;
  functionalPosition: string;
  lastEducation: string;
  expertise: string;
  studyProgramId: string;
  isAcademicAdvisor: boolean;
  bpjsKesehatan: string;
  bpjsKetenagakerjaan: string;
}

const TABS = [
  { key: 'identitas', label: 'Identitas', icon: IdCard },
  { key: 'kepegawaian', label: 'Kepegawaian & Akademik', icon: Briefcase },
  { key: 'penempatan', label: 'Penempatan & Jabatan', icon: Landmark },
  { key: 'tambahan', label: 'Data Tambahan', icon: ShieldCheck },
] as const;

type TabKey = (typeof TABS)[number]['key'];

interface DialogState {
  isOpen: boolean;
  title: string;
  message: React.ReactNode;
  type: 'danger' | 'warning' | 'info' | 'success';
  isAlert: boolean;
  confirmText?: string;
  isLoading: boolean;
  onConfirm?: () => void | Promise<void>;
}

const CLOSED_DIALOG: DialogState = {
  isOpen: false,
  title: '',
  message: '',
  type: 'warning',
  isAlert: false,
  isLoading: false,
};

export default function DosenDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const apiBase = getApiBaseUrl();

  const [lecturer, setLecturer] = useState<LecturerDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('identitas');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [studyPrograms, setStudyPrograms] = useState<{ id: string; name: string }[]>([]);
  const [regencyOptions, setRegencyOptions] = useState<RegionItem[]>([]);
  const [isLoadingRegencies, setIsLoadingRegencies] = useState(false);

  const [provinceOptions, setProvinceOptions] = useState<RegionItem[]>([]);
  const [cityOptions, setCityOptions] = useState<RegionItem[]>([]);
  const [districtOptions, setDistrictOptions] = useState<RegionItem[]>([]);
  const [villageOptions, setVillageOptions] = useState<RegionItem[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);
  const [dialogState, setDialogState] = useState<DialogState>(CLOSED_DIALOG);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchDetail = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${apiBase}/lecturers/${id}`);
      if (!res.ok) {
        setErrorMsg('Dosen tidak ditemukan.');
        return;
      }
      const json = await res.json();
      setLecturer(json.data || json);
    } catch (err) {
      setErrorMsg('Gagal memuat data dosen dari server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    fetch(`${apiBase}/study-programs`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const list = Array.isArray(json) ? json : json?.data || [];
        setStudyPrograms(list.map((p: any) => ({ id: p.id, name: p.name })));
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetAddressCascade = () => {
    setSelectedProvinceId('');
    setSelectedCityId('');
    setSelectedDistrictId('');
    setSelectedVillageId('');
    setCityOptions([]);
    setDistrictOptions([]);
    setVillageOptions([]);
  };

  const handleProvinceChange = async (provinceId: string) => {
    const prov = provinceOptions.find((p) => p.id === provinceId);
    setSelectedProvinceId(provinceId);
    setSelectedCityId('');
    setSelectedDistrictId('');
    setSelectedVillageId('');
    setCityOptions([]);
    setDistrictOptions([]);
    setVillageOptions([]);
    setEditForm((prev) => (prev ? { ...prev, province: prov ? formatRegionName(prov.name) : '', city: '', kecamatan: '', kelurahan: '' } : prev));
    if (!provinceId) return;
    setIsLoadingCities(true);
    try {
      const list = await loadRegenciesByProvince(provinceId);
      setCityOptions(list);
    } finally {
      setIsLoadingCities(false);
    }
  };

  const handleCityChange = async (cityId: string) => {
    const city = cityOptions.find((c) => c.id === cityId);
    setSelectedCityId(cityId);
    setSelectedDistrictId('');
    setSelectedVillageId('');
    setDistrictOptions([]);
    setVillageOptions([]);
    setEditForm((prev) => (prev ? { ...prev, city: city ? formatRegionName(city.name) : '', kecamatan: '', kelurahan: '' } : prev));
    if (!cityId) return;
    setIsLoadingDistricts(true);
    try {
      const list = await loadDistrictsByRegency(cityId);
      setDistrictOptions(list);
    } finally {
      setIsLoadingDistricts(false);
    }
  };

  const handleDistrictChange = async (districtId: string) => {
    const district = districtOptions.find((d) => d.id === districtId);
    setSelectedDistrictId(districtId);
    setSelectedVillageId('');
    setVillageOptions([]);
    setEditForm((prev) => (prev ? { ...prev, kecamatan: district ? formatRegionName(district.name) : '', kelurahan: '' } : prev));
    if (!districtId) return;
    setIsLoadingVillages(true);
    try {
      const list = await loadVillagesByDistrict(districtId);
      setVillageOptions(list);
    } finally {
      setIsLoadingVillages(false);
    }
  };

  const startEdit = async () => {
    if (!lecturer) return;
    if (regencyOptions.length === 0) {
      setIsLoadingRegencies(true);
      loadAllRegencies()
        .then(setRegencyOptions)
        .finally(() => setIsLoadingRegencies(false));
    }
    resetAddressCascade();
    setEditForm({
      fullName: lecturer.fullName || '',
      titlePrefix: lecturer.titlePrefix || '',
      titleSuffix: lecturer.titleSuffix || '',
      nidn: lecturer.nidn && lecturer.nidn !== '-' ? lecturer.nidn : '',
      nuptk: lecturer.nuptk && lecturer.nuptk !== '-' ? lecturer.nuptk : '',
      nip: lecturer.nip && lecturer.nip !== '-' ? lecturer.nip : '',
      gender: lecturer.gender || '',
      birthPlace: lecturer.birthPlace && lecturer.birthPlace !== '-' ? lecturer.birthPlace : '',
      birthDate: lecturer.birthDate ? new Date(lecturer.birthDate).toISOString().slice(0, 10) : '',
      religion: lecturer.religion && lecturer.religion !== '-' ? lecturer.religion : '',
      email: lecturer.email || '',
      phone: lecturer.phone && lecturer.phone !== '-' ? lecturer.phone : '',
      address: lecturer.address && lecturer.address !== '-' ? lecturer.address : '',
      rtRw: lecturer.rtRw && lecturer.rtRw !== '-' ? lecturer.rtRw : '',
      kelurahan: lecturer.kelurahan && lecturer.kelurahan !== '-' ? lecturer.kelurahan : '',
      kecamatan: lecturer.kecamatan && lecturer.kecamatan !== '-' ? lecturer.kecamatan : '',
      city: lecturer.city && lecturer.city !== '-' ? lecturer.city : '',
      province: lecturer.province && lecturer.province !== '-' ? lecturer.province : '',
      postalCode: lecturer.postalCode && lecturer.postalCode !== '-' ? lecturer.postalCode : '',
      employmentStatus: lecturer.employmentStatus && lecturer.employmentStatus !== '-' ? lecturer.employmentStatus : '',
      functionalPosition: lecturer.functionalPosition && lecturer.functionalPosition !== '-' ? lecturer.functionalPosition : '',
      lastEducation: lecturer.lastEducation && lecturer.lastEducation !== '-' ? lecturer.lastEducation : '',
      expertise: lecturer.expertise && lecturer.expertise !== '-' ? lecturer.expertise : '',
      studyProgramId: lecturer.studyProgramId || '',
      isAcademicAdvisor: lecturer.isAcademicAdvisor,
      bpjsKesehatan: lecturer.bpjsKesehatan && lecturer.bpjsKesehatan !== '-' ? lecturer.bpjsKesehatan : '',
      bpjsKetenagakerjaan: lecturer.bpjsKetenagakerjaan && lecturer.bpjsKetenagakerjaan !== '-' ? lecturer.bpjsKetenagakerjaan : '',
    });
    setIsEditing(true);

    // Prefill cascading Provinsi -> Kab/Kota -> Kecamatan -> Kelurahan dari data yang sudah ada
    setIsLoadingAddress(true);
    try {
      const provinces = provinceOptions.length > 0 ? provinceOptions : await loadProvinces();
      if (provinceOptions.length === 0) setProvinceOptions(provinces);
      const provMatch = findRegionMatch(provinces, lecturer.province);
      if (!provMatch) return;
      setSelectedProvinceId(provMatch.id);

      const cities = await loadRegenciesByProvince(provMatch.id);
      setCityOptions(cities);
      const cityMatch = findRegionMatch(cities, lecturer.city);
      if (!cityMatch) return;
      setSelectedCityId(cityMatch.id);

      const districts = await loadDistrictsByRegency(cityMatch.id);
      setDistrictOptions(districts);
      const districtMatch = findRegionMatch(districts, lecturer.kecamatan);
      if (!districtMatch) return;
      setSelectedDistrictId(districtMatch.id);

      const villages = await loadVillagesByDistrict(districtMatch.id);
      setVillageOptions(villages);
      const villageMatch = findRegionMatch(villages, lecturer.kelurahan);
      if (villageMatch) setSelectedVillageId(villageMatch.id);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const saveEdit = async () => {
    if (!lecturer || !editForm) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${apiBase}/lecturers/${lecturer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          gender: editForm.gender || undefined,
          birthDate: editForm.birthDate || null,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Gagal menyimpan perubahan.');
      }
      showToast('Data dosen berhasil diperbarui.');
      setIsEditing(false);
      setEditForm(null);
      await fetchDetail();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetPassword = () => {
    if (!lecturer) return;
    setDialogState({
      isOpen: true,
      title: 'Reset Password Dosen',
      message: `Reset password dosen "${lecturer.fullName}" ke default (tanggal lahir format DDMMYYYY)?`,
      type: 'warning',
      isAlert: false,
      confirmText: 'Ya, Reset Password',
      isLoading: false,
      onConfirm: async () => {
        setDialogState((prev) => ({ ...prev, isLoading: true }));
        setIsResetting(true);
        try {
          let defaultPassword: string | undefined;
          if (lecturer.birthDate) {
            const d = new Date(lecturer.birthDate);
            defaultPassword = `${String(d.getDate()).padStart(2, '0')}${String(d.getMonth() + 1).padStart(2, '0')}${d.getFullYear()}`;
          }
          const res = await fetch(`${apiBase}/lecturers/${lecturer.id}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword: defaultPassword }),
          });
          if (!res.ok) throw new Error('Gagal mereset password.');
          setDialogState(CLOSED_DIALOG);
          showToast(
            defaultPassword
              ? `Password direset ke tanggal lahir: ${defaultPassword}`
              : 'Password berhasil direset ke default sistem.'
          );
        } catch (err) {
          setDialogState(CLOSED_DIALOG);
          showToast(err instanceof Error ? err.message : 'Gagal mereset password.');
        } finally {
          setIsResetting(false);
        }
      },
    });
  };

  return (
    <PortalLayout role="admin" userName="Admin BAAK" userIdText="Biro Administrasi Akademik & Kemahasiswaan">
      <div className="w-full space-y-6 pb-12">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/admin/dosen" className="hover:text-blue-600 transition-colors font-medium">
            Data Dosen
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-semibold">{lecturer?.fullName || 'Detail'}</span>
        </div>

        <button
          onClick={() => router.push('/admin/dosen')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Data Dosen
        </button>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Memuat data dosen...</p>
          </div>
        ) : errorMsg || !lecturer ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">
            <p className="text-sm font-semibold text-slate-700">{errorMsg || 'Data tidak ditemukan.'}</p>
            <button
              onClick={fetchDetail}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Coba lagi
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* Kolom Kiri: Foto Profil & Ringkasan */}
            <div className="w-full lg:w-72 shrink-0 space-y-4 lg:sticky lg:top-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 text-center">
                <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-tr from-[#1E3A8A] to-blue-600 text-white flex items-center justify-center text-3xl font-black border-4 border-blue-50 shadow-sm">
                  {lecturer.fullName.charAt(0).toUpperCase()}
                </div>
                <h1 className="mt-4 text-base font-black text-slate-900 leading-snug">
                  {[lecturer.titlePrefix, lecturer.fullName].filter(Boolean).join(' ')}
                  {lecturer.titleSuffix ? `, ${lecturer.titleSuffix}` : ''}
                </h1>
                <p className="text-xs text-slate-500 mt-1">{dash(lecturer.studyProgramName)}</p>
                <p className="text-[11px] text-slate-400">{dash(lecturer.facultyName)}</p>

                <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      lecturer.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {lecturer.isActive ? 'AKTIF' : 'NONAKTIF'}
                  </span>
                  {lecturer.structuralPosition === 'DEKAN' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Dekan {lecturer.structuralFacultyName}
                    </span>
                  )}
                  {lecturer.structuralPosition === 'KAPRODI' && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                      Kaprodi {lecturer.structuralStudyProgramName}
                    </span>
                  )}
                </div>

                {isEditing ? (
                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={saveEdit}
                      disabled={isSaving}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Simpan
                    </button>
                    <button
                      onClick={cancelEdit}
                      disabled={isSaving}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-5 flex gap-2">
                    <button
                      onClick={startEdit}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={handleResetPassword}
                      disabled={isResetting}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#1E3A8A] hover:bg-blue-900 text-white transition-colors disabled:opacity-60 cursor-pointer"
                    >
                      {isResetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <KeyRound className="w-3.5 h-3.5" />}
                      Reset
                    </button>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="break-all">{lecturer.email}</span>
                </div>
                {lecturer.phone && dash(lecturer.phone) !== '-' && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{lecturer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-600">
                  <IdCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono">{dash(lecturer.nidn)}</span>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Tab Data Akademik, Kontak, dll */}
            <div className="flex-1 min-w-0 w-full">
              <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto mb-5">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                      activeTab === tab.key
                        ? 'border-[#1E3A8A] text-[#1E3A8A]'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === 'identitas' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <IdCard className="w-4 h-4 text-[#1E3A8A]" /> Identitas
                    </h2>
                    {isEditing && editForm ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                        <EditField icon={IdCard} label="Nama Lengkap">
                          <input className={inputCls} value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
                        </EditField>
                        <EditField icon={IdCard} label="Gelar Depan / Belakang">
                          <div className="flex gap-2 mt-1">
                            <input className={inputCls + ' mt-0'} placeholder="Depan" value={editForm.titlePrefix} onChange={(e) => setEditForm({ ...editForm, titlePrefix: e.target.value })} />
                            <input className={inputCls + ' mt-0'} placeholder="Belakang" value={editForm.titleSuffix} onChange={(e) => setEditForm({ ...editForm, titleSuffix: e.target.value })} />
                          </div>
                        </EditField>
                        <EditField icon={IdCard} label="NIDN">
                          <input className={inputCls} value={editForm.nidn} onChange={(e) => setEditForm({ ...editForm, nidn: e.target.value })} />
                        </EditField>
                        <EditField icon={IdCard} label="NUPTK">
                          <input className={inputCls} value={editForm.nuptk} onChange={(e) => setEditForm({ ...editForm, nuptk: e.target.value })} />
                        </EditField>
                        <EditField icon={IdCard} label="NIP">
                          <input className={inputCls} value={editForm.nip} onChange={(e) => setEditForm({ ...editForm, nip: e.target.value })} />
                        </EditField>
                        <EditField icon={Cake} label="Tempat Lahir">
                          <SearchableSelect
                            options={regencyOptions}
                            value={editForm.birthPlace}
                            onChange={(name) => setEditForm({ ...editForm, birthPlace: name })}
                            placeholder="Ketik untuk mencari kabupaten/kota..."
                            loading={isLoadingRegencies}
                          />
                        </EditField>
                        <EditField icon={Cake} label="Tanggal Lahir">
                          <input type="date" className={inputCls} value={editForm.birthDate} onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })} />
                        </EditField>
                        <EditField icon={IdCard} label="Jenis Kelamin">
                          <select className={inputCls} value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
                            <option value="">-</option>
                            <option value="MALE">Laki-laki</option>
                            <option value="FEMALE">Perempuan</option>
                          </select>
                        </EditField>
                        <EditField icon={IdCard} label="Agama">
                          <input className={inputCls} value={editForm.religion} onChange={(e) => setEditForm({ ...editForm, religion: e.target.value })} />
                        </EditField>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-slate-50">
                        <InfoRow icon={IdCard} label="NIDN" value={dash(lecturer.nidn)} />
                        <InfoRow icon={IdCard} label="NUPTK" value={dash(lecturer.nuptk)} />
                        <InfoRow icon={IdCard} label="NIP" value={dash(lecturer.nip)} />
                        <InfoRow
                          icon={Cake}
                          label="Tempat, Tanggal Lahir"
                          value={
                            dash(lecturer.birthPlace) !== '-' || lecturer.birthDate
                              ? `${dash(lecturer.birthPlace) !== '-' ? formatRegionName(lecturer.birthPlace as string) : ''}${
                                  lecturer.birthDate
                                    ? `, ${new Date(lecturer.birthDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`
                                    : ''
                                }`
                              : '-'
                          }
                        />
                        <InfoRow icon={IdCard} label="Jenis Kelamin" value={lecturer.gender === 'MALE' ? 'Laki-laki' : lecturer.gender === 'FEMALE' ? 'Perempuan' : '-'} />
                        <InfoRow icon={IdCard} label="Agama" value={dash(lecturer.religion)} />
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#1E3A8A]" /> Kontak & Alamat
                    </h2>
                    {isEditing && editForm ? (
                      <div className="space-y-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                          <EditField icon={Mail} label="Email">
                            <input className={inputCls} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                          </EditField>
                          <EditField icon={Phone} label="No. HP">
                            <input className={inputCls} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                          </EditField>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                          <EditField icon={MapPin} label="Provinsi">
                            <select
                              className={inputCls}
                              value={selectedProvinceId}
                              disabled={isLoadingAddress}
                              onChange={(e) => handleProvinceChange(e.target.value)}
                            >
                              <option value="">{isLoadingAddress ? 'Memuat...' : '-- Pilih Provinsi --'}</option>
                              {provinceOptions.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {formatRegionName(p.name)}
                                </option>
                              ))}
                            </select>
                          </EditField>
                          <EditField icon={MapPin} label="Kabupaten/Kota">
                            <select
                              className={inputCls}
                              value={selectedCityId}
                              disabled={!selectedProvinceId || isLoadingCities || isLoadingAddress}
                              onChange={(e) => handleCityChange(e.target.value)}
                            >
                              <option value="">
                                {isLoadingCities ? 'Memuat...' : !selectedProvinceId ? '-- Pilih Provinsi Dahulu --' : '-- Pilih Kab/Kota --'}
                              </option>
                              {cityOptions.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {formatRegionName(c.name)}
                                </option>
                              ))}
                            </select>
                          </EditField>
                          <EditField icon={MapPin} label="Kecamatan">
                            <select
                              className={inputCls}
                              value={selectedDistrictId}
                              disabled={!selectedCityId || isLoadingDistricts || isLoadingAddress}
                              onChange={(e) => handleDistrictChange(e.target.value)}
                            >
                              <option value="">
                                {isLoadingDistricts ? 'Memuat...' : !selectedCityId ? '-- Pilih Kab/Kota Dahulu --' : '-- Pilih Kecamatan --'}
                              </option>
                              {districtOptions.map((d) => (
                                <option key={d.id} value={d.id}>
                                  {formatRegionName(d.name)}
                                </option>
                              ))}
                            </select>
                          </EditField>
                          <EditField icon={MapPin} label="Kelurahan/Desa">
                            <input
                              className={inputCls}
                              list="kelurahan-suggestions"
                              value={editForm.kelurahan}
                              placeholder={isLoadingVillages ? 'Memuat saran...' : 'Ketik manual kalau tidak ada di saran'}
                              onChange={(e) => {
                                setSelectedVillageId('');
                                setEditForm({ ...editForm, kelurahan: e.target.value });
                              }}
                            />
                            <datalist id="kelurahan-suggestions">
                              {villageOptions.map((v) => (
                                <option key={v.id} value={formatRegionName(v.name)} />
                              ))}
                            </datalist>
                          </EditField>
                        </div>
                        <div className="grid grid-cols-1 gap-y-1">
                          <EditField icon={MapPin} label="Alamat Jalan">
                            <textarea
                              rows={3}
                              className={inputCls}
                              value={editForm.address}
                              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            />
                          </EditField>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1">
                          <EditField icon={MapPin} label="RT">
                            <input
                              className={inputCls}
                              value={editForm.rtRw.split('/')[0] || ''}
                              onChange={(e) => {
                                const rw = editForm.rtRw.split('/')[1] || '';
                                setEditForm({ ...editForm, rtRw: `${e.target.value}/${rw}` });
                              }}
                            />
                          </EditField>
                          <EditField icon={MapPin} label="RW">
                            <input
                              className={inputCls}
                              value={editForm.rtRw.split('/')[1] || ''}
                              onChange={(e) => {
                                const rt = editForm.rtRw.split('/')[0] || '';
                                setEditForm({ ...editForm, rtRw: `${rt}/${e.target.value}` });
                              }}
                            />
                          </EditField>
                          <EditField icon={MapPin} label="Kode Pos">
                            <input className={inputCls} value={editForm.postalCode} onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })} />
                          </EditField>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-slate-50">
                        <InfoRow label="Email" value={lecturer.email} />
                        <InfoRow label="No. HP" value={dash(lecturer.phone)} />
                        <InfoRow label="Provinsi" value={dash(lecturer.province && lecturer.province !== '-' ? formatRegionName(lecturer.province) : lecturer.province)} />
                        <InfoRow label="Kabupaten/Kota" value={dash(lecturer.city && lecturer.city !== '-' ? formatRegionName(lecturer.city) : lecturer.city)} />
                        <InfoRow label="Kecamatan" value={dash(lecturer.kecamatan && lecturer.kecamatan !== '-' ? formatRegionName(lecturer.kecamatan) : lecturer.kecamatan)} />
                        <InfoRow label="Kelurahan/Desa" value={dash(lecturer.kelurahan && lecturer.kelurahan !== '-' ? formatRegionName(lecturer.kelurahan) : lecturer.kelurahan)} />
                        <InfoRow label="Alamat Jalan" value={dash(lecturer.address)} />
                        <InfoRow label="RT/RW" value={dash(lecturer.rtRw)} />
                        <InfoRow label="Kode Pos" value={dash(lecturer.postalCode)} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'kepegawaian' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
                  {isEditing && editForm ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                      <EditField icon={Briefcase} label="Status Kepegawaian">
                        <PresetSelect
                          className={inputCls}
                          options={EMPLOYMENT_STATUS_OPTIONS}
                          value={editForm.employmentStatus}
                          onChange={(v) => setEditForm({ ...editForm, employmentStatus: v })}
                        />
                      </EditField>
                      <EditField icon={Briefcase} label="Jabatan Fungsional">
                        <PresetSelect
                          className={inputCls}
                          options={FUNCTIONAL_POSITION_OPTIONS}
                          value={editForm.functionalPosition}
                          onChange={(v) => setEditForm({ ...editForm, functionalPosition: v })}
                        />
                      </EditField>
                      <EditField icon={GraduationCap} label="Pendidikan Terakhir">
                        <PresetSelect
                          className={inputCls}
                          options={LAST_EDUCATION_OPTIONS}
                          value={editForm.lastEducation}
                          onChange={(v) => setEditForm({ ...editForm, lastEducation: v })}
                        />
                      </EditField>
                      <EditField icon={GraduationCap} label="Bidang Keahlian">
                        <PresetSelect
                          className={inputCls}
                          options={EXPERTISE_OPTIONS}
                          value={editForm.expertise}
                          onChange={(v) => setEditForm({ ...editForm, expertise: v })}
                        />
                      </EditField>
                      <EditField icon={CheckCircle2} label="Dosen Pembimbing Akademik (PA)">
                        <select
                          className={inputCls}
                          value={editForm.isAcademicAdvisor ? 'true' : 'false'}
                          onChange={(e) => setEditForm({ ...editForm, isAcademicAdvisor: e.target.value === 'true' })}
                        >
                          <option value="false">Tidak</option>
                          <option value="true">Ya</option>
                        </select>
                      </EditField>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-slate-50">
                      <InfoRow icon={Briefcase} label="Status Kepegawaian" value={dash(lecturer.employmentStatus)} />
                      <InfoRow icon={Briefcase} label="Jabatan Fungsional" value={dash(lecturer.functionalPosition)} />
                      <InfoRow icon={GraduationCap} label="Pendidikan Terakhir" value={dash(lecturer.lastEducation)} />
                      <InfoRow icon={GraduationCap} label="Bidang Keahlian" value={dash(lecturer.expertise)} />
                      <InfoRow icon={CheckCircle2} label="Dosen Pembimbing Akademik (PA)" value={lecturer.isAcademicAdvisor ? 'Ya' : 'Tidak'} />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'penempatan' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
                  {isEditing && editForm ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                        <EditField icon={GraduationCap} label="Program Studi Home Base">
                          <select
                            className={inputCls}
                            value={editForm.studyProgramId}
                            onChange={(e) => setEditForm({ ...editForm, studyProgramId: e.target.value })}
                          >
                            <option value="">-</option>
                            {studyPrograms.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </EditField>
                        <InfoRow icon={Landmark} label="Fakultas" value={dash(lecturer.facultyName)} />
                        <InfoRow
                          icon={Landmark}
                          label="Jabatan Struktural"
                          value={
                            lecturer.structuralPosition === 'DEKAN'
                              ? `Dekan — ${lecturer.structuralFacultyName}`
                              : lecturer.structuralPosition === 'KAPRODI'
                                ? `Kaprodi — ${lecturer.structuralStudyProgramName}`
                                : 'Tidak ada'
                          }
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-3">
                        Fakultas mengikuti Program Studi secara otomatis. Jabatan struktural (Dekan/Kaprodi) diatur lewat menu Data Dosen di Super Admin.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-slate-50">
                        <InfoRow icon={GraduationCap} label="Program Studi Home Base" value={dash(lecturer.studyProgramName)} />
                        <InfoRow icon={Landmark} label="Fakultas" value={dash(lecturer.facultyName)} />
                        <InfoRow
                          icon={Landmark}
                          label="Jabatan Struktural"
                          value={
                            lecturer.structuralPosition === 'DEKAN'
                              ? `Dekan — ${lecturer.structuralFacultyName}`
                              : lecturer.structuralPosition === 'KAPRODI'
                                ? `Kaprodi — ${lecturer.structuralStudyProgramName}`
                                : 'Tidak ada'
                          }
                        />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-3">
                        Jabatan struktural (Dekan/Kaprodi) diatur lewat menu Data Dosen di Super Admin.
                      </p>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'tambahan' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
                  {isEditing && editForm ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                      <EditField icon={ShieldCheck} label="No. BPJS Kesehatan">
                        <input
                          className={inputCls}
                          value={editForm.bpjsKesehatan}
                          onChange={(e) => setEditForm({ ...editForm, bpjsKesehatan: e.target.value })}
                        />
                      </EditField>
                      <EditField icon={ShieldCheck} label="No. BPJS Ketenagakerjaan">
                        <input
                          className={inputCls}
                          value={editForm.bpjsKetenagakerjaan}
                          onChange={(e) => setEditForm({ ...editForm, bpjsKetenagakerjaan: e.target.value })}
                        />
                      </EditField>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-slate-50">
                      <InfoRow icon={ShieldCheck} label="No. BPJS Kesehatan" value={dash(lecturer.bpjsKesehatan)} />
                      <InfoRow icon={ShieldCheck} label="No. BPJS Ketenagakerjaan" value={dash(lecturer.bpjsKetenagakerjaan)} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-blue-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <ConfirmModal
        isOpen={dialogState.isOpen}
        onClose={() => (dialogState.isLoading ? null : setDialogState(CLOSED_DIALOG))}
        onConfirm={dialogState.onConfirm}
        title={dialogState.title}
        message={dialogState.message}
        type={dialogState.type}
        isAlert={dialogState.isAlert}
        confirmText={dialogState.confirmText}
        isLoading={dialogState.isLoading}
      />
    </PortalLayout>
  );
}
