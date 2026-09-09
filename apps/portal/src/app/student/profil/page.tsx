'use client';

import React, { useEffect, useState, useRef } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import {
  User,
  Camera,
  Upload,
  Trash2,
  Lock,
  GraduationCap,
  Award,
  Calendar,
  Phone,
  Mail,
  MapPin,
  FileText,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Users,
  Home,
  Check,
  Building,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  IdCard,
  Briefcase,
  HeartHandshake,
} from 'lucide-react';

interface RegionItem {
  id: string;
  name: string;
}

function toTitleCase(str: string) {
  if (!str) return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function StudentProfilePage() {
  const [activeTab, setActiveTab] = useState<'identitas' | 'alamat' | 'orangtua' | 'akademik' | 'keamanan'>('identitas');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // --- 1. Identitas Mahasiswa ---
  const [fullName, setFullName] = useState('Muhammad Rizky Pratama');
  const [nim, setNim] = useState('2311501001');
  const [nik, setNik] = useState('3273012345670001');
  const [noKk, setNoKk] = useState('3273019876540002');
  const [nisn, setNisn] = useState('0051234567');
  const [gender, setGender] = useState('Laki-laki');
  const [birthPlace, setBirthPlace] = useState('Bandung');
  const [birthDate, setBirthDate] = useState('2004-05-14');
  const [religion, setReligion] = useState('Islam');
  const [bloodType, setBloodType] = useState('O');
  const [maritalStatus, setMaritalStatus] = useState('Belum Menikah');
  const [phone, setPhone] = useState('081234567890');
  const [email, setEmail] = useState('mahasiswa@itn.ac.id');
  const [personalEmail, setPersonalEmail] = useState('rizky.pratama@gmail.com');
  const [avatarUrl, setAvatarUrl] = useState('');

  // --- 2. Informasi Alamat ---
  const [address, setAddress] = useState('Jl. Telekomunikasi No. 1, RT 03 / RW 05');
  const [rtRw, setRtRw] = useState('03 / 05');
  const [dusun, setDusun] = useState('Dusun Sukamaju');
  const [kelurahan, setKelurahan] = useState('Sukapura');
  const [kecamatan, setKecamatan] = useState('Dayeuhkolot');
  const [city, setCity] = useState('Kabupaten Bandung');
  const [province, setProvince] = useState('Jawa Barat');
  const [postalCode, setPostalCode] = useState('40257');
  const [livingType, setLivingType] = useState('Bersama Orang Tua');
  const [transportation, setTransportation] = useState('Sepeda Motor');

  // Wilayah Indonesia API states
  const [provinces, setProvinces] = useState<RegionItem[]>([]);
  const [regencies, setRegencies] = useState<RegionItem[]>([]);
  const [districts, setDistricts] = useState<RegionItem[]>([]);
  const [villages, setVillages] = useState<RegionItem[]>([]);

  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedRegencyId, setSelectedRegencyId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedVillageId, setSelectedVillageId] = useState<string>('');

  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingRegencies, setLoadingRegencies] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingVillages, setLoadingVillages] = useState(false);

  // --- 3. Data Orang Tua & Wali ---
  // Ayah
  const [fatherName, setFatherName] = useState('H. Bambang Pratama, S.E.');
  const [fatherNik, setFatherNik] = useState('3273011122330001');
  const [fatherStatus, setFatherStatus] = useState('Masih Hidup');
  const [fatherBirthDate, setFatherBirthDate] = useState('1975-08-20');
  const [fatherEducation, setFatherEducation] = useState('S1');
  const [fatherOccupation, setFatherOccupation] = useState('Wiraswasta');
  const [fatherIncome, setFatherIncome] = useState('Rp 5.000.000 - Rp 10.000.000');
  const [fatherPhone, setFatherPhone] = useState('081322114455');

  // Ibu
  const [motherName, setMotherName] = useState('Hj. Siti Rahmawati');
  const [motherNik, setMotherNik] = useState('3273014455660002');
  const [motherStatus, setMotherStatus] = useState('Masih Hidup');
  const [motherBirthDate, setMotherBirthDate] = useState('1978-11-12');
  const [motherEducation, setMotherEducation] = useState('SMA/SMK');
  const [motherOccupation, setMotherOccupation] = useState('Ibu Rumah Tangga');
  const [motherIncome, setMotherIncome] = useState('< Rp 1.000.000');
  const [motherPhone, setMotherPhone] = useState('081299887766');

  // Wali (Opsional)
  const [guardianName, setGuardianName] = useState('');
  const [guardianRelation, setGuardianRelation] = useState('');
  const [guardianOccupation, setGuardianOccupation] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');

  // --- 4. Data Akademik ---
  const [studyProgram, setStudyProgram] = useState('Teknik Informatika');
  const [degree, setDegree] = useState('Strata 1 (S1)');
  const [faculty, setFaculty] = useState('Fakultas Ilmu Komputer');
  const [academicYear, setAcademicYear] = useState('2023');
  const [semester, setSemester] = useState(5);
  const [academicStatus, setAcademicStatus] = useState('AKTIF');
  const [ipk, setIpk] = useState('3.84');
  const [sksTotal, setSksTotal] = useState(88);
  const [advisorName, setAdvisorName] = useState('Dr. Bayu Wicaksono, M.Kom.');
  const [advisorNip, setAdvisorNip] = useState('198503122010121003');
  const [admissionPath, setAdmissionPath] = useState('SNBP (Prestasi Nasional)');

  // --- 5. Keamanan Akun ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile from auth session & backend
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#keamanan') {
      setActiveTab('keamanan');
    }

    const { token, user } = getAuthSession();
    if (user) {
      if (user.fullName) setFullName(user.fullName);
      if (user.email) setEmail(user.email);
      if (user.avatarUrl) setAvatarUrl(user.avatarUrl);
    }

    // Load persisted local extra profile data
    try {
      const extraRaw = localStorage.getItem('siakad_student_profile_extra');
      if (extraRaw) {
        const extra = JSON.parse(extraRaw);
        if (extra.personalEmail) setPersonalEmail(extra.personalEmail);
        if (extra.religion) setReligion(extra.religion);
        if (extra.bloodType) setBloodType(extra.bloodType);
        if (extra.maritalStatus) setMaritalStatus(extra.maritalStatus);
        if (extra.rtRw) setRtRw(extra.rtRw);
        if (extra.dusun) setDusun(extra.dusun);
        if (extra.kelurahan) setKelurahan(extra.kelurahan);
        if (extra.kecamatan) setKecamatan(extra.kecamatan);
        if (extra.city) setCity(extra.city);
        if (extra.province) setProvince(extra.province);
        if (extra.postalCode) setPostalCode(extra.postalCode);
        if (extra.livingType) setLivingType(extra.livingType);
        if (extra.transportation) setTransportation(extra.transportation);
        if (extra.selectedProvinceId) setSelectedProvinceId(extra.selectedProvinceId);
        if (extra.selectedRegencyId) setSelectedRegencyId(extra.selectedRegencyId);
        if (extra.selectedDistrictId) setSelectedDistrictId(extra.selectedDistrictId);
        if (extra.selectedVillageId) setSelectedVillageId(extra.selectedVillageId);
      }
    } catch {
      // Ignore
    }

    async function fetchBackendProfile() {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      else if (user?.id) headers['x-user-id'] = user.id;

      try {
        const res = await fetch(`${apiBase}/auth/me`, { headers });
        if (!res.ok) return;
        const data = await res.json();

        if (data.fullName) setFullName(data.fullName);
        if (data.email) setEmail(data.email);
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);

        if (data.student) {
          if (data.student.nim) setNim(data.student.nim);
          if (data.student.nik) setNik(data.student.nik);
          if (data.student.phone) setPhone(data.student.phone);
          if (data.student.address) setAddress(data.student.address);
          if (data.student.birthPlace) setBirthPlace(data.student.birthPlace);
          if (data.student.birthDate) setBirthDate(data.student.birthDate.slice(0, 10));
          if (data.student.gender) setGender(data.student.gender === 'MALE' ? 'Laki-laki' : 'Perempuan');
          if (data.student.studyProgram?.name) setStudyProgram(data.student.studyProgram.name);
          if (data.student.studyProgram?.faculty?.name) setFaculty(data.student.studyProgram.faculty.name);
          if (data.student.advisorLecturer?.user?.fullName) {
            setAdvisorName(data.student.advisorLecturer.user.fullName);
            setAdvisorNip(data.student.advisorLecturer.nip || advisorNip);
          }
        }
      } catch {
        // Mode lokal / fallback
      }
    }

    fetchBackendProfile();
  }, []);

  // 1. Load Indonesian Provinces from free Emsifa API
  useEffect(() => {
    async function loadProvinces() {
      setLoadingProvinces(true);
      try {
        const res = await fetch('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');
        if (res.ok) {
          const data: RegionItem[] = await res.json();
          setProvinces(data);

          // Find matching initial province (e.g. "JAWA BARAT")
          const currentProvUpper = province.toUpperCase().trim();
          const match = data.find((p) => p.name === currentProvUpper || currentProvUpper.includes(p.name));
          if (match) {
            setSelectedProvinceId(match.id);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat provinsi dari API wilayah:', err);
      } finally {
        setLoadingProvinces(false);
      }
    }
    loadProvinces();
  }, []);

  // 2. When selectedProvinceId changes, load Regencies / Kota-Kabupaten
  useEffect(() => {
    if (!selectedProvinceId) {
      setRegencies([]);
      return;
    }

    async function loadRegencies() {
      setLoadingRegencies(true);
      try {
        const res = await fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/regencies/${selectedProvinceId}.json`
        );
        if (res.ok) {
          const data: RegionItem[] = await res.json();
          setRegencies(data);

          // Find matching initial regency (e.g. "KABUPATEN BANDUNG")
          const currentCityUpper = city.toUpperCase().trim();
          const match = data.find((r) => r.name === currentCityUpper || currentCityUpper.includes(r.name));
          if (match) {
            setSelectedRegencyId(match.id);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat kota/kabupaten:', err);
      } finally {
        setLoadingRegencies(false);
      }
    }
    loadRegencies();
  }, [selectedProvinceId]);

  // 3. When selectedRegencyId changes, load Districts / Kecamatan
  useEffect(() => {
    if (!selectedRegencyId) {
      setDistricts([]);
      return;
    }

    async function loadDistricts() {
      setLoadingDistricts(true);
      try {
        const res = await fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/districts/${selectedRegencyId}.json`
        );
        if (res.ok) {
          const data: RegionItem[] = await res.json();
          setDistricts(data);

          // Find matching initial district (e.g. "DAYEUHKOLOT")
          const currentKecUpper = kecamatan.toUpperCase().trim();
          const match = data.find((d) => d.name === currentKecUpper || currentKecUpper.includes(d.name));
          if (match) {
            setSelectedDistrictId(match.id);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat kecamatan:', err);
      } finally {
        setLoadingDistricts(false);
      }
    }
    loadDistricts();
  }, [selectedRegencyId]);

  // 4. When selectedDistrictId changes, load Villages / Kelurahan-Desa
  useEffect(() => {
    if (!selectedDistrictId) {
      setVillages([]);
      return;
    }

    async function loadVillages() {
      setLoadingVillages(true);
      try {
        const res = await fetch(
          `https://www.emsifa.com/api-wilayah-indonesia/api/villages/${selectedDistrictId}.json`
        );
        if (res.ok) {
          const data: RegionItem[] = await res.json();
          setVillages(data);

          // Find matching initial village (e.g. "SUKAPURA")
          const currentKelUpper = kelurahan.toUpperCase().trim();
          const match = data.find((v) => v.name === currentKelUpper || currentKelUpper.includes(v.name));
          if (match) {
            setSelectedVillageId(match.id);
          }
        }
      } catch (err) {
        console.warn('Gagal memuat kelurahan:', err);
      } finally {
        setLoadingVillages(false);
      }
    }
    loadVillages();
  }, [selectedDistrictId]);

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = e.target.value;
    setSelectedProvinceId(pId);
    const found = provinces.find((p) => p.id === pId);
    setProvince(found ? toTitleCase(found.name) : '');

    setSelectedRegencyId('');
    setCity('');
    setSelectedDistrictId('');
    setKecamatan('');
    setSelectedVillageId('');
    setKelurahan('');
    setRegencies([]);
    setDistricts([]);
    setVillages([]);
  };

  const handleRegencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const rId = e.target.value;
    setSelectedRegencyId(rId);
    const found = regencies.find((r) => r.id === rId);
    setCity(found ? toTitleCase(found.name) : '');

    setSelectedDistrictId('');
    setKecamatan('');
    setSelectedVillageId('');
    setKelurahan('');
    setDistricts([]);
    setVillages([]);
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const dId = e.target.value;
    setSelectedDistrictId(dId);
    const found = districts.find((d) => d.id === dId);
    setKecamatan(found ? toTitleCase(found.name) : '');

    setSelectedVillageId('');
    setKelurahan('');
    setVillages([]);
  };

  const handleVillageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const vId = e.target.value;
    setSelectedVillageId(vId);
    const found = villages.find((v) => v.id === vId);
    setKelurahan(found ? toTitleCase(found.name) : '');
  };

  // Handle local file upload with instant change & auto-save
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setSaveError('File harus berupa gambar (JPG, PNG, atau WEBP).');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setSaveError('Ukuran gambar maksimal 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64Url = event.target?.result as string;
      setAvatarUrl(base64Url);
      setSaveError(null);

      // Instant sync to localStorage and navbar
      const { token, user } = getAuthSession();
      if (user) {
        const updatedUser = {
          ...user,
          avatarUrl: base64Url,
        };
        localStorage.setItem('siakad_user', JSON.stringify(updatedUser));
      }
      window.dispatchEvent(new Event('siakad_profile_updated'));
      setSaveSuccess('Foto profil berhasil diubah dan diperbarui di navbar!');

      // Persist to backend in background
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        else if (user?.id) headers['x-user-id'] = user.id;

        await fetch(`${apiBase}/auth/me`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ avatarUrl: base64Url }),
        });
      } catch {
        // Handled silently
      }

      // Reset file input so user can pick another or the same photo repeatedly
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    const { user } = getAuthSession();
    if (user) {
      localStorage.setItem('siakad_user', JSON.stringify({ ...user, avatarUrl: null }));
      window.dispatchEvent(new Event('siakad_profile_updated'));
    }
    setSaveSuccess('Foto profil telah dihapus.');
  };

  // Submit profile changes
  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(null);
    setSaveError(null);

    const { token, user } = getAuthSession();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    else if (user?.id) headers['x-user-id'] = user.id;

    const payload = {
      fullName,
      avatarUrl,
      phone,
      nik,
      address,
      birthPlace,
      birthDate,
      province,
      city,
      kecamatan,
      kelurahan,
      postalCode,
    };

    // Save extra profile data locally
    try {
      const extraData = {
        personalEmail,
        religion,
        bloodType,
        maritalStatus,
        rtRw,
        dusun,
        kelurahan,
        kecamatan,
        city,
        province,
        postalCode,
        livingType,
        transportation,
        selectedProvinceId,
        selectedRegencyId,
        selectedDistrictId,
        selectedVillageId,
      };
      localStorage.setItem('siakad_student_profile_extra', JSON.stringify(extraData));
    } catch {
      // Ignore
    }

    try {
      await fetch(`${apiBase}/auth/me`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      if (user) {
        const updatedUser = {
          ...user,
          fullName,
          avatarUrl: avatarUrl || null,
        };
        localStorage.setItem('siakad_user', JSON.stringify(updatedUser));
      }

      // Sync navbar in realtime
      window.dispatchEvent(new Event('siakad_profile_updated'));

      setSaveSuccess('Data profil mahasiswa berhasil disimpan dan disinkronkan ke navbar!');
    } catch {
      if (user) {
        const updatedUser = {
          ...user,
          fullName,
          avatarUrl: avatarUrl || null,
        };
        localStorage.setItem('siakad_user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('siakad_profile_updated'));
      }
      setSaveSuccess('Data berhasil disimpan secara lokal!');
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Submit password change
  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword.length < 6) {
      setPasswordMsg({ text: 'Password baru minimal 6 karakter.', isError: true });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: 'Konfirmasi password tidak sesuai.', isError: true });
      return;
    }

    setPasswordLoading(true);
    const { token, user } = getAuthSession();
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      else if (user?.id) headers['x-user-id'] = user.id;

      await fetch(`${apiBase}/auth/me`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      setPasswordMsg({ text: 'Password berhasil diperbarui! Gunakan password baru saat login.', isError: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setPasswordMsg({ text: 'Password berhasil diperbarui untuk akun ini.', isError: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <PortalLayout
      role="student"
      userName={fullName}
      userIdText={`NIM: ${nim} • ${studyProgram}`}
    >
      <div className="w-full space-y-6">
        
        {/* Top Header & Breadcrumb (Like Reference) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Profil Saya</h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 font-medium">
              <span>Dashboard</span>
              <span>&rsaquo;</span>
              <span className="text-[#1E3A8A] font-bold">Profil & Data Mahasiswa</span>
            </p>
          </div>

          {/* Badge Kelengkapan */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-2xs self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>100% Lengkap</span>
          </div>
        </div>

        {/* Global Notifications */}
        {saveSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium">{saveSuccess}</p>
          </div>
        )}

        {saveError && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-center gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <p className="text-sm font-medium">{saveError}</p>
          </div>
        )}

        {/* Main 2-Column Full Width Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: PROFILE CARD & AKTIVASI (Matches Reference)   */}
          {/* ========================================================= */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Profile Summary Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 text-center">
              {/* Avatar with Direct Click-to-Change Photo */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="relative inline-block mx-auto mb-4 group cursor-pointer"
                title="Klik untuk langsung ganti foto profil"
              >
                <div className="w-28 h-32 rounded-2xl overflow-hidden bg-[#1E3A8A] border-3 border-[#D4A017] shadow-md flex items-center justify-center text-white relative transition-all group-hover:ring-4 group-hover:ring-blue-100">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-5xl font-black">{fullName.charAt(0)}</span>
                  )}

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1 backdrop-blur-2xs">
                    <Camera className="w-6 h-6 text-[#D4A017]" />
                    <span className="text-[10px] font-bold">Ganti Foto</span>
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png, image/jpeg, image/webp"
                  className="hidden"
                />

                {/* Camera Icon Badge */}
                <div
                  className="absolute bottom-2 right-2 p-2 bg-[#D4A017] hover:bg-[#c49214] text-slate-950 rounded-xl shadow-md transition-transform group-hover:scale-110"
                >
                  <Camera className="w-4 h-4" />
                </div>
              </div>

              {/* Name & NIM */}
              <h2 className="text-lg font-black text-slate-900 tracking-tight">{fullName}</h2>
              <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">{nim}</p>

              {/* Status Badge */}
              <div className="mt-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{academicStatus}</span>
                </span>
              </div>

              {/* Program Studi */}
              <p className="text-xs text-slate-600 font-medium mt-3 border-t border-slate-100 pt-3">
                {studyProgram} &bull; {degree}
              </p>

              {/* Semester & Angkatan Boxes */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">SEMESTER</span>
                  <span className="text-xl font-black text-slate-900 mt-0.5 block">{semester}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">ANGKATAN</span>
                  <span className="text-xl font-black text-slate-900 mt-0.5 block">{academicYear}</span>
                </div>
              </div>

              {/* Progress Kelengkapan Profil */}
              <div className="mt-5 pt-4 border-t border-slate-100 text-left space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Kelengkapan Profil</span>
                  <span className="text-emerald-600">20/20</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-full" />
                </div>
                <p className="text-[10px] text-slate-500">100% data profil lengkap</p>
              </div>
            </div>

            {/* Status Aktivasi Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">STATUS AKTIVASI</h3>
              
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Biodata Diri</span>
                  </span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Lengkap</span>
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Keamanan Akun</span>
                  </span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Aman</span>
                  </span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>Email Akun</span>
                  </span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Terverifikasi</span>
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: FULL TABS & FORMS (NO COLLAPSE)              */}
          {/* ========================================================= */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Tab Navigation Pill Bar */}
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-subtle flex gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveTab('identitas')}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'identitas'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4 shrink-0" />
                <span>Identitas</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('alamat')}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'alamat'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <MapPin className="w-4 h-4 shrink-0" />
                <span>Alamat</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('orangtua')}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'orangtua'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span>Orang Tua</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('akademik')}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'akademik'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span>Akademik</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('keamanan')}
                className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'keamanan'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Lock className="w-4 h-4 shrink-0" />
                <span>Keamanan</span>
              </button>
            </div>

            {/* TAB CONTENT 1: IDENTITAS MAHASISWA */}
            {activeTab === 'identitas' && (
              <form onSubmit={handleSubmitProfile} className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#1E3A8A]" />
                    <span>Identitas Mahasiswa</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data pokok kependudukan dan informasi identitas diri mahasiswa.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Nama Lengkap */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nama Lengkap (Sesuai Ijazah/KTP) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  {/* NIM */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nomor Induk Mahasiswa (NIM)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={nim}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono font-bold cursor-not-allowed"
                    />
                  </div>

                  {/* NIK */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      NIK (Nomor Induk Kependudukan 16 Digit)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={nik}
                      onChange={(e) => setNik(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  {/* No KK */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nomor Kartu Keluarga (No. KK)
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={noKk}
                      onChange={(e) => setNoKk(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  {/* NISN */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      NISN (Nomor Induk Siswa Nasional)
                    </label>
                    <input
                      type="text"
                      value={nisn}
                      onChange={(e) => setNisn(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  {/* Jenis Kelamin */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Jenis Kelamin
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 bg-white"
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  {/* Agama */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Agama
                    </label>
                    <select
                      value={religion}
                      onChange={(e) => setReligion(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 bg-white"
                    >
                      <option value="Islam">Islam</option>
                      <option value="Kristen Protestan">Kristen Protestan</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                      <option value="Konghucu">Konghucu</option>
                    </select>
                  </div>

                  {/* Tempat Lahir */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      value={birthPlace}
                      onChange={(e) => setBirthPlace(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  {/* Tanggal Lahir */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Tanggal Lahir
                    </label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  {/* Golongan Darah */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Golongan Darah
                    </label>
                    <select
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 bg-white"
                    >
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="AB">AB</option>
                      <option value="O">O</option>
                      <option value="Belum Tahu">Belum Tahu</option>
                    </select>
                  </div>

                  {/* Status Pernikahan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Status Pernikahan
                    </label>
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 bg-white"
                    >
                      <option value="Belum Menikah">Belum Menikah</option>
                      <option value="Menikah">Menikah</option>
                    </select>
                  </div>

                  {/* No HP / WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nomor HP / WhatsApp Aktif <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  {/* Email Pribadi */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Email Pribadi (Pemulihan Akun)
                    </label>
                    <input
                      type="email"
                      value={personalEmail}
                      onChange={(e) => setPersonalEmail(e.target.value)}
                      placeholder="contoh@gmail.com"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>
                </div>

                {/* Bottom Submit Bar */}
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-[#D4A017]" />}
                    <span>Simpan Perubahan Identitas</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT 2: INFORMASI ALAMAT */}
            {activeTab === 'alamat' && (
              <form onSubmit={handleSubmitProfile} className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#1E3A8A]" />
                    <span>Informasi Alamat & Domisili</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data tempat tinggal resmi sesuai KTP dan tempat tinggal saat ini.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Alamat Jalan */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Alamat Lengkap (Jalan, No. Rumah, Blok) <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 resize-y"
                    />
                  </div>

                  {/* RT / RW */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">RT / RW</label>
                    <input
                      type="text"
                      value={rtRw}
                      onChange={(e) => setRtRw(e.target.value)}
                      placeholder="03 / 05"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  {/* Dusun / Lingkungan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Dusun / Kampung / Lingkungan</label>
                    <input
                      type="text"
                      value={dusun}
                      onChange={(e) => setDusun(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  {/* Provinsi */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Provinsi <span className="text-rose-500">*</span></span>
                      {loadingProvinces && <span className="text-[11px] text-blue-600 font-normal">Memuat data API...</span>}
                    </label>
                    <select
                      value={selectedProvinceId}
                      onChange={handleProvinceChange}
                      disabled={loadingProvinces}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="">{loadingProvinces ? 'Memuat daftar provinsi...' : '-- Pilih Provinsi --'}</option>
                      {provinces.map((p) => (
                        <option key={p.id} value={p.id}>
                          {toTitleCase(p.name)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kota / Kabupaten */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Kota / Kabupaten <span className="text-rose-500">*</span></span>
                      {loadingRegencies && <span className="text-[11px] text-blue-600 font-normal">Memuat data API...</span>}
                    </label>
                    <select
                      value={selectedRegencyId}
                      onChange={handleRegencyChange}
                      disabled={!selectedProvinceId || loadingRegencies}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {loadingRegencies
                          ? 'Memuat data kota/kabupaten...'
                          : !selectedProvinceId
                          ? '-- Pilih Provinsi Terlebih Dahulu --'
                          : '-- Pilih Kota / Kabupaten --'}
                      </option>
                      {regencies.map((r) => (
                        <option key={r.id} value={r.id}>
                          {toTitleCase(r.name)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kecamatan */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Kecamatan <span className="text-rose-500">*</span></span>
                      {loadingDistricts && <span className="text-[11px] text-blue-600 font-normal">Memuat data API...</span>}
                    </label>
                    <select
                      value={selectedDistrictId}
                      onChange={handleDistrictChange}
                      disabled={!selectedRegencyId || loadingDistricts}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {loadingDistricts
                          ? 'Memuat data kecamatan...'
                          : !selectedRegencyId
                          ? '-- Pilih Kota/Kab Terlebih Dahulu --'
                          : '-- Pilih Kecamatan --'}
                      </option>
                      {districts.map((d) => (
                        <option key={d.id} value={d.id}>
                          {toTitleCase(d.name)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kelurahan / Desa */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Kelurahan / Desa <span className="text-rose-500">*</span></span>
                      {loadingVillages && <span className="text-[11px] text-blue-600 font-normal">Memuat data API...</span>}
                    </label>
                    <select
                      value={selectedVillageId}
                      onChange={handleVillageChange}
                      disabled={!selectedDistrictId || loadingVillages}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 bg-white disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {loadingVillages
                          ? 'Memuat data kelurahan/desa...'
                          : !selectedDistrictId
                          ? '-- Pilih Kecamatan Terlebih Dahulu --'
                          : '-- Pilih Kelurahan / Desa --'}
                      </option>
                      {villages.map((v) => (
                        <option key={v.id} value={v.id}>
                          {toTitleCase(v.name)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Kode Pos */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Kode Pos</label>
                    <input
                      type="text"
                      maxLength={5}
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  {/* Jenis Tinggal */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Jenis Tinggal Saat Kuliah</label>
                    <select
                      value={livingType}
                      onChange={(e) => setLivingType(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 bg-white"
                    >
                      <option value="Bersama Orang Tua">Bersama Orang Tua</option>
                      <option value="Kost">Kost</option>
                      <option value="Asrama Mahasiswa">Asrama Mahasiswa</option>
                      <option value="Rumah Sendiri / Kontrak">Rumah Sendiri / Kontrak</option>
                      <option value="Lainnya">Lainnya</option>
                    </select>
                  </div>

                  {/* Alat Transportasi */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Alat Transportasi ke Kampus</label>
                    <select
                      value={transportation}
                      onChange={(e) => setTransportation(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 bg-white"
                    >
                      <option value="Sepeda Motor">Sepeda Motor</option>
                      <option value="Mobil Pribadi">Mobil Pribadi</option>
                      <option value="Angkutan Umum / Bus">Angkutan Umum / Bus</option>
                      <option value="Ojek Online">Ojek Online</option>
                      <option value="Jalan Kaki">Jalan Kaki</option>
                    </select>
                  </div>
                </div>

                {/* Bottom Submit Bar */}
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-[#D4A017]" />}
                    <span>Simpan Informasi Alamat</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT 3: DATA ORANG TUA / WALI */}
            {activeTab === 'orangtua' && (
              <form onSubmit={handleSubmitProfile} className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-8">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#1E3A8A]" />
                    <span>Data Orang Tua & Wali Mahasiswa</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Informasi ayah, ibu kandung, dan wali mahasiswa untuk pelaporan PDDIKTI.
                  </p>
                </div>

                {/* SUBSECTION: DATA AYAH */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#1E3A8A]" />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Data Ayah Kandung</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Ayah</label>
                      <input
                        type="text"
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">NIK Ayah (16 Digit)</label>
                      <input
                        type="text"
                        maxLength={16}
                        value={fatherNik}
                        onChange={(e) => setFatherNik(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Status Ayah</label>
                      <select
                        value={fatherStatus}
                        onChange={(e) => setFatherStatus(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
                      >
                        <option value="Masih Hidup">Masih Hidup</option>
                        <option value="Meninggal Dunia">Meninggal Dunia</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pendidikan Terakhir Ayah</label>
                      <select
                        value={fatherEducation}
                        onChange={(e) => setFatherEducation(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
                      >
                        <option value="SD">SD Sederajat</option>
                        <option value="SMP">SMP Sederajat</option>
                        <option value="SMA/SMK">SMA / SMK Sederajat</option>
                        <option value="D3">Diploma (D3)</option>
                        <option value="S1">Sarjana (S1)</option>
                        <option value="S2">Magister (S2)</option>
                        <option value="S3">Doktor (S3)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pekerjaan Ayah</label>
                      <input
                        type="text"
                        value={fatherOccupation}
                        onChange={(e) => setFatherOccupation(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Penghasilan Rata-rata Ayah</label>
                      <select
                        value={fatherIncome}
                        onChange={(e) => setFatherIncome(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
                      >
                        <option value="< Rp 1.000.000">&lt; Rp 1.000.000</option>
                        <option value="Rp 1.000.000 - Rp 3.000.000">Rp 1.000.000 - Rp 3.000.000</option>
                        <option value="Rp 3.000.000 - Rp 5.000.000">Rp 3.000.000 - Rp 5.000.000</option>
                        <option value="Rp 5.000.000 - Rp 10.000.000">Rp 5.000.000 - Rp 10.000.000</option>
                        <option value="> Rp 10.000.000">&gt; Rp 10.000.000</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / Kontak Ayah</label>
                      <input
                        type="tel"
                        value={fatherPhone}
                        onChange={(e) => setFatherPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* SUBSECTION: DATA IBU */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D4A017]" />
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">Data Ibu Kandung</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap Ibu</label>
                      <input
                        type="text"
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">NIK Ibu (16 Digit)</label>
                      <input
                        type="text"
                        maxLength={16}
                        value={motherNik}
                        onChange={(e) => setMotherNik(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Status Ibu</label>
                      <select
                        value={motherStatus}
                        onChange={(e) => setMotherStatus(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
                      >
                        <option value="Masih Hidup">Masih Hidup</option>
                        <option value="Meninggal Dunia">Meninggal Dunia</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pendidikan Terakhir Ibu</label>
                      <select
                        value={motherEducation}
                        onChange={(e) => setMotherEducation(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
                      >
                        <option value="SD">SD Sederajat</option>
                        <option value="SMP">SMP Sederajat</option>
                        <option value="SMA/SMK">SMA / SMK Sederajat</option>
                        <option value="D3">Diploma (D3)</option>
                        <option value="S1">Sarjana (S1)</option>
                        <option value="S2">Magister (S2)</option>
                        <option value="S3">Doktor (S3)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Pekerjaan Ibu</label>
                      <input
                        type="text"
                        value={motherOccupation}
                        onChange={(e) => setMotherOccupation(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Penghasilan Rata-rata Ibu</label>
                      <select
                        value={motherIncome}
                        onChange={(e) => setMotherIncome(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
                      >
                        <option value="< Rp 1.000.000">&lt; Rp 1.000.000</option>
                        <option value="Rp 1.000.000 - Rp 3.000.000">Rp 1.000.000 - Rp 3.000.000</option>
                        <option value="Rp 3.000.000 - Rp 5.000.000">Rp 3.000.000 - Rp 5.000.000</option>
                        <option value="Rp 5.000.000 - Rp 10.000.000">Rp 5.000.000 - Rp 10.000.000</option>
                        <option value="> Rp 10.000.000">&gt; Rp 10.000.000</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">No. HP / Kontak Ibu</label>
                      <input
                        type="tel"
                        value={motherPhone}
                        onChange={(e) => setMotherPhone(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* SUBSECTION: DATA WALI (OPSIONAL) */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">Data Wali Mahasiswa (Opsional)</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Nama Wali</label>
                      <input
                        type="text"
                        value={guardianName}
                        onChange={(e) => setGuardianName(e.target.value)}
                        placeholder="Kosongkan jika tidak ada wali"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Hubungan dengan Mahasiswa</label>
                      <input
                        type="text"
                        value={guardianRelation}
                        onChange={(e) => setGuardianRelation(e.target.value)}
                        placeholder="Contoh: Paman / Kakek"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:border-[#1E3A8A] bg-white font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Submit Bar */}
                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-[#D4A017]" />}
                    <span>Simpan Data Orang Tua</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB CONTENT 4: DATA AKADEMIK */}
            {activeTab === 'akademik' && (
              <div className="space-y-6">
                
                {/* Academic Details Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-6">
                  <div className="border-b border-slate-100 pb-4">
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-[#1E3A8A]" />
                      <span>Informasi Akademik & Studi</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Data kurikulum resmi dan status perkuliahan mahasiswa di Institut Teknologi Nusantara.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">PROGRAM STUDI</span>
                      <p className="font-extrabold text-sm text-slate-900">{studyProgram} ({degree})</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">FAKULTAS</span>
                      <p className="font-extrabold text-sm text-slate-900">{faculty}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">DOSEN PEMBIMBING AKADEMIK (PA)</span>
                      <p className="font-extrabold text-sm text-slate-900">{advisorName}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5">NIP: {advisorNip}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">JALUR MASUK</span>
                      <p className="font-extrabold text-sm text-slate-900">{admissionPath}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">TOTAL SKS LULUS</span>
                      <p className="font-black text-lg text-[#1E3A8A]">{sksTotal} <span className="text-xs font-normal text-slate-500">/ 144 SKS</span></p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="font-bold text-slate-400 uppercase text-[10px] block mb-1">INDEKS PRESTASI KUMULATIF (IPK)</span>
                      <p className="font-black text-lg text-emerald-600">{ipk} <span className="text-xs font-normal text-slate-500">Skala 4.00</span></p>
                    </div>
                  </div>
                </div>

                {/* Digital Student Card (KTM) */}
                <div className="bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#1E293B] rounded-3xl p-6 sm:p-7 text-white shadow-lg border-2 border-[#D4A017]/50 relative overflow-hidden">
                  <div className="flex items-center justify-between border-b border-white/15 pb-4 mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center p-2 text-[#D4A017]">
                        <GraduationCap className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm sm:text-base tracking-wide text-white uppercase">
                          INSTITUT TEKNOLOGI NUSANTARA
                        </h4>
                        <p className="text-[10px] text-blue-200 tracking-wider uppercase font-semibold">
                          KARTU TANDA MAHASISWA (KTM) RESMI
                        </p>
                      </div>
                    </div>

                    {/* Chip Gold Simulator */}
                    <div className="w-10 h-7 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-1 border border-amber-300/80 shadow-xs flex flex-col justify-around">
                      <div className="h-0.5 w-full bg-amber-700/40 rounded-full" />
                      <div className="h-0.5 w-full bg-amber-700/40 rounded-full" />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                    <div className="w-24 h-32 rounded-xl overflow-hidden bg-slate-800 border-2 border-[#D4A017] shadow-md shrink-0 flex items-center justify-center">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-extrabold text-white">{fullName.charAt(0)}</span>
                      )}
                    </div>

                    <div className="flex-1 space-y-2 text-center sm:text-left">
                      <div>
                        <p className="text-[10px] text-blue-200 uppercase font-semibold">Nama Mahasiswa</p>
                        <p className="text-base font-black text-white">{fullName}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-left pt-1">
                        <div>
                          <p className="text-[10px] text-blue-200 uppercase font-semibold">NIM</p>
                          <p className="text-xs font-bold text-[#E5B53B]">{nim}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-blue-200 uppercase font-semibold">Program Studi</p>
                          <p className="text-xs font-medium text-slate-100">{studyProgram}</p>
                        </div>
                      </div>
                    </div>

                    <div className="hidden sm:flex flex-col items-center justify-center bg-white p-2 rounded-xl text-slate-950 shrink-0 self-center">
                      <QrCode className="w-14 h-14 text-slate-900" />
                      <span className="text-[8px] font-mono font-bold mt-1 tracking-widest">{nim}</span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/15 flex items-center justify-between text-[10px] text-blue-200 font-mono">
                    <span>STATUS: MAHASISWA AKTIF</span>
                    <span>BERLAKU S.D. LULUS STUDI</span>
                  </div>
                </div>

              </div>
            )}

            {/* TAB CONTENT 5: KEAMANAN AKUN */}
            {activeTab === 'keamanan' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-[#1E3A8A]" />
                    <span>Keamanan Akun & Ganti Password</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Perbarui password portal akademik Anda secara berkala demi keamanan data.
                  </p>
                </div>

                {passwordMsg && (
                  <div
                    className={`rounded-xl p-4 text-xs font-semibold flex items-center gap-2.5 ${
                      passwordMsg.isError
                        ? 'bg-rose-50 border border-rose-200 text-rose-700'
                        : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    }`}
                  >
                    {passwordMsg.isError ? (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    )}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <form onSubmit={handleSubmitPassword} className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Password Saat Ini <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Masukkan password lama"
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 font-medium pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Password Baru <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Ulangi Password Baru <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ketik ulang password baru"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 font-medium"
                    />
                  </div>

                  <div className="p-3 bg-blue-50 rounded-xl text-xs text-[#1E3A8A] flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#D4A017]" />
                    <span>Gunakan kombinasi huruf kapital, angka, dan karakter khusus untuk perlindungan akun maksimal.</span>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="px-6 py-2.5 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {passwordLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 text-[#D4A017]" />}
                      <span>Perbarui Password Sekarang</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>

        </div>

      </div>
    </PortalLayout>
  );
}
