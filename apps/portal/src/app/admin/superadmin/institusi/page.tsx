'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import {
  Building2,
  Landmark,
  GraduationCap,
  Award,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Edit3,
  Image as ImageIcon,
  Settings,
  ChevronRight,
  Clock,
  UserCheck,
  FileText,
  Upload,
  X,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
} from 'lucide-react';

interface CampusProfile {
  name: string;
  shortName: string;
  foundationName: string;
  address: string;
  website: string;
  email: string;
  academicEmail: string;
  phone: string;
  whatsapp: string;
  accreditation: 'Unggul' | 'A' | 'Baik Sekali' | 'B';
  accreditationSk: string;
  accreditationValidUntil: string;
  ptStatus: string;
  npsn: string;
  ptCode: string;
  establishmentYear: number;
  establishmentSk: string;
  activeSemester: string;
  activeAcademicYear: string;
  rector: string;
  viceRector1: string; // Akademik
  viceRector2: string; // Keuangan & SDM
  viceRector3: string; // Kemahasiswaan
  logoInitials: string;
}

const defaultProfile: CampusProfile = {
  name: 'Institut Teknologi Nusantara',
  shortName: 'ITN',
  foundationName: 'Yayasan Pendidikan Teknologi Nusantara Mandiri',
  address: 'Jl. DI Panjaitan No. 128, Kawasan Pendidikan Terpadu, Jakarta Selatan 12340',
  website: 'https://itn.ac.id',
  email: 'info@itn.ac.id',
  academicEmail: 'baak@itn.ac.id',
  phone: '(021) 7888-9900',
  whatsapp: '0812-3456-7890',
  accreditation: 'Unggul',
  accreditationSk: 'No. 1042/SK/BAN-PT/Ak/PT/VIII/2024',
  accreditationValidUntil: '28 Agustus 2029',
  ptStatus: 'Perguruan Tinggi Swasta (Aktif)',
  npsn: '061024',
  ptCode: '071032',
  establishmentYear: 1993,
  establishmentSk: 'Kepmendikbud No. 048/D/O/1993',
  activeSemester: 'Semester Gasal',
  activeAcademicYear: '2026/2027',
  rector: 'Prof. Dr. Ir. H. Bambang Soedibyo, M.Sc.',
  viceRector1: 'Dr. Ir. Hendra Gunawan, M.T. (Bid. Akademik & Riset)',
  viceRector2: 'Dra. Hj. Sri Wahyuni, M.M., Ak. (Bid. Keuangan & SDM)',
  viceRector3: 'Dr. Rian Hidayat, S.Kom., M.Kom. (Bid. Kemahasiswaan & Kerjasama)',
  logoInitials: 'ITN',
};

