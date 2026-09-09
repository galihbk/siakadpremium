'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import {
  Wallet,
  TrendingUp,
  CreditCard,
  Landmark,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Plus,
  Download,
  Printer,
  Eye,
  Check,
  X,
  Building2,
  ChevronRight,
  ArrowUpRight,
  FileText,
  RefreshCw,
  SlidersHorizontal,
  DollarSign,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';

interface Transaction {
  id: string;
  invoiceNo: string;
  nim: string;
  studentName: string;
  studyProgram: string;
  semester: number;
  type: string;
  amount: number;
  paymentMethod: string;
  date: string;
  status: 'LUNAS' | 'MENUNGGU VERIFIKASI' | 'TERTUNDA';
  channel?: string;
  notes?: string;
}

interface BankAccount {
  bank: string;
  accountNumber: string;
  accountName: string;
  balance: number;
  status: string;
}

interface BudgetExpenditure {
  category: string;
  allocated: number;
  spent: number;
  percentage: number;
}

const DEFAULT_BANKS: BankAccount[] = [
  {
    bank: 'Bank BNI (Virtual Account & Host-to-Host)',
    accountNumber: '08234-9988-121',
    accountName: 'Yayasan ITN Malang - Rek Operasional UKT',
    balance: 12450000000,
    status: 'Online Terintegrasi',
  },
  {
    bank: 'Bank Mandiri (Mandiri Bill Payment)',
    accountNumber: '144-00-9821-331',
    accountName: 'Institut Teknologi Nusantara - Kas Umum',
    balance: 8120500000,
    status: 'Online Terintegrasi',
  },
  {
    bank: 'Bank BRI (BRIVA Terpadu)',
    accountNumber: '0021-01-002931-50-2',
    accountName: 'ITN Malang - Dana Mahasiswa & Wisuda',
    balance: 5340000000,
    status: 'Online Terintegrasi',
  },
  {
    bank: 'Bank BCA (Payroll & Sarpras Kampus)',
    accountNumber: '822-019-3381',
    accountName: 'Institut Teknologi Nusantara - Sarpras',
    balance: 2730000000,
    status: 'Online Terintegrasi',
  },
];

