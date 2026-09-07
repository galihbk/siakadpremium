'use client';

import { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import {
  Globe,
  Sliders,
  UserCheck,
  Bell,
  PhoneCall,
  Save,
  CheckCircle2,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Layers,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface LandingPageData {
  campusName: string;
  campusShortName: string;
  tagline: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  heroCtaLink: string;
  heroSecondaryCtaText: string;
  heroSecondaryCtaLink: string;
  rectorName: string;
  rectorTitle: string;
  rectorQuote: string;
  rectorSpeech: string;
  rectorImageUrl: string;
  announcementActive: boolean;
  announcementBadge: string;
  announcementText: string;
  announcementLink: string;
  contactAddress: string;
  contactPhone: string;
  contactEmail: string;
  contactWhatsapp: string;
  socialInstagram: string;
  socialYoutube: string;
  socialLinkedin: string;
}

const DEFAULT_DATA: LandingPageData = {
  campusName: 'Institut Teknologi Nusantara',
  campusShortName: 'ITN',
  tagline: 'Kampus Inovasi Teknologi Masa Depan',
  heroBadge: 'Penerimaan Mahasiswa Baru TA 2026/2027 Telah Dibuka!',
  heroTitle: 'Membentuk Generasi Unggul di Era Transformasi Digital',
  heroSubtitle:
    'Institut Teknologi Nusantara (ITN) memadukan keunggulan akademik berstandar internasional, riset terapan mutakhir, dan ekosistem industri teknologi terdepan untuk mencetak profesional dan entrepreneur masa depan.',
  heroCtaText: 'Daftar Sekarang (PMB)',
  heroCtaLink: '/pmb',
  heroSecondaryCtaText: 'Jelajahi Program Studi',
  heroSecondaryCtaLink: '/#program-studi',
  rectorName: 'Prof. Dr. Ir. Hendra Gunawan, M.Eng.',
  rectorTitle: 'Rektor Institut Teknologi Nusantara',
  rectorQuote:
    'Pendidikan di ITN tidak hanya berfokus pada penguasaan teori semata, melainkan melahirkan karya nyata dan solusi inovatif berdaya saing global bagi kemajuan bangsa.',
  rectorSpeech:
    'Selamat datang di kampus masa depan, Institut Teknologi Nusantara. Di tengah gelombang disrupsi kecerdasan buatan dan otomatisasi global, ITN berkomitmen penuh untuk menghadirkan kurikulum adaptif berbasis industri serta riset terapan kelas dunia.\n\nKami membekali setiap civitas akademika dengan fasilitas laboratorium superkomputasi, inkubator startup teknologi, dan jejaring magang internasional agar setiap lulusan tidak hanya siap kerja, tetapi juga siap memimpin masa depan. Bersama ITN, mari kita wujudkan impian besar Anda dalam ekosistem akademik yang inspiratif, inklusif, dan unggul.',
  rectorImageUrl: '/images/rector.png',
  announcementActive: true,
  announcementBadge: 'INFO AKADEMIK TERKINI',
  announcementText:
    'Pengisian KRS Semester Ganjil 2026/2027 diperpanjang hingga 31 Agustus 2026 pukul 23:59 WIB. Pastikan konsultasi Dosen PA telah disetujui.',
  announcementLink: '/portal',
  contactAddress: 'Jl. Raya Pendidikan No. 45, Kampus Terpadu ITN Cyber Park, Jakarta Selatan 12430',
  contactPhone: '(021) 7890-1234',
  contactEmail: 'info@itn.ac.id',
  contactWhatsapp: '+62 812-3456-7890',
  socialInstagram: 'https://instagram.com/itn_official',
  socialYoutube: 'https://youtube.com/@itnofficial',
  socialLinkedin: 'https://linkedin.com/school/itn-official',
};

export default function SuperAdminCmsPage() {
  const [activeTab, setActiveTab] = useState<'hero' | 'rector' | 'announcement' | 'contact' | 'articles'>('hero');
  const [formData, setFormData] = useState<LandingPageData>(DEFAULT_DATA);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
  const webBaseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3000';

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await fetch(`${apiBaseUrl}/landing-page`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setFormData((prev) => ({ ...prev, ...json.data }));
          }
        }
      } catch (err) {
        console.warn('Gagal memuat konfigurasi landing page dari API, menggunakan default.', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [apiBaseUrl]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSaveSuccess(false);

    try {
      const { token } = getAuthSession();
      const res = await fetch(`${apiBaseUrl}/landing-page`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Gagal menyimpan perubahan ke server.');
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan saat menyimpan pengaturan.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PortalLayout
      role="superadmin"
      userName="Bambang Pratama, S.Kom., M.Cs."
      userIdText="Super Administrator & Pengelola Konten CMS"
    >
      <div className="space-y-6">
        {/* Banner Title Header */}
        <div className="bg-gradient-to-r from-slate-900 via-[#1E3A8A] to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border border-blue-900/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#D4A017] text-slate-950">
                <Sparkles className="w-3 h-3" />
                CMS Control Center (Super Admin)
              </span>
              <span className="text-xs text-blue-200">Database Engine: PostgreSQL</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">
              Manajemen Konten & Tampilan Landing Page Kampus
            </h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl">
              Ubah judul banner, kutipan & sambutan rektor, pengumuman akademik aktif, kontak, serta media publikasi kampus secara real-time.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <a
              href={webBaseUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Lihat Website Kampus</span>
            </a>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 text-xs font-black rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Semua Perubahan'}</span>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {saveSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-center gap-3 shadow-xs animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <strong className="font-bold">Berhasil Disimpan!</strong> Konten landing page telah diperbarui di database dan disinkronkan ke website utama.
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 flex items-center gap-3 shadow-xs">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="text-xs">
              <strong className="font-bold">Gagal Menyimpan:</strong> {errorMsg}
            </div>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
          <button
            onClick={() => setActiveTab('hero')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'hero'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>1. Hero & Branding Utama</span>
          </button>
          <button
            onClick={() => setActiveTab('rector')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'rector'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>2. Sambutan Rektor</span>
          </button>
          <button
            onClick={() => setActiveTab('announcement')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'announcement'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>3. Banner Pengumuman</span>
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'contact'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <PhoneCall className="w-4 h-4" />
            <span>4. Kontak & Lokasi Kampus</span>
          </button>
          <button
            onClick={() => setActiveTab('articles')}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'articles'
                ? 'border-[#1E3A8A] text-[#1E3A8A]'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>5. Berita & Informasi</span>
          </button>
        </div>

        {/* Content Form Card */}
        <form onSubmit={handleSave} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          
          {/* TAB 1: HERO & BRANDING */}
          {activeTab === 'hero' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Pengaturan Hero Banner & Branding</h2>
                <p className="text-xs text-slate-500">Sesuaikan nama kampus, tagline, judul promosi utama, serta tombol CTA pendaftaran.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Resmi Perguruan Tinggi</label>
                  <input
                    type="text"
                    name="campusName"
                    value={formData.campusName}
                    onChange={handleChange}
                    className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Singkatan Kampus (Akronim)</label>
                  <input
                    type="text"
                    name="campusShortName"
                    value={formData.campusShortName}
                    onChange={handleChange}
                    className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tagline Kampus</label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Badge Atas Hero (Pemberitahuan Singkat)</label>
                <input
                  type="text"
                  name="heroBadge"
                  value={formData.heroBadge}
                  onChange={handleChange}
                  className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Utama Hero (Headline Banner)</label>
                <input
                  type="text"
                  name="heroTitle"
                  value={formData.heroTitle}
                  onChange={handleChange}
                  className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subjudul / Deskripsi Hero</label>
                <textarea
                  name="heroSubtitle"
                  rows={3}
                  value={formData.heroSubtitle}
                  onChange={handleChange}
                  className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teks Tombol CTA Utama</label>
                  <input
                    type="text"
                    name="heroCtaText"
                    value={formData.heroCtaText}
                    onChange={handleChange}
                    className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tautan Tombol CTA Utama</label>
                  <input
                    type="text"
                    name="heroCtaLink"
                    value={formData.heroCtaLink}
                    onChange={handleChange}
                    className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SAMBUTAN REKTOR */}
          {activeTab === 'rector' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Pengaturan Sambutan Rektor</h2>
                <p className="text-xs text-slate-500">Kelola identitas pimpinan kampus, kutipan inspiratif, dan isi pidato sambutan.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap & Gelar Rektor</label>
                  <input
                    type="text"
                    name="rectorName"
                    value={formData.rectorName}
                    onChange={handleChange}
                    className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jabatan Resmi</label>
                  <input
                    type="text"
                    name="rectorTitle"
                    value={formData.rectorTitle}
                    onChange={handleChange}
                    className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Kutipan Singkat (Highlight Quote)</label>
                <input
                  type="text"
                  name="rectorQuote"
                  value={formData.rectorQuote}
                  onChange={handleChange}
                  className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Isi Pidato Sambutan Lengkap</label>
                <textarea
                  name="rectorSpeech"
                  rows={6}
                  value={formData.rectorSpeech}
                  onChange={handleChange}
                  className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl font-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">URL Foto Resmi Rektor</label>
                <input
                  type="text"
                  name="rectorImageUrl"
                  value={formData.rectorImageUrl}
                  onChange={handleChange}
                  placeholder="/images/rector.png"
                  className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* TAB 3: BANNER PENGUMUMAN */}
          {activeTab === 'announcement' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Pengaturan Banner Pengumuman Running/Sticky</h2>
                <p className="text-xs text-slate-500">Tampilkan atau sembunyikan info darurat, batas waktu KRS, atau berita penting di bagian teratas website.</p>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <input
                  type="checkbox"
                  id="announcementActive"
                  name="announcementActive"
                  checked={formData.announcementActive}
                  onChange={(e) => setFormData((prev) => ({ ...prev, announcementActive: e.target.checked }))}
                  className="w-4 h-4 text-[#1E3A8A] rounded focus:ring-blue-500"
                />
                <label htmlFor="announcementActive" className="text-xs sm:text-sm font-bold text-slate-800 cursor-pointer">
                  Aktifkan Banner Pengumuman di Tampilan Teratas Website
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Label / Badge Pengumuman</label>
                <input
                  type="text"
                  name="announcementBadge"
                  value={formData.announcementBadge}
                  onChange={handleChange}
                  className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Isi Teks Pengumuman</label>
                <textarea
                  name="announcementText"
                  rows={3}
                  value={formData.announcementText}
                  onChange={handleChange}
                  className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tautan / Arah Link Pengumuman (Opsional)</label>
                <input
                  type="text"
                  name="announcementLink"
                  value={formData.announcementLink}
                  onChange={handleChange}
                  className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* TAB 4: KONTAK & LOKASI */}
          {activeTab === 'contact' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Kontak Resmi & Media Sosial Kampus</h2>
                <p className="text-xs text-slate-500">Data ini muncul pada footer website dan halaman kontak kampus.</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Gedung Rektorat & Kampus Terpadu</label>
                <textarea
                  name="contactAddress"
                  rows={2}
                  value={formData.contactAddress}
                  onChange={handleChange}
                  className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Telepon Kantor</label>
                  <input
                    type="text"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Resmi</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleChange}
                    className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Helpdesk</label>
                  <input
                    type="text"
                    name="contactWhatsapp"
                    value={formData.contactWhatsapp}
                    onChange={handleChange}
                    className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tautan Media Sosial</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Instagram URL</label>
                    <input
                      type="text"
                      name="socialInstagram"
                      value={formData.socialInstagram}
                      onChange={handleChange}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">YouTube Channel URL</label>
                    <input
                      type="text"
                      name="socialYoutube"
                      value={formData.socialYoutube}
                      onChange={handleChange}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">LinkedIn Profile URL</label>
                    <input
                      type="text"
                      name="socialLinkedin"
                      value={formData.socialLinkedin}
                      onChange={handleChange}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: BERITA & ARTIKEL */}
          {activeTab === 'articles' && (
            <div className="space-y-5">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Manajemen Berita & Pengumuman Landing Page</h2>
                  <p className="text-xs text-slate-500">Artikel yang tersimpan di database dan tampil di carousel Berita Terkini.</p>
                </div>
                <button
                  type="button"
                  onClick={() => alert('Fitur publikasi artikel baru siap terintegrasi!')}
                  className="px-3.5 py-1.5 bg-[#1E3A8A] text-white text-xs font-bold rounded-lg shadow-xs hover:bg-[#172554]"
                >
                  + Tambah Berita Baru
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Prestasi</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">ITN Raih Juara 1 Kompetisi AI & Robotika Nasional 2026</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Penulis: Humas ITN &bull; Status: Dipublikasikan &bull; Featured: Ya</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">Aktif</span>
                </div>

                <div className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">Akademik</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">Kuliah Umum Internasional: Kolaborasi Riset Cloud Computing dengan Silicon Valley</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Penulis: Biro Kerjasama ITN &bull; Status: Dipublikasikan</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">Aktif</span>
                </div>

                <div className="p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-colors bg-slate-50/50 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">Beasiswa</span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">Sosialisasi Program Beasiswa Unggulan Cendekia Nusantara TA 2026/2027</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Penulis: Panitia PMB ITN &bull; Status: Dipublikasikan</p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">Aktif</span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Perubahan akan langsung tersimpan di database PostgreSQL dan disajikan ke pengunjung website.
            </span>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-[#D4A017]" />
              <span>{isSaving ? 'Menyimpan ke Database...' : 'Simpan Perubahan'}</span>
            </button>
          </div>

        </form>

      </div>
    </PortalLayout>
  );
}
