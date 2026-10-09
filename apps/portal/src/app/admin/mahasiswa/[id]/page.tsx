'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  IdCard,
  Landmark,
  RefreshCw,
  Loader2,
  Users,
  School,
  Edit3,
  Save,
  X,
} from 'lucide-react';

interface StudentDetail {
  id: string;
  nim: string;
  fullName: string;
  email: string;
  isActive: boolean;
  gender: 'MALE' | 'FEMALE';
  birthDate?: string | null;
  birthPlace?: string;
  phone?: string;
  nik?: string;
  nisn?: string;
  noKk?: string;
  religion?: string;
  address?: string;
  streetAddress?: string;
  rtRw?: string;
  dusun?: string;
  kelurahan?: string;
  kecamatan?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  studyProgramId?: string;
  studyProgramName?: string;
  facultyName?: string;
  entryYear: number;
  currentSemester: number;
  status: 'ACTIVE' | 'LEAVE' | 'GRADUATED' | 'DROPOUT' | 'TRANSFERRED';
  ipk: number;
  totalSks: number;
  schoolName?: string;
  npsn?: string;
  graduationYear?: string;
  major?: string;
  fatherName?: string;
  fatherPhone?: string;
  fatherJob?: string;
  fatherIncome?: string;
  motherName?: string;
  motherPhone?: string;
  motherJob?: string;
  motherIncome?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianJob?: string;
  advisorLecturerId?: string | null;
  advisorLecturerName?: string | null;
}

interface RegionItem {
  id: string;
  name: string;
}

function formatRegionName(name: string) {
  return name.replace(/^KABUPATEN\s+/i, '').trim();
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

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-2.5">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="text-sm font-semibold text-slate-800 break-words">{value || '-'}</p>
    </div>
  );
}

function EditField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-2.5">
      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  'mt-1 w-full px-2.5 py-1.5 text-sm font-semibold text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

const STATUS_LABEL: Record<StudentDetail['status'], string> = {
  ACTIVE: 'Aktif',
  LEAVE: 'Cuti',
  GRADUATED: 'Lulus',
  DROPOUT: 'Drop Out',
  TRANSFERRED: 'Pindah',
};

const STATUS_COLOR: Record<StudentDetail['status'], string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  LEAVE: 'bg-amber-100 text-amber-700',
  GRADUATED: 'bg-blue-100 text-blue-700',
  DROPOUT: 'bg-rose-100 text-rose-700',
  TRANSFERRED: 'bg-slate-100 text-slate-600',
};

const TABS = [
  { key: 'identitas', label: 'Identitas & Alamat', icon: IdCard },
  { key: 'akademik', label: 'Akademik', icon: GraduationCap },
  { key: 'sekolah', label: 'Sekolah Asal', icon: School },
  { key: 'ortu', label: 'Orang Tua / Wali', icon: Users },
] as const;

type TabKey = (typeof TABS)[number]['key'];

interface EditForm {
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  birthPlace: string;
  birthDate: string;
  religion: string;
  nik: string;
  nisn: string;
  noKk: string;
  address: string;
  rtRw: string;
  dusun: string;
  kelurahan: string;
  kecamatan: string;
  city: string;
  province: string;
  postalCode: string;
  studyProgramId: string;
  advisorLecturerId: string;
  entryYear: string;
  currentSemester: string;
  status: string;
  schoolName: string;
  npsn: string;
  graduationYear: string;
  major: string;
  fatherName: string;
  fatherPhone: string;
  fatherJob: string;
  fatherIncome: string;
  motherName: string;
  motherPhone: string;
  motherJob: string;
  motherIncome: string;
  guardianName: string;
  guardianPhone: string;
  guardianJob: string;
}

