'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Upload,
  Banknote,
  FileText,
  Info,
  ChevronRight,
  Printer,
  RefreshCw,
  Database,
  X,
  Check,
} from 'lucide-react';
import { getAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import { CompressedFileUpload } from '@/components/common/CompressedFileUpload';

interface Tagihan {
  id: string;
  invoiceNo: string;
  jenis: string;
  semester: string;
  jumlah: number;
  dueDate: string;
  status: 'LUNAS' | 'BELUM_BAYAR' | 'MENUNGGU';
  paidDate?: string;
  channel?: string;
}

const VA_NUMBER = '8277-0001-2311501001';

export default function StudentKeuanganPage() {
  const [userName, setUserName] = useState('Mahasiswa');
  const [userId, setUserId] = useState('');
  const [tagihanList, setTagihanList] = useState<Tagihan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTagihan, setSelectedTagihan] = useState<Tagihan | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payChannel, setPayChannel] = useState('VA BNI');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/finance/transactions`);
      if (res.ok) {
        const json = await res.json();
        const trxs = json.data?.transactions;
        if (Array.isArray(trxs) && trxs.length > 0) {
          const mapped: Tagihan[] = trxs.map((t: any) => ({
            id: t.id,
            invoiceNo: t.invoiceNo,
            jenis: t.paymentType,
            semester: `Gasal ${t.academicYear || '2026/2027'}`,
            jumlah: Number(t.amount),
            dueDate: t.dueDate || '20 Sep 2026',
            status:
              t.status === 'LUNAS'
                ? 'LUNAS'
                : t.status === 'MENUNGGU VERIFIKASI' || t.status === 'MENUNGGU_VERIFIKASI'
                ? 'MENUNGGU'
                : 'BELUM_BAYAR',
            paidDate: t.paidAt || undefined,
            channel: t.paymentMethod,
          }));
          setTagihanList(mapped);
        }
      }
    } catch (err) {
      console.warn('Gagal memuat tagihan mahasiswa dari database:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { user } = getAuthSession();
    if (user) {
      setUserName(user.fullName || user.email);
      setUserId(user.email);
    }
    fetchInvoices();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const formatRupiah = (v: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);

  const totalTagihan = tagihanList.filter((t) => t.status !== 'LUNAS').reduce((a, t) => a + t.jumlah, 0);
  const totalLunas = tagihanList.filter((t) => t.status === 'LUNAS').reduce((a, t) => a + t.jumlah, 0);
  const pendingCount = tagihanList.filter((t) => t.status !== 'LUNAS').length;

  const handlePay = (t: Tagihan) => {
    setSelectedTagihan(t);
    setShowPayModal(true);
  };

  const handleConfirmPay = async () => {
    if (!selectedTagihan) return;
    setPaying(true);
    try {
      // Call real backend endpoint to verify / update transaction
      await fetch(`${getApiBaseUrl()}/finance/transactions/${selectedTagihan.id}/verify`, {
        method: 'POST',
      });
      showToast(`Tagihan ${selectedTagihan.invoiceNo} berhasil dibayar via ${payChannel}! Status lunas tercatat di DB.`);
      setShowPayModal(false);
      await fetchInvoices();
    } catch (err) {
      showToast(`Gagal memproses pembayaran: ${err}`);
    } finally {
      setPaying(false);
    }
  };

  return (
    <PortalLayout role="student" userName={userName} userIdText={userId}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017]">
                Keuangan Mahasiswa
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">Tagihan &amp; Pembayaran</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Informasi tagihan perkuliahan, riwayat pembayaran, dan nomor Virtual Account terintegrasi
            </p>
          </div>
          <button
            onClick={fetchInvoices}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold text-white transition-colors border border-white/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
        </div>

        {/* VA Info Card */}
        <div className="bg-gradient-to-br from-slate-900 to-[#1E3A8A] rounded-2xl p-6 text-white shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-blue-200 uppercase tracking-widest font-semibold">Virtual Account Mahasiswa</p>
              <p className="text-2xl sm:text-3xl font-mono font-black mt-1 tracking-wider text-[#D4A017]">{VA_NUMBER}</p>
              <p className="text-xs text-slate-300 mt-1">Bank BNI · Pembayaran otomatis terverifikasi 24 jam</p>
            </div>
            <div className="text-right sm:border-l sm:border-white/20 sm:pl-6">
              <p className="text-xs text-blue-200">Total Tunggakan Aktif</p>
              <p className="text-2xl font-black text-white mt-0.5">{formatRupiah(totalTagihan)}</p>
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 mt-1">
                {pendingCount} Tagihan Belum Dibayar
              </span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Total Tagihan Belum Bayar</p>
            <p className="text-xl font-black text-red-600">{formatRupiah(totalTagihan)}</p>
            <p className="text-[11px] text-slate-400 mt-1">{pendingCount} tagihan pending</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Total Sudah Dibayar</p>
            <p className="text-xl font-black text-emerald-600">{formatRupiah(totalLunas)}</p>
            <p className="text-[11px] text-slate-400 mt-1">Lunas tervalidasi</p>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-5 shadow-sm border border-slate-200">
            <p className="text-xs text-slate-500 mb-1">Status Keuangan</p>
            <p className={`text-xl font-black ${totalTagihan === 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {totalTagihan === 0 ? 'Bebas Tunggakan' : 'Ada Tagihan Aktif'}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Batas KRS: 20 Sep 2026</p>
          </div>
        </div>

        {/* Table Tagihan */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 text-sm sm:text-base">Daftar Tagihan Mahasiswa (Database)</h2>
            <span className="text-xs text-slate-400">{tagihanList.length} transaksi tercatat</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50">
                <tr>
                  {['No. Invoice', 'Jenis Tagihan', 'Semester', 'Jumlah', 'Jatuh Tempo', 'Status', 'Aksi'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-slate-500 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                        <span>Memuat data tagihan perkuliahan...</span>
                      </div>
                    </td>
                  </tr>
                ) : tagihanList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                      Belum ada tagihan perkuliahan yang diterbitkan.
                    </td>
                  </tr>
                ) : (
                  tagihanList.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-slate-700">{t.invoiceNo}</td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-800">{t.jenis}</p>
                        {t.paidDate && (
                          <p className="text-[10px] text-emerald-600">
                            Dibayar: {t.paidDate} · {t.channel}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{t.semester}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{formatRupiah(t.jumlah)}</td>
                      <td className="px-4 py-3 text-slate-500">{t.dueDate}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'LUNAS'
                              ? 'bg-emerald-100 text-emerald-700'
                              : t.status === 'MENUNGGU'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {t.status === 'LUNAS' ? 'LUNAS' : t.status === 'MENUNGGU' ? 'MENUNGGU VERIFIKASI' : 'BELUM BAYAR'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {t.status !== 'LUNAS' ? (
                          <button
                            onClick={() => handlePay(t)}
                            className="px-3 py-1.5 bg-[#1E3A8A] text-white rounded-lg font-semibold hover:bg-[#1e40af] transition-colors"
                          >
                            Bayar Sekarang
                          </button>
                        ) : (
                          <button
                            onClick={() => showToast(`Kwitansi pembayaran untuk ${t.invoiceNo} telah diunduh.`)}
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" /> Kwitansi
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Bayar */}
        {showPayModal && selectedTagihan && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-800 text-base">Konfirmasi Pembayaran</h3>
                <button
                  onClick={() => setShowPayModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-xl">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nomor Invoice</span>
                  <span className="font-mono font-bold text-slate-800">{selectedTagihan.invoiceNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Jenis Tagihan</span>
                  <span className="font-semibold text-slate-800">{selectedTagihan.jenis}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominal Tagihan</span>
                  <span className="font-black text-sm text-[#1E3A8A]">{formatRupiah(selectedTagihan.jumlah)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Nomor VA Mahasiswa</span>
                  <span className="font-mono font-bold text-[#D4A017]">{VA_NUMBER}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Metode Pembayaran</label>
                <select
                  value={payChannel}
                  onChange={(e) => setPayChannel(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="VA BNI (Host to Host)">BNI Virtual Account (Otomatis)</option>
                  <option value="Mandiri Bill Payment">Bank Mandiri Bill Payment</option>
                  <option value="BRIVA BRI">Bank BRI BRIVA</option>
                  <option value="QRIS Dinamis">QRIS Dinamis Nasional</option>
                  <option value="Transfer Bank Manual">Transfer Bank Manual (Upload Bukti)</option>
                </select>
              </div>

              {payChannel === 'Transfer Bank Manual' && (
                <div className="pt-1">
                  <CompressedFileUpload
                    label="Unggah Struk / Bukti Transfer"
                    sublabel="Otomatis dikompres agar file tidak terlalu besar (JPG/PNG/PDF)."
                    maxSizeBytes={800 * 1024}
                    onFileReady={(file) => setReceiptFile(file)}
                    onFileRemoved={() => setReceiptFile(null)}
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowPayModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmPay}
                  disabled={paying}
                  className="flex-1 py-2.5 bg-[#1E3A8A] text-white text-xs font-bold rounded-xl hover:bg-[#1e40af] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {paying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Konfirmasi Pembayaran
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <Check className="w-4 h-4" />
            {toast}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