export default function SuperAdminProfilInstitusiPage() {
  const [profile, setProfile] = useState<CampusProfile>(defaultProfile);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<CampusProfile>(defaultProfile);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`${fieldName} disalin ke clipboard!`);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleOpenEditModal = () => {
    setEditFormData({ ...profile });
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile({ ...editFormData });
    setIsEditModalOpen(false);
    showToast('Profil institusi berhasil diperbarui!');
  };

  const handleSaveLogo = (newInitials: string) => {
    setProfile((prev) => ({ ...prev, logoInitials: newInitials }));
    setIsLogoModalOpen(false);
    showToast('Logo / Identitas visual institusi berhasil diperbarui!');
  };

  return (
    <PortalLayout
      role="superadmin"
      userName="Bambang Pratama, S.Kom., M.Cs."
      userIdText="Kepala BAAK & Sistem Akademik Kampus"
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-blue-500/30 flex items-center gap-3 animate-fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}

        {/* Header Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
              <Link href="/admin/superadmin" className="hover:text-[#1E3A8A] transition-colors">
                Dashboard
              </Link>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Master Data</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[#1E3A8A] font-bold">Profil Institusi</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-[#1E3A8A]" />
              <span>Profil Perguruan Tinggi</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Data induk identitas resmi, akreditasi, pimpinan, dan legalitas operasional {profile.name}.
            </p>
          </div>

          {/* 3 Main Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsLogoModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
            >
              <ImageIcon className="w-4 h-4 text-slate-500" />
              <span>Ganti Logo</span>
            </button>

            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              <span>Pengaturan Identitas</span>
            </button>

            <button
              onClick={handleOpenEditModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all cursor-pointer shadow-sm hover:shadow-md"
            >
              <Edit3 className="w-4 h-4 text-[#D4A017]" />
              <span>Edit Profil</span>
            </button>
          </div>
        </div>

        {/* Main Identity Banner Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-blue-50/60 pointer-events-none -z-0" />

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-5">
              {/* Logo Badge */}
              <div className="relative group">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[#1E3A8A] via-blue-800 to-blue-600 border-2 border-[#D4A017] text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-md shrink-0">
                  {profile.logoInitials}
                </div>
                <button
                  onClick={() => setIsLogoModalOpen(true)}
                  className="absolute inset-0 bg-slate-900/60 rounded-3xl text-white opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all cursor-pointer text-[10px] font-bold"
                  title="Klik untuk ganti logo"
                >
                  <Upload className="w-4 h-4 mb-0.5" />
                  <span>Ubah</span>
                </button>
              </div>

              {/* Campus Identity */}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 border border-blue-200 text-[#1E3A8A]">
                    {profile.ptStatus}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>Akreditasi {profile.accreditation}</span>
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {profile.name}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-[#1E3A8A] flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{profile.foundationName}</span>
                </p>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{profile.address}</span>
                </p>
              </div>
            </div>

            {/* Current Active Semester Indicator */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 border border-blue-100/80 shrink-0 w-full md:w-auto">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Periode Akademik Berjalan</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-sm font-extrabold text-[#1E3A8A]">
                  {profile.activeSemester} TA {profile.activeAcademicYear}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Status Sinkronisasi PDDIKTI: <span className="text-emerald-600 font-bold">Terhubung (100%)</span></p>
            </div>
          </div>
        </div>

        {/* 6 Key Attributes Grid Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kode PT (DIKTI)</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-base font-black text-slate-900 font-mono">{profile.ptCode}</span>
              <button
                onClick={() => handleCopy(profile.ptCode, 'Kode PT')}
                className="text-slate-400 hover:text-[#1E3A8A] transition-colors"
                title="Salin Kode PT"
              >
                {copiedField === 'Kode PT' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">NPSN</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-base font-black text-slate-900 font-mono">{profile.npsn}</span>
              <button
                onClick={() => handleCopy(profile.npsn, 'NPSN')}
                className="text-slate-400 hover:text-[#1E3A8A] transition-colors"
                title="Salin NPSN"
              >
                {copiedField === 'NPSN' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tahun Berdiri</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-base font-black text-slate-900">{profile.establishmentYear}</span>
              <span className="text-[10px] font-semibold text-slate-500">33 Tahun</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Akreditasi</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-base font-black text-emerald-700">{profile.accreditation}</span>
              <Award className="w-4 h-4 text-emerald-600" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Semester Aktif</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-black text-[#1E3A8A]">{profile.activeSemester}</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tahun Akademik</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs font-black text-slate-900 font-mono">{profile.activeAcademicYear}</span>
              <Calendar className="w-4 h-4 text-[#D4A017]" />
            </div>
          </div>
        </div>

        {/* 2-Column Detail Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Pimpinan Perguruan Tinggi */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Pimpinan Perguruan Tinggi</h3>
                    <p className="text-xs text-slate-500">Rektorat & pimpinan eksekutif akademik</p>
                  </div>
                </div>
                <button
                  onClick={handleOpenEditModal}
                  className="text-xs font-semibold text-[#1E3A8A] hover:underline"
                >
                  Ubah
                </button>
              </div>

              <div className="space-y-4">
                {/* Rektor Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#1E3A8A] text-[#D4A017] flex items-center justify-center font-black text-base shadow-xs shrink-0">
                    R
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rektor Institusi</span>
                    <h4 className="text-sm font-extrabold text-slate-900">{profile.rector}</h4>
                    <p className="text-[11px] text-slate-500">Penanggung Jawab Utama Operasional Perguruan Tinggi</p>
                  </div>
                </div>

                {/* Wakil Rektor 1 */}
                <div className="p-3.5 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1E3A8A] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    WR I
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Wakil Rektor I (Bidang Akademik & Riset)</span>
                    <p className="text-xs font-bold text-slate-900">{profile.viceRector1}</p>
                  </div>
                </div>

                {/* Wakil Rektor 2 */}
                <div className="p-3.5 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    WR II
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Wakil Rektor II (Bidang Keuangan & SDM)</span>
                    <p className="text-xs font-bold text-slate-900">{profile.viceRector2}</p>
                  </div>
                </div>

                {/* Wakil Rektor 3 */}
                <div className="p-3.5 rounded-2xl border border-slate-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    WR III
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Wakil Rektor III (Bidang Kemahasiswaan & Kerjasama)</span>
                    <p className="text-xs font-bold text-slate-900">{profile.viceRector3}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2: Legalitas, Kontak & Alamat Resmi */}
          <div className="space-y-6">
            {/* Legalitas & Akreditasi */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Legalitas & Akreditasi Resmi</h3>
                    <p className="text-xs text-slate-500">Legal standing izin operasional dan BAN-PT</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">SK Pendirian Kampus:</span>
                  <span className="font-bold text-slate-900">{profile.establishmentSk}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Peringkat Akreditasi:</span>
                  <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    {profile.accreditation} (Unggul)
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500">Nomor SK Akreditasi:</span>
                  <span className="font-medium text-slate-800 font-mono text-[11px]">{profile.accreditationSk}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500">Masa Berlaku Akreditasi:</span>
                  <span className="font-bold text-slate-900">{profile.accreditationValidUntil}</span>
                </div>
              </div>
            </div>

            {/* Kontak Resmi & Kanal Informasi */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center font-bold">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Kontak Resmi & Media Kampus</h3>
                    <p className="text-xs text-slate-500">Kanal komunikasi institusi dan BAAK</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-slate-400" />
                    <span>Website Resmi:</span>
                  </span>
                  <a
                    href={profile.website}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-[#1E3A8A] hover:underline flex items-center gap-1"
                  >
                    <span>{profile.website}</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Kampus:</span>
                  </span>
                  <span className="font-semibold text-slate-900 font-mono text-[11px]">{profile.email}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Email Layanan BAAK:</span>
                  </span>
                  <span className="font-semibold text-slate-900 font-mono text-[11px]">{profile.academicEmail}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>Telepon Kantor:</span>
                  </span>
                  <span className="font-semibold text-slate-900">{profile.phone}</span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>WhatsApp Helpdesk:</span>
                  </span>
                  <span className="font-semibold text-emerald-700">{profile.whatsapp}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal: Edit Profil Institusi */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Profil Institusi"
          subtitle="Perbarui informasi legalitas, pimpinan, dan kontak perguruan tinggi"
          icon={<Building2 className="w-5 h-5" />}
          maxWidth="3xl"
        >
          <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {/* Identitas Kampus */}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700">Nama Lengkap Perguruan Tinggi *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.name}
                      onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Nama Yayasan Penyelenggara</label>
                    <input
                      type="text"
                      value={editFormData.foundationName}
                      onChange={(e) => setEditFormData({ ...editFormData, foundationName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Singkatan / Inisial Kampus</label>
                    <input
                      type="text"
                      value={editFormData.shortName}
                      onChange={(e) => setEditFormData({ ...editFormData, shortName: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-bold uppercase"
                    />
                  </div>

                  {/* Kode & Akreditasi */}
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Kode PT (DIKTI) *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.ptCode}
                      onChange={(e) => setEditFormData({ ...editFormData, ptCode: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">NPSN</label>
                    <input
                      type="text"
                      value={editFormData.npsn}
                      onChange={(e) => setEditFormData({ ...editFormData, npsn: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Peringkat Akreditasi</label>
                    <select
                      value={editFormData.accreditation}
                      onChange={(e) => setEditFormData({ ...editFormData, accreditation: e.target.value as any })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white font-semibold"
                    >
                      <option value="Unggul">Unggul</option>
                      <option value="A">A</option>
                      <option value="Baik Sekali">Baik Sekali</option>
                      <option value="B">B</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Tahun Berdiri</label>
                    <input
                      type="number"
                      value={editFormData.establishmentYear}
                      onChange={(e) => setEditFormData({ ...editFormData, establishmentYear: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  {/* Pimpinan */}
                  <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                    <p className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Pimpinan Perguruan Tinggi</p>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700">Rektor *</label>
                    <input
                      type="text"
                      required
                      value={editFormData.rector}
                      onChange={(e) => setEditFormData({ ...editFormData, rector: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Wakil Rektor I (Akademik)</label>
                    <input
                      type="text"
                      value={editFormData.viceRector1}
                      onChange={(e) => setEditFormData({ ...editFormData, viceRector1: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Wakil Rektor II (Keuangan & SDM)</label>
                    <input
                      type="text"
                      value={editFormData.viceRector2}
                      onChange={(e) => setEditFormData({ ...editFormData, viceRector2: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700">Wakil Rektor III (Kemahasiswaan)</label>
                    <input
                      type="text"
                      value={editFormData.viceRector3}
                      onChange={(e) => setEditFormData({ ...editFormData, viceRector3: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  {/* Kontak & Lokasi */}
                  <div className="sm:col-span-2 pt-2 border-t border-slate-100">
                    <p className="font-bold text-slate-500 uppercase tracking-wider text-[11px]">Kontak & Alamat Kampus</p>
                  </div>

                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-slate-700">Alamat Kampus Utama</label>
                    <input
                      type="text"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Website Resmi</label>
                    <input
                      type="text"
                      value={editFormData.website}
                      onChange={(e) => setEditFormData({ ...editFormData, website: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Email Kampus</label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Telepon</label>
                    <input
                      type="text"
                      value={editFormData.phone}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">WhatsApp Helpdesk</label>
                    <input
                      type="text"
                      value={editFormData.whatsapp}
                      onChange={(e) => setEditFormData({ ...editFormData, whatsapp: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all shadow-sm"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </form>
        </Modal>

        {/* Modal: Ganti Logo */}
        <Modal
          isOpen={isLogoModalOpen}
          onClose={() => setIsLogoModalOpen(false)}
          title="Ubah Logo & Inisial Kampus"
          maxWidth="md"
        >

              <div className="space-y-4 text-center py-2">
                <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-[#1E3A8A] to-blue-600 border-2 border-[#D4A017] text-white flex items-center justify-center font-black text-3xl shadow-lg">
                  {profile.logoInitials}
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-xs font-bold text-slate-700">Inisial Lambang Kampus (2-4 Huruf)</label>
                  <input
                    type="text"
                    defaultValue={profile.logoInitials}
                    maxLength={4}
                    id="logo-initials-input"
                    className="w-full px-3.5 py-2 text-center text-base font-black uppercase rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20"
                  />
                  <p className="text-[11px] text-slate-500">Inisial ini akan ditampilkan di navbar, sidebar, kartu identitas, dan laporan resmi.</p>
                </div>

                <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50">
                  <Upload className="w-6 h-6 text-slate-400 mx-auto mb-1.5" />
                  <p className="text-xs font-semibold text-slate-700">Unggah File Logo Transparan (.PNG / .SVG)</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Rasio 1:1, Maksimal 2MB</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
                <button
                  onClick={() => setIsLogoModalOpen(false)}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('logo-initials-input') as HTMLInputElement;
                    if (el && el.value.trim()) {
                      handleSaveLogo(el.value.trim().toUpperCase());
                    }
                  }}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 rounded-xl shadow-xs"
                >
                  Terapkan Logo
                </button>
              </div>
        </Modal>

        {/* Modal: Pengaturan Identitas Kampus */}
        <Modal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          title="Pengaturan Identitas Kampus"
          subtitle="Konfigurasi format nomor ijazah, kop surat & tema institusi"
          icon={<Settings className="w-4 h-4" />}
          maxWidth="lg"
        >

              <div className="space-y-3.5 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                  <p className="font-bold text-slate-800">Format KOP Surat & Dokumen Resmi</p>
                  <p className="text-slate-500 text-[11px]">Kop surat menggunakan logo resmi {profile.shortName}, nama yayasan, dan alamat kampus terdaftar.</p>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Warna Aksen Utama Kampus</label>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#1E3A8A] border-2 border-[#D4A017] shadow-xs shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-900">Nusantara Navy (#1E3A8A) & Gold (#D4A017)</p>
                      <p className="text-[11px] text-slate-400">Warna korporat resmi Institut Teknologi Nusantara</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <label className="font-bold text-slate-700">Format Penomoran Ijazah Nasional (PIN)</label>
                  <p className="font-mono text-[11px] text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                    {profile.ptCode}-2026-XXXXX
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
                <button
                  onClick={() => setIsSettingsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 rounded-xl"
                >
                  Tutup
                </button>
              </div>
        </Modal>
      </div>
    </PortalLayout>
  );
}