export default function MahasiswaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const apiBase = getApiBaseUrl();

  const [student, setStudent] = useState<StudentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('identitas');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [studyPrograms, setStudyPrograms] = useState<{ id: string; name: string }[]>([]);
  const [lecturers, setLecturers] = useState<{ id: string; fullName: string }[]>([]);
  const [advisorCounts, setAdvisorCounts] = useState<Record<string, number>>({});

  const [provinceOptions, setProvinceOptions] = useState<RegionItem[]>([]);
  const [cityOptions, setCityOptions] = useState<RegionItem[]>([]);
  const [districtOptions, setDistrictOptions] = useState<RegionItem[]>([]);
  const [villageOptions, setVillageOptions] = useState<RegionItem[]>([]);
  const [selectedProvinceId, setSelectedProvinceId] = useState('');
  const [selectedCityId, setSelectedCityId] = useState('');
  const [selectedDistrictId, setSelectedDistrictId] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingDistricts, setIsLoadingDistricts] = useState(false);
  const [isLoadingVillages, setIsLoadingVillages] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchDetail = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`${apiBase}/students/${id}`);
      if (!res.ok) {
        setErrorMsg('Mahasiswa tidak ditemukan.');
        return;
      }
      const json = await res.json();
      setStudent(json.data || json);
    } catch (err) {
      setErrorMsg('Gagal memuat data mahasiswa dari server.');
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
    fetch(`${apiBase}/lecturers`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const list = Array.isArray(json) ? json : json?.data || [];
        setLecturers(list.map((l: any) => ({ id: l.id, fullName: l.fullName })));
      })
      .catch(() => {});
    fetch(`${apiBase}/students/advisor-counts`)
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        const result = json?.data ?? json;
        if (result && typeof result === 'object') setAdvisorCounts(result);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetAddressCascade = () => {
    setSelectedProvinceId('');
    setSelectedCityId('');
    setSelectedDistrictId('');
    setCityOptions([]);
    setDistrictOptions([]);
    setVillageOptions([]);
  };

  const handleProvinceChange = async (provinceId: string) => {
    const prov = provinceOptions.find((p) => p.id === provinceId);
    setSelectedProvinceId(provinceId);
    setSelectedCityId('');
    setSelectedDistrictId('');
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
    if (!student) return;
    resetAddressCascade();
    setEditForm({
      fullName: student.fullName || '',
      email: student.email || '',
      phone: dash(student.phone) !== '-' ? student.phone! : '',
      gender: student.gender || '',
      birthPlace: dash(student.birthPlace) !== '-' ? student.birthPlace! : '',
      birthDate: student.birthDate ? new Date(student.birthDate).toISOString().slice(0, 10) : '',
      religion: dash(student.religion) !== '-' ? student.religion! : '',
      nik: dash(student.nik) !== '-' ? student.nik! : '',
      nisn: dash(student.nisn) !== '-' ? student.nisn! : '',
      noKk: dash(student.noKk) !== '-' ? student.noKk! : '',
      address: dash(student.streetAddress || student.address) !== '-' ? (student.streetAddress || student.address)! : '',
      rtRw: dash(student.rtRw) !== '-' ? student.rtRw! : '',
      dusun: dash(student.dusun) !== '-' ? student.dusun! : '',
      kelurahan: dash(student.kelurahan) !== '-' ? student.kelurahan! : '',
      kecamatan: dash(student.kecamatan) !== '-' ? student.kecamatan! : '',
      city: dash(student.city) !== '-' ? student.city! : '',
      province: dash(student.province) !== '-' ? student.province! : '',
      postalCode: dash(student.postalCode) !== '-' ? student.postalCode! : '',
      studyProgramId: student.studyProgramId || '',
      advisorLecturerId: student.advisorLecturerId || '',
      entryYear: String(student.entryYear || ''),
      currentSemester: String(student.currentSemester || ''),
      status: student.status || 'ACTIVE',
      schoolName: dash(student.schoolName) !== '-' ? student.schoolName! : '',
      npsn: dash(student.npsn) !== '-' ? student.npsn! : '',
      graduationYear: dash(student.graduationYear) !== '-' ? student.graduationYear! : '',
      major: dash(student.major) !== '-' ? student.major! : '',
      fatherName: dash(student.fatherName) !== '-' ? student.fatherName! : '',
      fatherPhone: dash(student.fatherPhone) !== '-' ? student.fatherPhone! : '',
      fatherJob: dash(student.fatherJob) !== '-' ? student.fatherJob! : '',
      fatherIncome: dash(student.fatherIncome) !== '-' ? student.fatherIncome! : '',
      motherName: dash(student.motherName) !== '-' ? student.motherName! : '',
      motherPhone: dash(student.motherPhone) !== '-' ? student.motherPhone! : '',
      motherJob: dash(student.motherJob) !== '-' ? student.motherJob! : '',
      motherIncome: dash(student.motherIncome) !== '-' ? student.motherIncome! : '',
      guardianName: dash(student.guardianName) !== '-' ? student.guardianName! : '',
      guardianPhone: dash(student.guardianPhone) !== '-' ? student.guardianPhone! : '',
      guardianJob: dash(student.guardianJob) !== '-' ? student.guardianJob! : '',
    });
    setIsEditing(true);

    setIsLoadingAddress(true);
    try {
      const provinces = provinceOptions.length > 0 ? provinceOptions : await loadProvinces();
      if (provinceOptions.length === 0) setProvinceOptions(provinces);
      const provMatch = findRegionMatch(provinces, student.province);
      if (!provMatch) return;
      setSelectedProvinceId(provMatch.id);

      const cities = await loadRegenciesByProvince(provMatch.id);
      setCityOptions(cities);
      const cityMatch = findRegionMatch(cities, student.city);
      if (!cityMatch) return;
      setSelectedCityId(cityMatch.id);

      const districts = await loadDistrictsByRegency(cityMatch.id);
      setDistrictOptions(districts);
      const districtMatch = findRegionMatch(districts, student.kecamatan);
      if (!districtMatch) return;
      setSelectedDistrictId(districtMatch.id);

      const villages = await loadVillagesByDistrict(districtMatch.id);
      setVillageOptions(villages);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditForm(null);
  };

  const saveEdit = async () => {
    if (!student || !editForm) return;
    setIsSaving(true);
    try {
      const res = await fetch(`${apiBase}/students/${student.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editForm,
          gender: editForm.gender || undefined,
          birthDate: editForm.birthDate || null,
          entryYear: editForm.entryYear ? parseInt(editForm.entryYear, 10) : undefined,
          currentSemester: editForm.currentSemester ? parseInt(editForm.currentSemester, 10) : undefined,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Gagal menyimpan perubahan.');
      }
      showToast('Data mahasiswa berhasil diperbarui.');
      setIsEditing(false);
      setEditForm(null);
      await fetchDetail();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PortalLayout role="admin" userName="Admin BAAK" userIdText="Biro Administrasi Akademik & Kemahasiswaan">
      <div className="w-full space-y-6 pb-12">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link href="/admin/mahasiswa" className="hover:text-blue-600 transition-colors font-medium">
            Data Mahasiswa
          </Link>
          <span>/</span>
          <span className="text-slate-700 font-semibold">{student?.fullName || 'Detail'}</span>
        </div>

        <button
          onClick={() => router.push('/admin/mahasiswa')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-700 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Data Mahasiswa
        </button>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-500 font-medium">Memuat data mahasiswa...</p>
          </div>
        ) : errorMsg || !student ? (
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
            {/* Kolom Kiri: Ringkasan */}
            <div className="w-full lg:w-72 shrink-0 space-y-4 lg:sticky lg:top-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 text-center">
                <div className="w-24 h-24 rounded-full mx-auto bg-gradient-to-tr from-[#1E3A8A] to-blue-600 text-white flex items-center justify-center text-3xl font-black border-4 border-blue-50 shadow-sm">
                  {student.fullName.charAt(0).toUpperCase()}
                </div>
                <h1 className="mt-4 text-base font-black text-slate-900 leading-snug">{student.fullName}</h1>
                <p className="text-xs text-slate-500 mt-1 font-mono">{student.nim}</p>
                <p className="text-[11px] text-slate-400">{dash(student.studyProgramName)}</p>
                <p className="text-[11px] text-slate-400">{dash(student.facultyName)}</p>

                <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${STATUS_COLOR[student.status]}`}>
                    {STATUS_LABEL[student.status]}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                    Angkatan {student.entryYear}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-5 pt-5 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">IPK</p>
                    <p className="text-lg font-black text-slate-900">{student.ipk > 0 ? student.ipk.toFixed(2) : '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase text-slate-400">Total SKS</p>
                    <p className="text-lg font-black text-slate-900">{student.totalSks}</p>
                  </div>
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
                  <button
                    onClick={startEdit}
                    className="mt-5 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit
                  </button>
                )}
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="break-all">{student.email}</span>
                </div>
                {dash(student.phone) !== '-' && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{student.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-600">
                  <Landmark className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>Semester {student.currentSemester}</span>
                </div>
                {student.advisorLecturerName && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>PA: {student.advisorLecturerName}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Kolom Kanan: Tab */}
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
                        <EditField label="Nama Lengkap">
                          <input className={inputCls} value={editForm.fullName} onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })} />
                        </EditField>
                        <EditField label="Email">
                          <input className={inputCls} value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                        </EditField>
                        <EditField label="No. HP">
                          <input className={inputCls} value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                        </EditField>
                        <EditField label="NIK">
                          <input className={inputCls} value={editForm.nik} onChange={(e) => setEditForm({ ...editForm, nik: e.target.value })} />
                        </EditField>
                        <EditField label="NISN">
                          <input className={inputCls} value={editForm.nisn} onChange={(e) => setEditForm({ ...editForm, nisn: e.target.value })} />
                        </EditField>
                        <EditField label="No. KK">
                          <input className={inputCls} value={editForm.noKk} onChange={(e) => setEditForm({ ...editForm, noKk: e.target.value })} />
                        </EditField>
                        <EditField label="Tempat Lahir">
                          <input className={inputCls} value={editForm.birthPlace} onChange={(e) => setEditForm({ ...editForm, birthPlace: e.target.value })} />
                        </EditField>
                        <EditField label="Tanggal Lahir">
                          <input type="date" className={inputCls} value={editForm.birthDate} onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })} />
                        </EditField>
                        <EditField label="Jenis Kelamin">
                          <select className={inputCls} value={editForm.gender} onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}>
                            <option value="">-</option>
                            <option value="MALE">Laki-laki</option>
                            <option value="FEMALE">Perempuan</option>
                          </select>
                        </EditField>
                        <EditField label="Agama">
                          <input className={inputCls} value={editForm.religion} onChange={(e) => setEditForm({ ...editForm, religion: e.target.value })} />
                        </EditField>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-slate-50">
                        <InfoRow label="NIM" value={student.nim} />
                        <InfoRow label="NIK" value={dash(student.nik)} />
                        <InfoRow label="NISN" value={dash(student.nisn)} />
                        <InfoRow label="No. KK" value={dash(student.noKk)} />
                        <InfoRow
                          label="Tempat, Tanggal Lahir"
                          value={
                            dash(student.birthPlace) !== '-' || student.birthDate
                              ? `${dash(student.birthPlace) !== '-' ? student.birthPlace : ''}${
                                  student.birthDate
                                    ? `, ${new Date(student.birthDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`
                                    : ''
                                }`
                              : '-'
                          }
                        />
                        <InfoRow label="Jenis Kelamin" value={student.gender === 'MALE' ? 'Laki-laki' : 'Perempuan'} />
                        <InfoRow label="Agama" value={dash(student.religion)} />
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#1E3A8A]" /> Alamat
                    </h2>
                    {isEditing && editForm ? (
                      <div className="space-y-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                          <EditField label="Provinsi">
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
                          <EditField label="Kabupaten/Kota">
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
                          <EditField label="Kecamatan">
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
                          <EditField label="Kelurahan/Desa">
                            <input
                              className={inputCls}
                              list="mhs-kelurahan-suggestions"
                              value={editForm.kelurahan}
                              placeholder={isLoadingVillages ? 'Memuat saran...' : 'Ketik manual kalau tidak ada di saran'}
                              onChange={(e) => setEditForm({ ...editForm, kelurahan: e.target.value })}
                            />
                            <datalist id="mhs-kelurahan-suggestions">
                              {villageOptions.map((v) => (
                                <option key={v.id} value={formatRegionName(v.name)} />
                              ))}
                            </datalist>
                          </EditField>
                        </div>
                        <div className="grid grid-cols-1 gap-y-1">
                          <EditField label="Alamat Jalan">
                            <textarea
                              rows={3}
                              className={inputCls}
                              value={editForm.address}
                              onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                            />
                          </EditField>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-1">
                          <EditField label="RT">
                            <input
                              className={inputCls}
                              value={editForm.rtRw.split('/')[0] || ''}
                              onChange={(e) => {
                                const rw = editForm.rtRw.split('/')[1] || '';
                                setEditForm({ ...editForm, rtRw: `${e.target.value}/${rw}` });
                              }}
                            />
                          </EditField>
                          <EditField label="RW">
                            <input
                              className={inputCls}
                              value={editForm.rtRw.split('/')[1] || ''}
                              onChange={(e) => {
                                const rt = editForm.rtRw.split('/')[0] || '';
                                setEditForm({ ...editForm, rtRw: `${rt}/${e.target.value}` });
                              }}
                            />
                          </EditField>
                          <EditField label="Kode Pos">
                            <input className={inputCls} value={editForm.postalCode} onChange={(e) => setEditForm({ ...editForm, postalCode: e.target.value })} />
                          </EditField>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-slate-50">
                        <InfoRow label="Provinsi" value={dash(student.province)} />
                        <InfoRow label="Kabupaten/Kota" value={dash(student.city)} />
                        <InfoRow label="Kecamatan" value={dash(student.kecamatan)} />
                        <InfoRow label="Kelurahan/Desa" value={dash(student.kelurahan)} />
                        <InfoRow label="Alamat Jalan" value={dash(student.streetAddress || student.address)} />
                        <InfoRow label="RT/RW" value={dash(student.rtRw)} />
                        <InfoRow label="Kode Pos" value={dash(student.postalCode)} />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'akademik' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
                  {isEditing && editForm ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                      <EditField label="Program Studi">
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
                      <InfoRow label="Fakultas" value={dash(student.facultyName)} />
                      <EditField label="Angkatan">
                        <input
                          type="number"
                          className={inputCls}
                          value={editForm.entryYear}
                          onChange={(e) => setEditForm({ ...editForm, entryYear: e.target.value })}
                        />
                      </EditField>
                      <EditField label="Semester Berjalan">
                        <input
                          type="number"
                          min={1}
                          max={14}
                          className={inputCls}
                          value={editForm.currentSemester}
                          onChange={(e) => setEditForm({ ...editForm, currentSemester: e.target.value })}
                        />
                      </EditField>
                      <InfoRow label="IPK" value={student.ipk > 0 ? student.ipk.toFixed(2) : '-'} />
                      <InfoRow label="Total SKS Lulus" value={student.totalSks} />
                      <EditField label="Status">
                        <select className={inputCls} value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                          <option value="ACTIVE">Aktif</option>
                          <option value="LEAVE">Cuti</option>
                          <option value="GRADUATED">Lulus</option>
                          <option value="DROPOUT">Drop Out</option>
                          <option value="TRANSFERRED">Pindah</option>
                        </select>
                      </EditField>
                      <EditField label="Dosen Pembimbing Akademik">
                        <select
                          className={inputCls}
                          value={editForm.advisorLecturerId}
                          onChange={(e) => setEditForm({ ...editForm, advisorLecturerId: e.target.value })}
                        >
                          <option value="">-- Belum Ada --</option>
                          {lecturers.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.fullName} ({advisorCounts[l.id] || 0} bimbingan aktif)
                            </option>
                          ))}
                        </select>
                      </EditField>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-slate-50">
                      <InfoRow label="Program Studi" value={dash(student.studyProgramName)} />
                      <InfoRow label="Fakultas" value={dash(student.facultyName)} />
                      <InfoRow label="Angkatan" value={student.entryYear} />
                      <InfoRow label="Semester Berjalan" value={student.currentSemester} />
                      <InfoRow label="IPK" value={student.ipk > 0 ? student.ipk.toFixed(2) : '-'} />
                      <InfoRow label="Total SKS Lulus" value={student.totalSks} />
                      <InfoRow label="Status" value={STATUS_LABEL[student.status]} />
                      <InfoRow label="Dosen Pembimbing Akademik" value={dash(student.advisorLecturerName)} />
                    </div>
                  )}
                  {isEditing && (
                    <p className="text-[10px] text-slate-400 mt-3">
                      Fakultas, IPK, dan Total SKS diturunkan otomatis dari relasi lain, tidak diedit di sini.
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'sekolah' && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
                  {isEditing && editForm ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                      <EditField label="Nama Sekolah Asal">
                        <input className={inputCls} value={editForm.schoolName} onChange={(e) => setEditForm({ ...editForm, schoolName: e.target.value })} />
                      </EditField>
                      <EditField label="NPSN">
                        <input className={inputCls} value={editForm.npsn} onChange={(e) => setEditForm({ ...editForm, npsn: e.target.value })} />
                      </EditField>
                      <EditField label="Tahun Lulus">
                        <input className={inputCls} value={editForm.graduationYear} onChange={(e) => setEditForm({ ...editForm, graduationYear: e.target.value })} />
                      </EditField>
                      <EditField label="Jurusan">
                        <input className={inputCls} value={editForm.major} onChange={(e) => setEditForm({ ...editForm, major: e.target.value })} />
                      </EditField>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-slate-50">
                      <InfoRow label="Nama Sekolah Asal" value={dash(student.schoolName)} />
                      <InfoRow label="NPSN" value={dash(student.npsn)} />
                      <InfoRow label="Tahun Lulus" value={dash(student.graduationYear)} />
                      <InfoRow label="Jurusan" value={dash(student.major)} />
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'ortu' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Ayah</h2>
                    {isEditing && editForm ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                        <EditField label="Nama">
                          <input className={inputCls} value={editForm.fatherName} onChange={(e) => setEditForm({ ...editForm, fatherName: e.target.value })} />
                        </EditField>
                        <EditField label="No. HP">
                          <input className={inputCls} value={editForm.fatherPhone} onChange={(e) => setEditForm({ ...editForm, fatherPhone: e.target.value })} />
                        </EditField>
                        <EditField label="Pekerjaan">
                          <input className={inputCls} value={editForm.fatherJob} onChange={(e) => setEditForm({ ...editForm, fatherJob: e.target.value })} />
                        </EditField>
                        <EditField label="Penghasilan">
                          <input className={inputCls} value={editForm.fatherIncome} onChange={(e) => setEditForm({ ...editForm, fatherIncome: e.target.value })} />
                        </EditField>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-slate-50">
                        <InfoRow label="Nama" value={dash(student.fatherName)} />
                        <InfoRow label="No. HP" value={dash(student.fatherPhone)} />
                        <InfoRow label="Pekerjaan" value={dash(student.fatherJob)} />
                        <InfoRow label="Penghasilan" value={dash(student.fatherIncome)} />
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Ibu</h2>
                    {isEditing && editForm ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                        <EditField label="Nama">
                          <input className={inputCls} value={editForm.motherName} onChange={(e) => setEditForm({ ...editForm, motherName: e.target.value })} />
                        </EditField>
                        <EditField label="No. HP">
                          <input className={inputCls} value={editForm.motherPhone} onChange={(e) => setEditForm({ ...editForm, motherPhone: e.target.value })} />
                        </EditField>
                        <EditField label="Pekerjaan">
                          <input className={inputCls} value={editForm.motherJob} onChange={(e) => setEditForm({ ...editForm, motherJob: e.target.value })} />
                        </EditField>
                        <EditField label="Penghasilan">
                          <input className={inputCls} value={editForm.motherIncome} onChange={(e) => setEditForm({ ...editForm, motherIncome: e.target.value })} />
                        </EditField>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-slate-50">
                        <InfoRow label="Nama" value={dash(student.motherName)} />
                        <InfoRow label="No. HP" value={dash(student.motherPhone)} />
                        <InfoRow label="Pekerjaan" value={dash(student.motherJob)} />
                        <InfoRow label="Penghasilan" value={dash(student.motherIncome)} />
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6">
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Wali</h2>
                    {isEditing && editForm ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
                        <EditField label="Nama">
                          <input className={inputCls} value={editForm.guardianName} onChange={(e) => setEditForm({ ...editForm, guardianName: e.target.value })} />
                        </EditField>
                        <EditField label="No. HP">
                          <input className={inputCls} value={editForm.guardianPhone} onChange={(e) => setEditForm({ ...editForm, guardianPhone: e.target.value })} />
                        </EditField>
                        <EditField label="Pekerjaan">
                          <input className={inputCls} value={editForm.guardianJob} onChange={(e) => setEditForm({ ...editForm, guardianJob: e.target.value })} />
                        </EditField>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 divide-slate-50">
                        <InfoRow label="Nama" value={dash(student.guardianName)} />
                        <InfoRow label="No. HP" value={dash(student.guardianPhone)} />
                        <InfoRow label="Pekerjaan" value={dash(student.guardianJob)} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-blue-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </PortalLayout>
  );
}