const DEFAULT_BUDGET: BudgetExpenditure[] = [
  {
    category: 'Gaji Dosen, Pengajar & Pegawai',
    allocated: 5000000000,
    spent: 4250000000,
    percentage: 85,
  },
  {
    category: 'Sarana Prasarana & Pemeliharaan Kampus',
    allocated: 4000000000,
    spent: 2400000000,
    percentage: 60,
  },
  {
    category: 'Operasional Akademik, Ujian & Lab',
    allocated: 2000000000,
    spent: 1400000000,
    percentage: 70,
  },
  {
    category: 'Dana Penelitian & Pengabdian P3M',
    allocated: 1500000000,
    spent: 825000000,
    percentage: 55,
  },
  {
    category: 'Beasiswa Mahasiswa & Bantuan UKT',
    allocated: 1200000000,
    spent: 545000000,
    percentage: 45,
  },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TRX-101',
    invoiceNo: 'INV/2026/GASAL/0819',
    nim: '2211001',
    studentName: 'Ahmad Faiz Pratama',
    studyProgram: 'Teknik Informatika',
    semester: 5,
    type: 'SPP / UKT Gasal',
    amount: 4500000,
    paymentMethod: 'VA BNI (Host to Host)',
    date: '08 Sep 2026 14:22',
    status: 'LUNAS',
    notes: 'Pembayaran otomatis lunas via BNI H2H Gateway',
  },
  {
    id: 'TRX-102',
    invoiceNo: 'INV/2026/GASAL/0820',
    nim: '2211002',
    studentName: 'Dewi Lestari',
    studyProgram: 'Teknik Informatika',
    semester: 5,
    type: 'SPP / UKT Gasal',
    amount: 4500000,
    paymentMethod: 'Mandiri Bill',
    date: '08 Sep 2026 11:05',
    status: 'LUNAS',
    notes: 'Terverifikasi sistem perbankan Mandiri',
  },
  {
    id: 'TRX-103',
    invoiceNo: 'INV/2026/GASAL/0821',
    nim: '2321015',
    studentName: 'Bima Satria Nugraha',
    studyProgram: 'Sistem Informasi',
    semester: 3,
    type: 'Biaya Praktikum & Laboratorium',
    amount: 1250000,
    paymentMethod: 'Teller Bank BNI',
    date: '09 Sep 2026 09:30',
    status: 'MENUNGGU VERIFIKASI',
    notes: 'Bukti transfer teller telah diunggah mahasiswa. Butuh verifikasi kasir.',
  },
  {
    id: 'TRX-104',
    invoiceNo: 'INV/2026/GASAL/0822',
    nim: '2111044',
    studentName: 'Siti Rahmawati',
    studyProgram: 'Teknik Elektro',
    semester: 7,
    type: 'Biaya Wisuda & Yudisium ke-48',
    amount: 2200000,
    paymentMethod: 'QRIS Dinamis',
    date: '09 Sep 2026 10:15',
    status: 'LUNAS',
    notes: 'Pembayaran instan QRIS Nasional',
  },
  {
    id: 'TRX-105',
    invoiceNo: 'INV/2026/GASAL/0823',
    nim: '2411089',
    studentName: 'Muhammad Rizky Firdaus',
    studyProgram: 'Teknik Sipil',
    semester: 1,
    type: 'Registrasi Mahasiswa Baru (PMB)',
    amount: 5750000,
    paymentMethod: 'BRIVA BRI',
    date: '07 Sep 2026 16:40',
    status: 'LUNAS',
    notes: 'Gelombang 1 Reguler',
  },
  {
    id: 'TRX-106',
    invoiceNo: 'INV/2026/GASAL/0824',
    nim: '2211056',
    studentName: 'Anisa Putri Maharani',
    studyProgram: 'Teknik Mesin',
    semester: 5,
    type: 'SPP / UKT Gasal',
    amount: 4500000,
    paymentMethod: 'Virtual Account',
    date: '01 Sep 2026',
    status: 'TERTUNDA',
    notes: 'Belum dibayarkan. Jatuh tempo tgl 20 Sep 2026',
  },
  {
    id: 'TRX-107',
    invoiceNo: 'INV/2026/GASAL/0825',
    nim: '2311032',
    studentName: 'Farhan Dwi Saputra',
    studyProgram: 'Teknik Informatika',
    semester: 3,
    type: 'SPP / UKT Gasal',
    amount: 4500000,
    paymentMethod: 'Teller Bank Mandiri',
    date: '09 Sep 2026 13:45',
    status: 'MENUNGGU VERIFIKASI',
    notes: 'Setoran tunai cabang Klojen Malang. Menunggu konfirmasi admin.',
  },
  {
    id: 'TRX-108',
    invoiceNo: 'INV/2026/GASAL/0826',
    nim: '2011012',
    studentName: 'Dina Kusuma Wardani',
    studyProgram: 'Teknik Industri',
    semester: 9,
    type: 'SPP / UKT Perpanjangan Skripsi',
    amount: 2250000,
    paymentMethod: 'Virtual Account BCA',
    date: '02 Sep 2026',
    status: 'TERTUNDA',
    notes: 'Tunggakan perpanjangan studi tahap 1',
  },
];

