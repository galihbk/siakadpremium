'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import {
  Share2,
  Users,
  Search,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  Download,
  AlertCircle,
  X,
  Copy,
  Check,
  ExternalLink,
  DollarSign,
  TrendingUp,
  Award,
  Phone,
  Tag,
  ToggleLeft,
  ToggleRight,
  Filter,
} from 'lucide-react';

interface ReferralApplicant {
  id: string;
  registrationNumber: string;
  fullName: string;
  email: string;
  phone: string;
  chosenStudyProgram: string;
  jalurPendaftaran: string;
  status: string;
  verifiedAt: string | null;
  createdAt: string;
}

interface AffiliatePartner {
  id: string;
  code: string;
  partnerName: string;
  category: string;
  phone: string;
  commissionPerStudent: number;
  isActive: boolean;
  createdAt: string;
  totalReferrals: number;
  verifiedCount: number;
  passedCount: number;
  registeredCount: number;
  totalCommission: number;
  referrals: ReferralApplicant[];
}

interface AffiliateSummary {
  totalPartners: number;
  totalReferrals: number;
  totalVerified: number;
  totalRegistered: number;
  totalCommissionAll: number;
}

export default function PmbAffiliatePage() {
  const [affiliates, setAffiliates] = useState<AffiliatePartner[]>([]);
  const [summary, setSummary] = useState<AffiliateSummary>({
    totalPartners: 0,
    totalReferrals: 0,
    totalVerified: 0,
    totalRegistered: 0,
    totalCommissionAll: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'partners' | 'referrals'>('partners');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal Detail Partner
  const [selectedPartner, setSelectedPartner] = useState<AffiliatePartner | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // Modal Add Partner
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    partnerName: '',
    category: 'Alumni',
    phone: '',
    commissionPerStudent: 250000,
  });

  // Copied link toast feedback
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const apiBaseUrl = getApiBaseUrl();

  const fetchAffiliates = async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const res = await fetch(`${apiBaseUrl}/admissions/affiliates`, { credentials: 'omit' });
      if (!res.ok) {
        throw new Error('Gagal mengambil data affiliate PMB dari database.');
      }
      const json = await res.json();
      const payload = json.data !== undefined ? json.data : json;
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];
      setAffiliates(list);

      const summaryObj = payload?.summary || json.summary;
      if (summaryObj) {
        setSummary(summaryObj);
      }
    } catch (err: any) {
      setApiError(err.message || 'Terjadi kesalahan saat memuat data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const handleCopyLink = (code: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const registrationUrl = `${origin}/pmb/daftar?ref=${encodeURIComponent(code)}`;
    navigator.clipboard.writeText(registrationUrl);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  const handleToggleStatus = async (code: string) => {
    try {
      const res = await fetch(`${apiBaseUrl}/admissions/affiliates/${encodeURIComponent(code)}/toggle`, {
        method: 'PATCH',
      });
      if (!res.ok) throw new Error('Gagal mengubah status mitra.');
      fetchAffiliates();
    } catch (err: any) {
      alert(err.message || 'Terjadi gangguan saat mengubah status.');
    }
  };

  const handleAddPartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.partnerName.trim()) {
      setFormError('Kode affiliate dan nama mitra wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch(`${apiBaseUrl}/admissions/affiliates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || 'Gagal menambahkan mitra affiliate.');
      }

      setAddModalOpen(false);
      setFormData({
        code: '',
        partnerName: '',
        category: 'Alumni',
        phone: '',
        commissionPerStudent: 250000,
      });
      fetchAffiliates();
    } catch (err: any) {
      setFormError(err.message || 'Gagal menyimpan mitra affiliate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered partners
  const filteredPartners = useMemo(() => {
    const list = Array.isArray(affiliates) ? affiliates : [];
    return list.filter((partner) => {
      const matchSearch =
        partner.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        partner.phone.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = filterCategory === 'ALL' || partner.category === filterCategory;
      const matchStatus =
        filterStatus === 'ALL' ||
        (filterStatus === 'ACTIVE' && partner.isActive) ||
        (filterStatus === 'INACTIVE' && !partner.isActive);

      return matchSearch && matchCategory && matchStatus;
    });
  }, [affiliates, searchQuery, filterCategory, filterStatus]);

  // All referral applicants flattened
  const allReferralApplicants = useMemo(() => {
    const list: Array<ReferralApplicant & { partnerCode: string; partnerName: string }> = [];
    const safeList = Array.isArray(affiliates) ? affiliates : [];
    for (const partner of safeList) {
      if (partner.referrals && partner.referrals.length > 0) {
        for (const ref of partner.referrals) {
          list.push({
            ...ref,
            partnerCode: partner.code,
            partnerName: partner.partnerName,
          });
        }
      }
    }
    return list.filter((item) => {
      const matchSearch =
        item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.partnerCode.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [affiliates, searchQuery]);

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      'Kode Affiliate',
      'Nama Mitra',
      'Kategori',
      'Kontak WA',
      'Total Pendaftar',
      'Terverifikasi Email',
      'Lolos Seleksi',
      'Registrasi Ulang',
      'Komisi Per Siswa',
      'Total Komisi (Rp)',
      'Status Aktif',
    ];

    const rows = filteredPartners.map((p) => [
      `"${p.code}"`,
      `"${p.partnerName}"`,
      `"${p.category}"`,
      `"${p.phone}"`,
      p.totalReferrals,
      p.verifiedCount,
      p.passedCount,
      p.registeredCount,
      p.commissionPerStudent,
      p.totalCommission,
      p.isActive ? 'Aktif' : 'Nonaktif',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `rekap_affiliate_pmb_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatRupiah = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const renderStatus = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md text-[11px] font-semibold">Menunggu Verifikasi</span>;
      case 'VERIFIED':
        return <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md text-[11px] font-semibold">Berkas Valid</span>;
      case 'PASSED':
        return <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] font-semibold">Lolos Seleksi</span>;
      case 'FAILED':
        return <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md text-[11px] font-semibold">Tidak Lolos</span>;
      case 'REGISTERED':
        return <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md text-[11px] font-semibold">Registrasi Ulang</span>;
      default:
        return <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[11px] font-semibold">{status}</span>;
    }
  };

  return (
    <PortalLayout
      role="pmb"
      userName="Bagus Wicaksono, S.Kom."
      userIdText="Panitia PMB ITN"
      activeMenuHref="/admin/pmb/affiliate"
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        
        {/* Header Title */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-blue-50 text-[#1E3A8A]">
                <Share2 className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Program Affiliate & Referral PMB
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500">
              Direktori mitra rujukan, kode affiliate, pemantauan calon mahasiswa referral, dan akumulasi reward komisi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
            <button
              onClick={() => setAddModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#D4A017]" />
              <span>Tambah Mitra Affiliate</span>
            </button>

            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ekspor CSV</span>
            </button>
          </div>
        </div>

        {apiError && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={fetchAffiliates}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* 5 KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mitra Aktif</span>
              <span className="p-2 rounded-xl bg-blue-50 text-[#1E3A8A]">
                <Tag className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-slate-900">{summary.totalPartners}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Kode terdaftar</div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Referral</span>
              <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-indigo-600">{summary.totalReferrals}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Pendaftar baru</div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Terverifikasi</span>
              <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-emerald-600">{summary.totalVerified}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Email tervalidasi</div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-subtle flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Registrasi Ulang</span>
              <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Award className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-black text-purple-600">{summary.totalRegistered}</div>
              <div className="text-[11px] text-slate-400 mt-0.5">Mahasiswa resmi</div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-subtle flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Akumulasi Komisi</span>
              <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div>
              <div className="text-base sm:text-lg font-black text-amber-700 truncate">
                {formatRupiah(summary.totalCommissionAll)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Reward mitra</div>
            </div>
          </div>
        </div>

        {/* Tab Selector & Filters */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('partners')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'partners'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Daftar Mitra Affiliate ({filteredPartners.length})
              </button>

              <button
                onClick={() => setActiveTab('referrals')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'referrals'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Log Pendaftar Referral ({allReferralApplicants.length})
              </button>
            </div>

            {copiedCode && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold animate-in fade-in">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Link pendaftaran untuk kode {copiedCode} berhasil disalin!</span>
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  activeTab === 'partners'
                    ? 'Cari kode affiliate, nama mitra, atau nomor telepon...'
                    : 'Cari nama calon mahasiswa, no registrasi, atau kode affiliate...'
                }
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
              />
            </div>

            {activeTab === 'partners' && (
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
                >
                  <option value="ALL">Semua Kategori</option>
                  <option value="Alumni">Alumni</option>
                  <option value="Guru / Sekolah">Guru / Sekolah</option>
                  <option value="Mahasiswa">Mahasiswa</option>
                  <option value="Influencer / Komunitas">Influencer / Komunitas</option>
                  <option value="Umum / Pendaftar">Umum / Pendaftar</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white font-medium text-slate-700"
                >
                  <option value="ALL">Semua Status</option>
                  <option value="ACTIVE">Aktif Saja</option>
                  <option value="INACTIVE">Non-Aktif Saja</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* TAB 1: DAFTAR MITRA AFFILIATE */}
        {activeTab === 'partners' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">KODE AFFILIATE</th>
                    <th className="py-3.5 px-4">NAMA MITRA & KATEGORI</th>
                    <th className="py-3.5 px-4">KONTAK</th>
                    <th className="py-3.5 px-4 text-center">TOTAL REFERRAL</th>
                    <th className="py-3.5 px-4 text-center">TERVERIFIKASI</th>
                    <th className="py-3.5 px-4 text-center">REGISTRASI ULANG</th>
                    <th className="py-3.5 px-4 text-right">TOTAL KOMISI</th>
                    <th className="py-3.5 px-4 text-center">STATUS</th>
                    <th className="py-3.5 px-4 text-center">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#1E3A8A]" />
                        <span>Memuat data affiliate PMB...</span>
                      </td>
                    </tr>
                  ) : filteredPartners.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-10 text-center text-slate-400">
                        Tidak ada data mitra affiliate yang sesuai dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredPartners.map((partner) => (
                      <tr key={partner.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#1E3A8A]">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                              {partner.code}
                            </span>
                            <button
                              onClick={() => handleCopyLink(partner.code)}
                              title="Salin tautan pendaftaran referral"
                              className="p-1 rounded-md text-slate-400 hover:text-[#1E3A8A] hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{partner.partnerName}</div>
                          <div className="text-[11px] text-slate-500">{partner.category}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{partner.phone}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-center font-bold text-slate-800">
                          {partner.totalReferrals}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px]">
                            {partner.verifiedCount}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-bold text-[11px]">
                            {partner.registeredCount}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right font-bold text-amber-700 font-mono">
                          {formatRupiah(partner.totalCommission)}
                        </td>

                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleStatus(partner.code)}
                            className="cursor-pointer"
                            title="Klik untuk ubah status aktif/non-aktif"
                          >
                            {partner.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Aktif
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                Non-Aktif
                              </span>
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => {
                                setSelectedPartner(partner);
                                setDetailModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Lihat daftar mahasiswa referral"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCopyLink(partner.code)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-slate-100 transition-colors cursor-pointer"
                              title="Salin tautan pendaftaran"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: LOG PENDAFTAR REFERRAL */}
        {activeTab === 'referrals' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4">NO. REGISTRASI</th>
                    <th className="py-3.5 px-4">NAMA PENDAFTAR</th>
                    <th className="py-3.5 px-4">PROGRAM STUDI</th>
                    <th className="py-3.5 px-4">KODE AFFILIATE</th>
                    <th className="py-3.5 px-4">MITRA RUJUKAN</th>
                    <th className="py-3.5 px-4 text-center">VERIFIKASI EMAIL</th>
                    <th className="py-3.5 px-4 text-center">STATUS SELEKSI</th>
                    <th className="py-3.5 px-4">TGL DAFTAR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {allReferralApplicants.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400">
                        Belum ada data pendaftar yang menggunakan kode affiliate referral.
                      </td>
                    </tr>
                  ) : (
                    allReferralApplicants.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-[#1E3A8A]">
                          {item.registrationNumber}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.fullName}</div>
                          <div className="text-[11px] text-slate-500">{item.email}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{item.chosenStudyProgram}</td>
                        <td className="py-3 px-4 font-mono font-bold text-[#1E3A8A]">
                          <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded-md text-[11px]">
                            {item.partnerCode}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{item.partnerName}</td>
                        <td className="py-3 px-4 text-center">
                          {item.verifiedAt ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Terverifikasi
                            </span>
                          ) : (
                            <span className="text-amber-700 font-semibold text-[11px] bg-amber-50 px-2 py-0.5 rounded-full">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">{renderStatus(item.status)}</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {new Date(item.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* MODAL DETAIL MITRA */}
        {detailModalOpen && selectedPartner && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
              <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
                <div>
                  <h2 className="text-lg font-black text-slate-900">
                    Rincian Mitra: {selectedPartner.partnerName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Kode Referral: <strong className="text-[#1E3A8A] font-mono">{selectedPartner.code}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 sm:p-6 space-y-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[11px] text-slate-500">Total Pendaftar</div>
                    <div className="text-lg font-black text-slate-900">{selectedPartner.totalReferrals}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[11px] text-slate-500">Terverifikasi Email</div>
                    <div className="text-lg font-black text-emerald-600">{selectedPartner.verifiedCount}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[11px] text-slate-500">Registrasi Ulang</div>
                    <div className="text-lg font-black text-purple-600">{selectedPartner.registeredCount}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[11px] text-slate-500">Total Komisi</div>
                    <div className="text-sm font-black text-amber-700 truncate">
                      {formatRupiah(selectedPartner.totalCommission)}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Daftar Calon Mahasiswa yang Dirujuk ({selectedPartner.referrals?.length || 0})
                  </h3>

                  {(!selectedPartner.referrals || selectedPartner.referrals.length === 0) ? (
                    <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                      Belum ada calon mahasiswa yang mendaftar menggunakan kode referral ini.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[11px] font-bold">
                          <tr>
                            <th className="py-2.5 px-3">No. Registrasi</th>
                            <th className="py-2.5 px-3">Nama Lengkap</th>
                            <th className="py-2.5 px-3">Program Studi</th>
                            <th className="py-2.5 px-3 text-center">Verifikasi</th>
                            <th className="py-2.5 px-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {selectedPartner.referrals.map((r) => (
                            <tr key={r.id}>
                              <td className="py-2 px-3 font-mono font-bold text-[#1E3A8A]">
                                {r.registrationNumber}
                              </td>
                              <td className="py-2 px-3">
                                <div className="font-semibold text-slate-800">{r.fullName}</div>
                                <div className="text-[10px] text-slate-500">{r.email}</div>
                              </td>
                              <td className="py-2 px-3 text-slate-700">{r.chosenStudyProgram}</td>
                              <td className="py-2 px-3 text-center">
                                {r.verifiedAt ? (
                                  <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full">
                                    Aktif
                                  </span>
                                ) : (
                                  <span className="text-amber-700 font-medium text-[10px] bg-amber-50 px-2 py-0.5 rounded-full">
                                    Pending
                                  </span>
                                )}
                              </td>
                              <td className="py-2 px-3 text-center">{renderStatus(r.status)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                <button
                  onClick={() => setDetailModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL TAMBAH MITRA AFFILIATE */}
        {addModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-200 flex items-center justify-between">
                <h2 className="text-base font-black text-slate-900">
                  Tambah Mitra Affiliate Baru
                </h2>
                <button
                  onClick={() => setAddModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddPartnerSubmit} className="p-5 space-y-4 text-xs">
                {formError && (
                  <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{formError}</span>
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Kode Affiliate Unik <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="Contoh: ALUMNI-2027 atau SMA1-MAJENANG"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono font-bold focus:outline-hidden focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Kode ini yang akan dimasukkan pendaftar atau disertakan di URL referral.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nama Mitra / Pemilik <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.partnerName}
                    onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                    placeholder="Contoh: Ikatan Alumni ITN atau Bpk. Haryono"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:border-[#1E3A8A] focus:ring-1 focus:ring-[#1E3A8A]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="Alumni">Alumni</option>
                      <option value="Guru / Sekolah">Guru / Sekolah</option>
                      <option value="Mahasiswa">Mahasiswa</option>
                      <option value="Influencer / Komunitas">Influencer / Komunitas</option>
                      <option value="Umum / Pendaftar">Umum / Pendaftar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nomor WhatsApp</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0812xxxx"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Komisi Reward per Registrasi Ulang (Rp)
                  </label>
                  <input
                    type="number"
                    value={formData.commissionPerStudent}
                    onChange={(e) => setFormData({ ...formData, commissionPerStudent: Number(e.target.value) })}
                    placeholder="250000"
                    step={10000}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? 'Menyimpan...' : 'Simpan Mitra'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </PortalLayout>
  );
}
