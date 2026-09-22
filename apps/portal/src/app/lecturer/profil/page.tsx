'use client';

import React, { useEffect, useState, useRef } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import { compressUploadedFile, fileToBase64, formatFileSize } from '@/lib/fileCompression';
import {
  User,
  Camera,
  Lock,
  GraduationCap,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Briefcase,
  IdCard,
} from 'lucide-react';

export default function LecturerProfilePage() {
  const [activeTab, setActiveTab] = useState<'identitas' | 'alamat' | 'kepegawaian' | 'keamanan'>('identitas');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // --- Identitas ---
  const [fullName, setFullName] = useState('');
  const [titlePrefix, setTitlePrefix] = useState('');
  const [titleSuffix, setTitleSuffix] = useState('');
  const [nidn, setNidn] = useState('');
  const [nip, setNip] = useState('');
  const [nidk, setNidk] = useState('');
  const [gender, setGender] = useState('');
  const [religion, setReligion] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // --- Alamat ---
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // --- Kepegawaian & Akademik ---
  const [studyProgram, setStudyProgram] = useState('');
  const [faculty, setFaculty] = useState('');
  const [isAcademicAdvisor, setIsAcademicAdvisor] = useState(false);
  const [employmentStatus, setEmploymentStatus] = useState('');
  const [functionalPosition, setFunctionalPosition] = useState('');
  const [lastEducation, setLastEducation] = useState('');
  const [expertise, setExpertise] = useState('');

  // --- Keamanan Akun ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; isError: boolean } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#keamanan') {
      setActiveTab('keamanan');
    }

    const { token, user } = getAuthSession();
    if (user) {
      if (user.fullName) setFullName(user.fullName);
      if (user.email) setEmail(user.email);
    }

    async function fetchBackendProfile() {
      const apiBase = getApiBaseUrl();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      else if (user?.id) headers['x-user-id'] = user.id;

      try {
        const res = await fetch(`${apiBase}/auth/me`, { headers });
        if (!res.ok) return;
        const resJson = await res.json();
        const data = resJson?.data || resJson;

        if (data.fullName) setFullName(data.fullName);
        if (data.email) setEmail(data.email);
        if (data.avatarUrl) setAvatarUrl(data.avatarUrl);

        const lec = data.lecturer;
        if (lec) {
          if (lec.titlePrefix) setTitlePrefix(lec.titlePrefix);
          if (lec.titleSuffix) setTitleSuffix(lec.titleSuffix);
          if (lec.nidn) setNidn(lec.nidn);
          if (lec.nip) setNip(lec.nip);
          if (lec.nidk) setNidk(lec.nidk);
          if (lec.phone) setPhone(lec.phone);
          if (lec.gender) setGender(lec.gender === 'MALE' ? 'Laki-laki' : 'Perempuan');
          if (lec.religion) setReligion(lec.religion);
          if (lec.address) setAddress(lec.address);
          if (lec.city) setCity(lec.city);
          if (lec.province) setProvince(lec.province);
          if (lec.postalCode) setPostalCode(lec.postalCode);
          if (lec.employmentStatus) setEmploymentStatus(lec.employmentStatus);
          if (lec.functionalPosition) setFunctionalPosition(lec.functionalPosition);
          if (lec.lastEducation) setLastEducation(lec.lastEducation);
          if (lec.expertise) setExpertise(lec.expertise);
          if (typeof lec.isAcademicAdvisor === 'boolean') setIsAcademicAdvisor(lec.isAcademicAdvisor);
          if (lec.studyProgram?.name) setStudyProgram(lec.studyProgram.name);
          if (lec.studyProgram?.faculty?.name) setFaculty(lec.studyProgram.faculty.name);
        }
      } catch {
        // Mode lokal / fallback
      }
    }

    fetchBackendProfile();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    if (!rawFile.type.startsWith('image/')) {
      setSaveError('File harus berupa gambar (JPG, PNG, atau WEBP).');
      return;
    }

    setSaveError(null);
    setSaveSuccess('Mengompresi dan mengoptimasi foto profil...');

    try {
      const compressResult = await compressUploadedFile(rawFile, {
        imageOptions: {
          maxWidthOrHeight: 800,
          maxSizeBytes: 400 * 1024,
          initialQuality: 0.8,
        },
      });

      const base64Url = await fileToBase64(compressResult.file);
      setAvatarUrl(base64Url);

      const { token, user } = getAuthSession();
      if (user) {
        localStorage.setItem('siakad_user', JSON.stringify({ ...user, avatarUrl: base64Url }));
      }
      window.dispatchEvent(new Event('siakad_profile_updated'));

      const saveInfo = compressResult.wasCompressed
        ? ` (${formatFileSize(compressResult.originalSize)} ➔ ${formatFileSize(compressResult.compressedSize)}, hemat ${compressResult.savedPercent}%)`
        : '';
      setSaveSuccess(`Foto profil berhasil diperbarui!${saveInfo}`);

      try {
        const apiBase = getApiBaseUrl();
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

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch {
      setSaveError('Gagal memproses dan mengompresi foto profil.');
    }
  };

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveSuccess(null);
    setSaveError(null);

    const { token, user } = getAuthSession();
    const apiBase = getApiBaseUrl();

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    else if (user?.id) headers['x-user-id'] = user.id;

    const payload = {
      fullName,
      avatarUrl,
      phone,
      titlePrefix,
      titleSuffix,
      nidk,
      gender: gender === 'Laki-laki' ? 'MALE' : gender === 'Perempuan' ? 'FEMALE' : undefined,
      religion,
      address,
      city,
      province,
      postalCode,
      employmentStatus,
      functionalPosition,
      lastEducation,
      expertise,
    };

    try {
      const res = await fetch(`${apiBase}/auth/me`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Gagal menyimpan data profil');
      }

      if (user) {
        localStorage.setItem('siakad_user', JSON.stringify({ ...user, fullName, avatarUrl: avatarUrl || null }));
      }
      window.dispatchEvent(new Event('siakad_profile_updated'));

      setSaveSuccess('Data profil berhasil disimpan');
    } catch (err: any) {
      setSaveError(err?.message || 'Gagal menyimpan data profil');
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

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
    const apiBase = getApiBaseUrl();

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      else if (user?.id) headers['x-user-id'] = user.id;

      const res = await fetch(`${apiBase}/auth/me`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => null);
        throw new Error(errJson?.message || 'Gagal memperbarui password');
      }

      setPasswordMsg({ text: 'Password berhasil diperbarui! Gunakan password baru saat login berikutnya.', isError: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMsg({ text: err?.message || 'Gagal memperbarui password.', isError: true });
    } finally {
      setPasswordLoading(false);
    }
  };

  const displayTitle = [titlePrefix, fullName].filter(Boolean).join(' ') + (titleSuffix ? `, ${titleSuffix}` : '');

  return (
    <PortalLayout role="lecturer" userName={fullName} userIdText={`NIDN: ${nidn} • ${studyProgram}`}>
      <div className="w-full space-y-6">
        {/* Top Header & Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Profil Saya</h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2 font-medium">
              <span>Dashboard Dosen</span>
              <span>&rsaquo;</span>
              <span className="text-[#1E3A8A] font-bold">Profil & Data Dosen</span>
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold shadow-2xs self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Data Tersinkron dengan Database</span>
          </div>
        </div>

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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 text-center">
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

                <div className="absolute bottom-2 right-2 p-2 bg-[#D4A017] hover:bg-[#c49214] text-slate-950 rounded-xl shadow-md transition-transform group-hover:scale-110">
                  <Camera className="w-4 h-4" />
                </div>
              </div>

              <h2 className="text-lg font-black text-slate-900 tracking-tight leading-snug">{displayTitle}</h2>
              <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">NIDN: {nidn}</p>

              <div className="mt-2.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{employmentStatus || 'Dosen'}</span>
                </span>
              </div>

              <p className="text-xs text-slate-600 font-medium mt-3 border-t border-slate-100 pt-3">
                {studyProgram || 'Program Studi belum diatur'}
              </p>
              <p className="text-[11px] text-slate-400">{faculty}</p>

              <div className="grid grid-cols-1 gap-3 mt-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 text-left">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Status Dosen PA</span>
                  <span className="text-sm font-black text-slate-900 mt-0.5 block">
                    {isAcademicAdvisor ? 'Aktif sebagai Pembimbing Akademik' : 'Bukan Dosen PA'}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-5 space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Ringkasan Kepegawaian</h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    <span>Jabatan Fungsional</span>
                  </span>
                  <span className="text-slate-800 font-bold">{functionalPosition || '-'}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="flex items-center gap-2 text-slate-700 font-medium">
                    <GraduationCap className="w-4 h-4 text-slate-400" />
                    <span>Pendidikan Terakhir</span>
                  </span>
                  <span className="text-slate-800 font-bold text-right">{lastEducation || '-'}</span>
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

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-subtle flex gap-2 overflow-x-auto">
              {[
                { key: 'identitas', label: 'Identitas', icon: User },
                { key: 'alamat', label: 'Alamat', icon: MapPin },
                { key: 'kepegawaian', label: 'Kepegawaian & Akademik', icon: GraduationCap },
                { key: 'keamanan', label: 'Keamanan', icon: Lock },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === tab.key
                      ? 'bg-[#1E3A8A] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <tab.icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* TAB: IDENTITAS */}
            {activeTab === 'identitas' && (
              <form onSubmit={handleSubmitProfile} className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <User className="w-5 h-5 text-[#1E3A8A]" />
                    <span>Identitas Dosen</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data pokok identitas diri dan nomor registrasi dosen nasional.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Gelar Depan</label>
                    <input
                      type="text"
                      value={titlePrefix}
                      onChange={(e) => setTitlePrefix(e.target.value)}
                      placeholder="Contoh: Dr."
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Nama Lengkap <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Gelar Belakang</label>
                    <input
                      type="text"
                      value={titleSuffix}
                      onChange={(e) => setTitleSuffix(e.target.value)}
                      placeholder="Contoh: S.Kom., M.Kom."
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      NIDN (Nomor Induk Dosen Nasional)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={nidn}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono font-bold cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      NIP (Nomor Induk Pegawai)
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={nip || '-'}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono font-bold cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      NIDK (Nomor Induk Dosen Khusus)
                    </label>
                    <input
                      type="text"
                      value={nidk}
                      onChange={(e) => setNidk(e.target.value)}
                      placeholder="Isi jika memiliki NIDK"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Jenis Kelamin</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 bg-white"
                    >
                      <option value="">Belum Diatur</option>
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Agama</label>
                    <select
                      value={religion}
                      onChange={(e) => setReligion(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 bg-white"
                    >
                      <option value="">Belum Diatur</option>
                      <option value="Islam">Islam</option>
                      <option value="Kristen Protestan">Kristen Protestan</option>
                      <option value="Katolik">Katolik</option>
                      <option value="Hindu">Hindu</option>
                      <option value="Buddha">Buddha</option>
                      <option value="Konghucu">Konghucu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Nomor HP / WhatsApp Aktif</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Akun</label>
                    <input
                      type="email"
                      readOnly
                      value={email}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

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

            {/* TAB: ALAMAT */}
            {activeTab === 'alamat' && (
              <form onSubmit={handleSubmitProfile} className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#1E3A8A]" />
                    <span>Informasi Alamat & Domisili</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Alamat tempat tinggal dosen saat ini.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Alamat Lengkap</label>
                    <textarea
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Nama jalan, nomor rumah, RT/RW"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Kota / Kabupaten</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Provinsi</label>
                    <input
                      type="text"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Kode Pos</label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                      maxLength={5}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-[#D4A017]" />}
                    <span>Simpan Perubahan Alamat</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB: KEPEGAWAIAN & AKADEMIK */}
            {activeTab === 'kepegawaian' && (
              <form onSubmit={handleSubmitProfile} className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#1E3A8A]" />
                    <span>Kepegawaian & Riwayat Akademik</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Status kepegawaian, jabatan fungsional, dan latar belakang akademik dosen.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Homebase Program Studi</label>
                    <input
                      type="text"
                      readOnly
                      value={studyProgram}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Fakultas</label>
                    <input
                      type="text"
                      readOnly
                      value={faculty}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Status Kepegawaian</label>
                    <select
                      value={employmentStatus}
                      onChange={(e) => setEmploymentStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 bg-white"
                    >
                      <option value="">Belum Diatur</option>
                      <option value="Dosen Tetap">Dosen Tetap</option>
                      <option value="Dosen Tidak Tetap">Dosen Tidak Tetap</option>
                      <option value="Dosen DPK">Dosen DPK</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Jabatan Fungsional Akademik</label>
                    <select
                      value={functionalPosition}
                      onChange={(e) => setFunctionalPosition(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900 bg-white"
                    >
                      <option value="">Belum Diatur</option>
                      <option value="Tenaga Pengajar">Tenaga Pengajar</option>
                      <option value="Asisten Ahli">Asisten Ahli</option>
                      <option value="Lektor">Lektor</option>
                      <option value="Lektor Kepala">Lektor Kepala</option>
                      <option value="Guru Besar">Guru Besar</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Pendidikan Terakhir</label>
                    <input
                      type="text"
                      value={lastEducation}
                      onChange={(e) => setLastEducation(e.target.value)}
                      placeholder="Contoh: S3 Ilmu Komputer, Universitas Indonesia"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Bidang Keahlian</label>
                    <input
                      type="text"
                      value={expertise}
                      onChange={(e) => setExpertise(e.target.value)}
                      placeholder="Contoh: Kecerdasan Buatan, Rekayasa Perangkat Lunak"
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>

                  <div className="md:col-span-2 flex items-center gap-2.5 p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                    <IdCard className="w-4 h-4 text-[#1E3A8A] shrink-0" />
                    <p className="text-xs text-blue-900">
                      Status <strong>Dosen Pembimbing Akademik (PA)</strong> dan homebase program studi dikelola oleh BAAK / Super Admin dan tidak dapat diubah mandiri di sini.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4 text-[#D4A017]" />}
                    <span>Simpan Perubahan Kepegawaian</span>
                  </button>
                </div>
              </form>
            )}

            {/* TAB: KEAMANAN */}
            {activeTab === 'keamanan' && (
              <form onSubmit={handleSubmitPassword} className="bg-white rounded-2xl border border-slate-200 shadow-subtle p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Lock className="w-5 h-5 text-[#1E3A8A]" />
                    <span>Keamanan Akun</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">Ubah kata sandi login Portal Dosen secara berkala untuk menjaga keamanan akun.</p>
                </div>

                {passwordMsg && (
                  <div
                    className={`rounded-xl p-3.5 flex items-center gap-2.5 text-xs font-medium ${
                      passwordMsg.isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {passwordMsg.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Password Saat Ini</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 pr-10 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Password Baru</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Minimal 6 karakter.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Konfirmasi Password Baru</label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="px-6 py-3 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {passwordLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4 text-[#D4A017]" />}
                    <span>Perbarui Password</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