export default function FinanceDashboardPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(DEFAULT_BANKS);
  const [budgetAllocation, setBudgetAllocation] = useState<BudgetExpenditure[]>(DEFAULT_BUDGET);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LUNAS' | 'MENUNGGU VERIFIKASI' | 'TERTUNDA'>('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [isLoadingApi, setIsLoadingApi] = useState(false);

  // Modals state
  const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [trxToVerify, setTrxToVerify] = useState<Transaction | null>(null);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);

  // New Invoice Form
  const [newInvoice, setNewInvoice] = useState({
    nim: '',
    studentName: '',
    studyProgram: 'Teknik Informatika',
    semester: 1,
    type: 'SPP / UKT Gasal',
    amount: 4500000,
    notes: 'Tagihan resmi semester aktif',
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch initial data from backend if available
  useEffect(() => {
    async function loadBackendData() {
      setIsLoadingApi(true);
      try {
        const res = await fetch('http://localhost:3001/api/v1/finance/dashboard');
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            if (json.data.bankAccounts) setBankAccounts(json.data.bankAccounts);
            if (json.data.budgetAllocation) setBudgetAllocation(json.data.budgetAllocation);
            if (json.data.recentTransactions && json.data.recentTransactions.length > 0) {
              setTransactions(json.data.recentTransactions);
            }
          }
        }
      } catch (err) {
        console.warn('Backend finance endpoint not reachable, running with default verified campus dataset.', err);
      } finally {
        setIsLoadingApi(false);
      }
    }
    loadBackendData();
  }, []);

  // Format currency
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Metrics summary
  const totalPenerimaan = 14850000000;
  const targetPenerimaan = 18000000000;
  const totalTunggakan = 3150000000;
  const totalPengeluaran = 9420000000;
  const totalSaldoBank = bankAccounts.reduce((acc, b) => acc + b.balance, 0);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        t.nim.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.invoiceNo.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchType = typeFilter === 'ALL' || t.type.toLowerCase().includes(typeFilter.toLowerCase());

      return matchSearch && matchStatus && matchType;
    });
  }, [transactions, searchTerm, statusFilter, typeFilter]);

  // Handle Verify Transaction
  const handleVerify = async (trx: Transaction) => {
    try {
      // Send to backend API
      fetch(`http://localhost:3001/api/v1/finance/transactions/${trx.id}/verify`, {
        method: 'POST',
      }).catch((e) => console.log('Background API call done/mocked:', e));

      setTransactions((prev) =>
        prev.map((item) =>
          item.id === trx.id
            ? {
                ...item,
                status: 'LUNAS',
                paymentMethod: item.paymentMethod + ' (Diverifikasi)',
                notes: 'Telah diverifikasi dan disahkan oleh staf biro keuangan.',
              }
            : item
        )
      );

      setIsVerifyModalOpen(false);
      setTrxToVerify(null);
      showToast(`Berhasil! Pembayaran tagihan ${trx.invoiceNo} telah diverifikasi dan berstatus LUNAS.`);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Create New Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.nim || !newInvoice.studentName) {
      alert('Mohon isi NIM dan Nama Mahasiswa dengan lengkap');
      return;
    }

    const randomInvNum = Math.floor(1000 + Math.random() * 9000);
    const invoiceNo = `INV/2026/GASAL/${randomInvNum}`;
    const newTrx: Transaction = {
      id: `TRX-${Date.now()}`,
      invoiceNo,
      nim: newInvoice.nim,
      studentName: newInvoice.studentName,
      studyProgram: newInvoice.studyProgram,
      semester: Number(newInvoice.semester),
      type: newInvoice.type,
      amount: Number(newInvoice.amount),
      paymentMethod: 'Virtual Account BNI / BRIVA',
      date: '09 Sep 2026 (Hari ini)',
      status: 'TERTUNDA',
      notes: newInvoice.notes,
    };

    // Try posting to API
    fetch('http://localhost:3001/api/v1/finance/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInvoice),
    }).catch((e) => console.log('Invoice API sync:', e));

    setTransactions((prev) => [newTrx, ...prev]);
    setIsNewInvoiceModalOpen(false);
    showToast(`Tagihan baru ${invoiceNo} atas nama ${newInvoice.studentName} berhasil diterbitkan.`);
    setNewInvoice({
      nim: '',
      studentName: '',
      studyProgram: 'Teknik Informatika',
      semester: 1,
      type: 'SPP / UKT Gasal',
      amount: 4500000,
      notes: 'Tagihan resmi semester aktif',
    });
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = ['No Invoice', 'NIM', 'Nama Mahasiswa', 'Prodi', 'Semester', 'Jenis Pembayaran', 'Nominal (Rp)', 'Metode', 'Tanggal', 'Status'];
    const rows = filteredTransactions.map((t) => [
      t.invoiceNo,
      t.nim,
      `"${t.studentName}"`,
      `"${t.studyProgram}"`,
      t.semester,
      `"${t.type}"`,
      t.amount,
      `"${t.paymentMethod}"`,
      `"${t.date}"`,
      t.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Laporan_Keuangan_ITN_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Laporan Keuangan berhasil diexport ke format CSV/Excel.');
  };

  return (
    <PortalLayout
      role="finance"
      userName="Sri Wahyuni, S.E., M.Ak."
      userIdText="Biro Keuangan & Administrasi Anggaran"
    >
      {/* Notification Toast */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 flex items-center gap-3 bg-emerald-700 text-white px-5 py-3.5 rounded-xl shadow-xl border border-emerald-500 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4 text-emerald-200" />
          </button>
        </div>
      )}

      <div className="space-y-6">
        {/* Banner Header Kampus */}
        <div className="rounded-2xl bg-gradient-to-r from-[#1E3A8A] via-[#1E40AF] to-indigo-900 text-white p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-96 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-400/20 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold backdrop-blur-xs mb-3 border border-white/15">
                <Landmark className="w-3.5 h-3.5" />
                <span>Portal Resmi Biro Keuangan Institut Teknologi Nusantara</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Dashboard Keuangan & Perbendaharaan Kampus
              </h1>
              <p className="mt-1.5 text-blue-100 text-sm max-w-2xl leading-relaxed">
                Pengelolaan penerimaan SPP/UKT mahasiswa, verifikasi pembayaran perbankan host-to-host, realisasi anggaran operasional, dan monitoring saldo kas institusi.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setIsNewInvoiceModalOpen(true)}
                className="flex items-center gap-2 bg-[#D4A017] hover:bg-[#b8890f] text-slate-900 font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow active:scale-98 text-xs sm:text-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Terbitkan Tagihan Baru</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2.5 rounded-xl transition-all border border-white/20 text-xs sm:text-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Laporan</span>
              </button>
            </div>
          </div>
        </div>

        {/* 4 Kartu Metrik Keuangan Kampus */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Penerimaan SPP / UKT */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Penerimaan SPP / UKT
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <h2 className="text-2xl font-bold text-slate-900">
                  Rp 14,85 M
                </h2>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>82,5% dari target semester</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>Target Semester Gasal</span>
                <span className="font-semibold text-slate-700">Rp 18,00 M</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-[#1E3A8A] h-2 rounded-full" style={{ width: '82.5%' }}></div>
              </div>
            </div>
          </div>

          {/* Card 2: Tunggakan Mahasiswa */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Tunggakan Mahasiswa
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <h2 className="text-2xl font-bold text-slate-900">
                  Rp 3,15 M
                </h2>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>512 Mahasiswa belum lunas</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Batas Akhir Pelunasan:</span>
              <span className="font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">20 Sep 2026</span>
            </div>
          </div>

          {/* Card 3: Realisasi Anggaran Pengeluaran */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Realisasi Pengeluaran Kampus
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <h2 className="text-2xl font-bold text-slate-900">
                  Rp 9,42 M
                </h2>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <span>62,8% dari total pagu tahunan</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                <span>Pagu Anggaran 2026</span>
                <span className="font-semibold text-slate-700">Rp 15,00 M</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: '62.8%' }}></div>
              </div>
            </div>
          </div>

          {/* Card 4: Saldo Kas & Rekening Bank */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Total Saldo Kas & Bank
                </span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3">
                <h2 className="text-2xl font-bold text-[#1E3A8A]">
                  Rp 28,64 M
                </h2>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-blue-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>4 Rekening Bank Resmi ITN</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>Status Integrasi:</span>
              <span className="font-semibold text-emerald-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Host to Host Aktif
              </span>
            </div>
          </div>
        </div>

        {/* Section Tengah: Rekening Bank & Alokasi Anggaran */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card: Rekening Bank Resmi Kampus */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Landmark className="w-4 h-4 text-[#1E3A8A]" />
                <h3 className="font-bold text-slate-800 text-sm">Rekening Bank Resmi ITN</h3>
              </div>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                Mitra H2H
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {bankAccounts.map((b, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all bg-slate-50/50"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{b.bank}</p>
                      <p className="text-[11px] font-mono text-slate-600 mt-0.5">{b.accountNumber}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{b.accountName}</p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                      Aktif
                    </span>
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                    <span className="text-slate-500 text-[11px]">Saldo Kas:</span>
                    <span className="font-bold text-slate-800">{formatRupiah(b.balance)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Alokasi & Realisasi Anggaran Kampus */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-slate-800 text-sm">Alokasi & Realisasi Anggaran Kampus TA 2026</h3>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">
                Pagu Total: <strong className="text-slate-800">Rp 15,00 M</strong>
              </span>
            </div>

            <div className="mt-4 space-y-4">
              {budgetAllocation.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">{item.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 font-medium">
                        {formatRupiah(item.spent)} / {formatRupiah(item.allocated)}
                      </span>
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        item.percentage > 80
                          ? 'bg-amber-500'
                          : item.percentage > 60
                            ? 'bg-[#1E3A8A]'
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-[#1E3A8A] shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 leading-relaxed">
                <strong className="text-[#1E3A8A] font-semibold">Kepatuhan Anggaran:</strong> Penyerapan dana semester berjalan terpantau sehat dalam koridor Rencana Anggaran Pendapatan dan Belanja (RAPB) tahun 2026 yang disetujui Senat dan Yayasan.
              </div>
            </div>
          </div>
        </div>

        {/* Section Utama: Daftar Transaksi & Tagihan Mahasiswa */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          {/* Header & Filter Bar */}
          <div className="p-5 border-b border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Daftar Transaksi & Tagihan Mahasiswa</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rekapitulasi pembayaran UKT/SPP, biaya praktikum, registrasi, dan wisuda mahasiswa
                </p>
              </div>

              {/* Status Tabs */}
              <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold text-slate-600 self-start sm:self-auto">
                {(['ALL', 'LUNAS', 'MENUNGGU VERIFIKASI', 'TERTUNDA'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      statusFilter === status
                        ? 'bg-white text-[#1E3A8A] shadow-2xs font-bold'
                        : 'hover:text-slate-900'
                    }`}
                  >
                    {status === 'ALL'
                      ? 'Semua Status'
                      : status === 'MENUNGGU VERIFIKASI'
                        ? 'Menunggu Verifikasi'
                        : status === 'TERTUNDA'
                          ? 'Tertunda'
                          : 'Lunas'}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Input & Dropdowns */}
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan NIM, Nama Mahasiswa, atau Nomor Invoice..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition-all"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-hidden focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] cursor-pointer"
                >
                  <option value="ALL">Semua Jenis Tagihan</option>
                  <option value="SPP">SPP / UKT</option>
                  <option value="Praktikum">Praktikum & Lab</option>
                  <option value="Wisuda">Wisuda & Yudisium</option>
                  <option value="Registrasi">Registrasi Mahasiswa Baru</option>
                </select>

                <button
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                    setTypeFilter('ALL');
                  }}
                  className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                  title="Reset Filter"
                >
                  Reset Filter
                </button>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3.5">Invoice & Tanggal</th>
                  <th className="px-4 py-3.5">Mahasiswa</th>
                  <th className="px-4 py-3.5">Program Studi</th>
                  <th className="px-4 py-3.5">Jenis Tagihan</th>
                  <th className="px-4 py-3.5">Nominal</th>
                  <th className="px-4 py-3.5">Metode Bayar</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                      <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                      Tidak ada data transaksi yang sesuai dengan filter pencarian.
                    </td>
                  </tr>
                ) : (
                  filteredTransactions.map((trx) => (
                    <tr key={trx.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="font-mono font-bold text-slate-900 block">{trx.invoiceNo}</span>
                        <span className="text-[11px] text-slate-400">{trx.date}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900 block">{trx.studentName}</span>
                        <span className="text-[11px] text-slate-500 font-mono">NIM: {trx.nim}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-slate-800 font-medium block">{trx.studyProgram}</span>
                        <span className="text-[11px] text-slate-400">Semester {trx.semester}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-900">{trx.type}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-bold text-slate-900">{formatRupiah(trx.amount)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-slate-700 font-medium">{trx.paymentMethod}</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {trx.status === 'LUNAS' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Lunas
                          </span>
                        )}
                        {trx.status === 'MENUNGGU VERIFIKASI' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Verifikasi Kasir
                          </span>
                        )}
                        {trx.status === 'TERTUNDA' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            Tertunda
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {trx.status === 'MENUNGGU VERIFIKASI' && (
                            <button
                              onClick={() => {
                                setTrxToVerify(trx);
                                setIsVerifyModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                              title="Verifikasi Bukti Bayar"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Verifikasi</span>
                            </button>
                          )}

                          {trx.status === 'LUNAS' && (
                            <button
                              onClick={() => setSelectedReceipt(trx)}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#1E3A8A] font-semibold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                              title="Lihat & Cetak Kwitansi"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Kwitansi</span>
                            </button>
                          )}

                          {trx.status === 'TERTUNDA' && (
                            <button
                              onClick={() => setSelectedReceipt(trx)}
                              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                              title="Lihat Rincian Tagihan"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Rincian</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Bar */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
            <span>
              Menampilkan <strong>{filteredTransactions.length}</strong> transaksi keuangan mahasiswa
            </span>
            <div className="flex items-center gap-3">
              <span className="text-[11px]">
                Sinkronisasi Host-to-Host Terakhir: <strong>09 Sep 2026, 23:10 WIB</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: Cetak Kwitansi Resmi */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Kwitansi Header */}
            <div className="bg-[#1E3A8A] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-amber-300 border border-white/20">
                  ITN
                </div>
                <div>
                  <h4 className="font-bold text-sm leading-tight">BUKTI PEMBAYARAN KEUANGAN</h4>
                  <p className="text-xs text-blue-200">Institut Teknologi Nusantara &bull; Biro Keuangan</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Kwitansi Body */}
            <div className="p-6 space-y-4 text-xs text-slate-700">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">No. Invoice</span>
                  <span className="font-mono font-bold text-slate-900 text-sm">{selectedReceipt.invoiceNo}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 block text-[10px] uppercase">Tanggal Terbit</span>
                  <span className="font-semibold text-slate-800">{selectedReceipt.date}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 py-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Mahasiswa</span>
                  <strong className="text-slate-900 text-xs block">{selectedReceipt.studentName}</strong>
                  <span className="text-slate-500 font-mono text-[11px]">NIM: {selectedReceipt.nim}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase block">Program Studi</span>
                  <strong className="text-slate-900 text-xs block">{selectedReceipt.studyProgram}</strong>
                  <span className="text-slate-500 text-[11px]">Semester {selectedReceipt.semester} Gasal</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-100/70 px-3.5 py-2 font-semibold text-slate-700 text-[11px]">
                  Rincian Pembayaran
                </div>
                <div className="p-3.5 space-y-2">
                  <div className="flex justify-between">
                    <span>{selectedReceipt.type}</span>
                    <span className="font-semibold text-slate-800">{formatRupiah(selectedReceipt.amount)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>Biaya Administrasi Bank</span>
                    <span className="text-emerald-600 font-semibold">Gratis (Subsidi ITN)</span>
                  </div>
                  <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-900 text-sm">
                    <span>Total Pembayaran</span>
                    <span className="text-[#1E3A8A]">{formatRupiah(selectedReceipt.amount)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase block">Metode Pembayaran</span>
                  <span className="font-semibold text-slate-800">{selectedReceipt.paymentMethod}</span>
                </div>
                <div>
                  {selectedReceipt.status === 'LUNAS' ? (
                    <div className="border-2 border-emerald-600 text-emerald-600 font-black px-3 py-1 rounded-md transform -rotate-3 text-xs tracking-wider uppercase">
                      LUNAS / VERIFIED
                    </div>
                  ) : (
                    <div className="border border-amber-500 text-amber-700 font-bold px-3 py-1 rounded-md text-xs uppercase">
                      {selectedReceipt.status}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Kwitansi Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Tutup
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Kwitansi</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Verifikasi Pembayaran Teller/Transfer */}
      {isVerifyModalOpen && trxToVerify && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Verifikasi Pembayaran Kasir</h4>
                  <p className="text-[11px] text-slate-500">Persetujuan setoran manual mahasiswa</p>
                </div>
              </div>
              <button onClick={() => setIsVerifyModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs text-slate-700">
              <p>
                Anda akan melakukan verifikasi dan pengesahan pelunasan untuk transaksi berikut:
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 font-mono text-[11px]">
                <div>
                  <span className="text-slate-400">Invoice:</span>{' '}
                  <strong className="text-slate-800">{trxToVerify.invoiceNo}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Mahasiswa:</span>{' '}
                  <strong className="text-slate-800">{trxToVerify.studentName} ({trxToVerify.nim})</strong>
                </div>
                <div>
                  <span className="text-slate-400">Tagihan:</span>{' '}
                  <strong className="text-slate-800">{trxToVerify.type}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Nominal:</span>{' '}
                  <strong className="text-emerald-700 font-bold">{formatRupiah(trxToVerify.amount)}</strong>
                </div>
                <div>
                  <span className="text-slate-400">Metode:</span>{' '}
                  <span className="text-slate-700">{trxToVerify.paymentMethod}</span>
                </div>
              </div>

              <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-slate-700 text-[11px] leading-relaxed">
                Setelah disetujui, hak akses KRS dan registrasi semester mahasiswa akan <strong>langsung aktif</strong> secara otomatis di sistem akademik.
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsVerifyModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleVerify(trxToVerify)}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Sahkan & Lunas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Terbitkan Tagihan Baru */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#1E3A8A] text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Plus className="w-5 h-5 text-amber-400" />
                <h4 className="font-bold text-sm">Terbitkan Tagihan Baru Mahasiswa</h4>
              </div>
              <button onClick={() => setIsNewInvoiceModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">NIM Mahasiswa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: 2211099"
                    value={newInvoice.nim}
                    onChange={(e) => setNewInvoice({ ...newInvoice, nim: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nama Mahasiswa *</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Maulana Ibrahim"
                    value={newInvoice.studentName}
                    onChange={(e) => setNewInvoice({ ...newInvoice, studentName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Program Studi</label>
                  <select
                    value={newInvoice.studyProgram}
                    onChange={(e) => setNewInvoice({ ...newInvoice, studyProgram: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] outline-hidden"
                  >
                    <option value="Teknik Informatika">Teknik Informatika</option>
                    <option value="Sistem Informasi">Sistem Informasi</option>
                    <option value="Teknik Elektro">Teknik Elektro</option>
                    <option value="Teknik Mesin">Teknik Mesin</option>
                    <option value="Teknik Sipil">Teknik Sipil</option>
                    <option value="Teknik Industri">Teknik Industri</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Semester</label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={newInvoice.semester}
                    onChange={(e) => setNewInvoice({ ...newInvoice, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Jenis Tagihan</label>
                  <select
                    value={newInvoice.type}
                    onChange={(e) => setNewInvoice({ ...newInvoice, type: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] outline-hidden"
                  >
                    <option value="SPP / UKT Gasal">SPP / UKT Gasal</option>
                    <option value="Biaya Praktikum & Laboratorium">Biaya Praktikum & Laboratorium</option>
                    <option value="Biaya Wisuda & Yudisium">Biaya Wisuda & Yudisium</option>
                    <option value="Registrasi Mahasiswa Baru (PMB)">Registrasi Mahasiswa Baru (PMB)</option>
                    <option value="Perpanjangan Skripsi / TA">Perpanjangan Skripsi / TA</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Nominal (Rp) *</label>
                  <input
                    type="number"
                    step={50000}
                    required
                    value={newInvoice.amount}
                    onChange={(e) => setNewInvoice({ ...newInvoice, amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Catatan / Keterangan</label>
                <textarea
                  rows={2}
                  value={newInvoice.notes}
                  onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] outline-hidden"
                  placeholder="Catatan tambahan untuk mahasiswa..."
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[11px]">
                Nomor Invoice dan nomor Virtual Account (BNI / BRIVA / Mandiri Bill) akan dibuat secara otomatis dan diteruskan ke akun mahasiswa.
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-slate-900 bg-[#D4A017] hover:bg-[#b8890f] rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Terbitkan Tagihan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PortalLayout>
  );
}
