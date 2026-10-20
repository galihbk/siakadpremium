'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import {
  Landmark,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
  KeyRound,
  Globe,
  Info,
  FileCheck2,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { Modal } from '@/components/ui/Modal';
import { confirmDialog } from '@/components/ui/ConfirmHost';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface PayAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  description?: string | null;
  isActive: boolean;
}
const EMPTY_ACCOUNT = { bankName: '', accountNumber: '', accountName: '', description: '' };

interface BankSetting {
  provider: string;
  environment: string;
  isActive: boolean;
  merchantId: string;
  apiKey: string | null;
  apiSecret: string | null;
  hasApiKey: boolean;
  hasApiSecret: boolean;
}

/** Integrasi payment gateway otomatis belum dibangun; sementara semua pembayaran dikonfirmasi manual. */
const API_READY = false;

const EMPTY_SETTING: BankSetting = {
  provider: 'MANUAL',
  environment: 'SANDBOX',
  isActive: false,
  merchantId: '',
  apiKey: null,
  apiSecret: null,
  hasApiKey: false,
  hasApiSecret: false,
};

export default function PengaturanBankPage() {
  const [setting, setSetting] = useState<BankSetting>(EMPTY_SETTING);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [apiSecretInput, setApiSecretInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const apiBase = getApiBaseUrl();

  // Rekening tujuan transfer (mode konfirmasi manual); dipakai bersama menu Rekening Bank & Kas
  const [accounts, setAccounts] = useState<PayAccount[]>([]);
  const [accountModal, setAccountModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [accountForm, setAccountForm] = useState(EMPTY_ACCOUNT);
  const [accountSaving, setAccountSaving] = useState(false);

  const loadAccounts = async () => {
    try {
      const res = await fetch(`${apiBase}/finance/bank-accounts`, { cache: 'no-store', headers: authHeaders() });
      if (res.ok) {
        const json = await res.json();
        const list = json?.data ?? json;
        if (Array.isArray(list)) setAccounts(list);
      }
    } catch {
      // biarkan kosong
    }
  };

  const openAccountModal = (acc?: PayAccount) => {
    setAccountForm(
      acc
        ? { bankName: acc.bankName, accountNumber: acc.accountNumber, accountName: acc.accountName, description: acc.description || '' }
        : EMPTY_ACCOUNT,
    );
    setAccountModal({ open: true, id: acc?.id ?? null });
  };

  const saveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountForm.bankName.trim() || !accountForm.accountNumber.trim() || !accountForm.accountName.trim()) {
      showToast('error', 'Nama bank, nomor rekening, dan atas nama wajib diisi.');
      return;
    }
    setAccountSaving(true);
    try {
      const res = await fetch(`${apiBase}/finance/bank-accounts${accountModal.id ? `/${accountModal.id}` : ''}`, {
        method: accountModal.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(accountForm),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(Array.isArray(json?.message) ? json.message.join(', ') : json?.message || 'Gagal menyimpan rekening.');
      setAccountModal({ open: false, id: null });
      showToast('success', accountModal.id ? 'Rekening berhasil diperbarui.' : 'Rekening berhasil ditambahkan.');
      await loadAccounts();
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Gagal menyimpan rekening.');
    } finally {
      setAccountSaving(false);
    }
  };

  const toggleAccount = async (acc: PayAccount) => {
    try {
      const res = await fetch(`${apiBase}/finance/bank-accounts/${acc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ bankName: acc.bankName, accountNumber: acc.accountNumber, accountName: acc.accountName, description: acc.description, isActive: !acc.isActive }),
      });
      if (!res.ok) throw new Error();
      await loadAccounts();
    } catch {
      showToast('error', 'Gagal mengubah status rekening.');
    }
  };

  const removeAccount = async (acc: PayAccount) => {
    if (!(await confirmDialog(`Hapus rekening ${acc.bankName} ${acc.accountNumber} a.n. ${acc.accountName}?`))) return;
    try {
      const res = await fetch(`${apiBase}/finance/bank-accounts/${acc.id}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error();
      showToast('success', 'Rekening dihapus.');
      await loadAccounts();
    } catch {
      showToast('error', 'Gagal menghapus rekening.');
    }
  };
  const authHeaders = (): Record<string, string> => {
    const { token } = getAuthSession();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadSetting = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/integration-settings/bank`, { cache: 'no-store', headers: authHeaders() });
      if (res.ok) {
        const json = await res.json();
        setSetting({ ...EMPTY_SETTING, ...(json?.data || json) });
      }
    } catch {
      // biarkan default state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSetting();
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  /** Memilih Konfirmasi Manual langsung disimpan (tidak ada kredensial yang perlu diisi). */
  const persistManualMode = async () => {
    try {
      const res = await fetch(`${apiBase}/integration-settings/bank`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ provider: 'MANUAL', isActive: false }),
      });
      if (!res.ok) throw new Error();
      showToast('success', 'Metode konfirmasi manual disimpan.');
    } catch {
      showToast('error', 'Gagal menyimpan metode pembayaran.');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const isManualMode = setting.provider === 'MANUAL';
      const body: any = {
        provider: setting.provider,
        environment: setting.environment,
        // Konfirmasi manual tidak memakai gateway: integrasi otomatis selalu nonaktif.
        isActive: isManualMode ? false : setting.isActive,
        merchantId: setting.merchantId,
      };
      if (apiKeyInput.trim()) body.apiKey = apiKeyInput.trim();
      if (apiSecretInput.trim()) body.apiSecret = apiSecretInput.trim();

      const res = await fetch(`${apiBase}/integration-settings/bank`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Gagal menyimpan');

      const json = await res.json();
      setSetting({ ...EMPTY_SETTING, ...(json?.data || json) });
      setApiKeyInput('');
      setApiSecretInput('');
      showToast('success', 'Pengaturan pembayaran berhasil disimpan.');
    } catch {
      showToast('error', 'Gagal menyimpan konfigurasi. Periksa koneksi ke server API.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <PortalLayout role="superadmin" userName="Super Administrator" userIdText="Sistem Informasi Akademik Terpadu">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
                Integrasi Pembayaran
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
                <Landmark className="w-6 h-6 text-[#D4A017]" />
                Pengaturan Bank & Payment Gateway
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-1">
                Atur cara pembayaran dikonfirmasi: manual oleh Biro Keuangan, atau otomatis lewat API / payment gateway.
              </p>
            </div>
            <div className="flex items-center gap-2 border rounded-xl px-4 py-2 bg-emerald-400/15 border-emerald-400/40">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="text-xs font-semibold text-emerald-200">
                {setting.provider === 'MANUAL' ? 'Konfirmasi Manual' : setting.isActive ? 'Integrasi API Aktif' : 'Integrasi API Nonaktif'}
              </span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat konfigurasi...
          </div>
        ) : (
          <>
            {/* Metode konfirmasi pembayaran */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50">
                <h2 className="font-bold text-slate-800">Metode Konfirmasi Pembayaran</h2>
                <p className="text-xs text-slate-500 mt-0.5">Berlaku untuk pembayaran mahasiswa dan calon mahasiswa baru (PMB).</p>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => { setSetting((st) => ({ ...st, provider: 'MANUAL', isActive: false })); void persistManualMode(); }}
                  className={`text-left rounded-xl border-2 p-4 transition-colors cursor-pointer ${
                    setting.provider === 'MANUAL' ? 'border-[#1E3A8A] bg-blue-50/60' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-[#1E3A8A] flex items-center justify-center">
                      <FileCheck2 className="w-5 h-5 text-white" />
                    </span>
                    <span className="font-bold text-slate-900">Konfirmasi Manual</span>
                    {setting.provider === 'MANUAL' && <CheckCircle2 className="w-4 h-4 text-[#1E3A8A] ml-auto" />}
                  </div>
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                    Mahasiswa atau calon mahasiswa transfer ke rekening kampus lalu <strong>mengunggah bukti transfer</strong>.
                    Admin Keuangan memeriksa dan memverifikasinya di menu <em>Verifikasi Pembayaran</em>.
                  </p>
                </button>

                <button
                  type="button"
                  disabled={!API_READY}
                  onClick={() => API_READY && setSetting((st) => ({ ...st, provider: st.provider === 'MANUAL' ? 'MIDTRANS' : st.provider }))}
                  className={`text-left rounded-xl border-2 p-4 transition-colors ${
                    setting.provider !== 'MANUAL' ? 'border-[#1E3A8A] bg-blue-50/60' : 'border-slate-200'
                  } ${API_READY ? 'cursor-pointer hover:border-slate-300' : 'opacity-60 cursor-not-allowed'}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-white" />
                    </span>
                    <span className="font-bold text-slate-900">Otomatis via API / Payment Gateway</span>
                    {!API_READY && (
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        Segera hadir
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-2.5 leading-relaxed">
                    Pembayaran terkonfirmasi otomatis lewat bank atau payment gateway (Virtual Account, QRIS, dan sebagainya).
                    Anda memilih penyedia dan mengisi kredensial sesuai yang diminta masing-masing penyedia.
                  </p>
                </button>
              </div>

              {setting.provider === 'MANUAL' && (
                <div className="px-5 pb-5 space-y-3">
                  <div className="flex items-center justify-between gap-3 pt-1 border-t border-slate-100">
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm mt-3">Rekening Tujuan Pembayaran</h3>
                      <p className="text-xs text-slate-500">
                        Rekening yang ditampilkan kepada mahasiswa dan calon mahasiswa untuk transfer. Boleh lebih dari satu.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAccountModal()}
                      className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] rounded-lg cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#D4A017]" /> Tambah Rekening
                    </button>
                  </div>

                  {accounts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                      Belum ada rekening. Tambahkan minimal satu rekening agar mahasiswa tahu ke mana harus transfer.
                    </div>
                  ) : (
                    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 overflow-hidden">
                      {accounts.map((acc) => (
                        <li key={acc.id} className={`flex items-center gap-3 px-4 py-3 ${acc.isActive ? 'bg-white' : 'bg-slate-50 opacity-70'}`}>
                          <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                            <Landmark className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-900 truncate">
                              {acc.bankName} <span className="font-mono">{acc.accountNumber}</span>
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              a.n. {acc.accountName}
                              {acc.description ? ` \u2022 ${acc.description}` : ''}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleAccount(acc)}
                            title={acc.isActive ? 'Tampil ke mahasiswa (klik untuk sembunyikan)' : 'Disembunyikan (klik untuk tampilkan)'}
                            className={`relative inline-flex w-10 h-5.5 rounded-full transition-colors shrink-0 cursor-pointer ${acc.isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                          >
                            <span className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform mt-[3px] ${acc.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                          </button>
                          <button type="button" onClick={() => openAccountModal(acc)} className="p-2 text-slate-500 hover:text-[#1E3A8A] hover:bg-blue-50 rounded-lg cursor-pointer" title="Ubah">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button type="button" onClick={() => removeAccount(acc)} className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer" title="Hapus">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="text-[11px] text-slate-500">
                    Bukti transfer yang masuk diperiksa Admin Keuangan di menu Verifikasi Pembayaran. Daftar ini sama dengan menu{' '}
                    <Link href="/finance/rekening" className="font-bold underline">Rekening Bank &amp; Kas</Link>.
                  </p>
                </div>
              )}
            </div>

            {setting.provider !== 'MANUAL' && (
            <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Provider & Mode */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-slate-50">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">Provider Payment Gateway</h2>
                    <p className="text-xs text-slate-500">Pilih penyedia layanan pembayaran yang digunakan</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Provider</label>
                    <select
                      value={setting.provider}
                      onChange={(e) => setSetting((s) => ({ ...s, provider: e.target.value }))}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    >
                      <option value="MIDTRANS">Midtrans</option>
                      <option value="XENDIT">Xendit</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Environment</label>
                    <select
                      value={setting.environment}
                      onChange={(e) => setSetting((s) => ({ ...s, environment: e.target.value }))}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    >
                      <option value="SANDBOX">Sandbox (Uji Coba)</option>
                      <option value="PRODUCTION">Production (Live)</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Aktifkan Integrasi</p>
                      <p className="text-xs text-slate-500 mt-0.5">Gunakan payment gateway ini untuk transaksi pembayaran</p>
                    </div>
                    <button
                      onClick={() => setSetting((s) => ({ ...s, isActive: !s.isActive }))}
                      className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${setting.isActive ? 'bg-blue-600' : 'bg-slate-200'}`}
                    >
                      <span
                        className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform mt-1 ${setting.isActive ? 'translate-x-6' : 'translate-x-1'}`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Kredensial API */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-slate-50">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">Kredensial API</h2>
                    <p className="text-xs text-slate-500">Kunci akses dari dashboard provider payment gateway</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Merchant ID</label>
                    <input
                      value={setting.merchantId || ''}
                      onChange={(e) => setSetting((s) => ({ ...s, merchantId: e.target.value }))}
                      placeholder="Contoh: M012345678"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      API Key {setting.hasApiKey && <span className="text-emerald-600 font-normal">(tersimpan: {setting.apiKey})</span>}
                    </label>
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={(e) => setApiKeyInput(e.target.value)}
                      placeholder={setting.hasApiKey ? 'Kosongkan jika tidak ingin mengganti' : 'Masukkan API Key'}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      API Secret {setting.hasApiSecret && <span className="text-emerald-600 font-normal">(tersimpan: {setting.apiSecret})</span>}
                    </label>
                    <input
                      type="password"
                      value={apiSecretInput}
                      onChange={(e) => setApiSecretInput(e.target.value)}
                      placeholder={setting.hasApiSecret ? 'Kosongkan jika tidak ingin mengganti' : 'Masukkan API Secret'}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
              <span>
                API Key dan API Secret disimpan terenkripsi secara sebagian (masking) saat ditampilkan kembali. Isi ulang kolom hanya jika ingin mengganti kredensial yang tersimpan.
              </span>
            </div>

            </>
            )}

            <div className={`flex justify-end ${setting.provider === 'MANUAL' ? 'hidden' : ''}`}>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1E3A8A] text-white text-sm font-bold rounded-xl hover:bg-[#1e40af] transition-colors disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
            </div>
          </>
        )}

        <Modal
          isOpen={accountModal.open}
          onClose={() => setAccountModal({ open: false, id: null })}
          title={accountModal.id ? 'Ubah Rekening Tujuan' : 'Tambah Rekening Tujuan'}
        >
          <form onSubmit={saveAccount} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Nama Bank *</label>
              <input
                value={accountForm.bankName}
                onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })}
                placeholder="Contoh: Bank BNI, Bank Mandiri, BSI"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] outline-hidden"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nomor Rekening *</label>
                <input
                  value={accountForm.accountNumber}
                  inputMode="numeric"
                  onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] outline-hidden"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Atas Nama *</label>
                <input
                  value={accountForm.accountName}
                  onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] outline-hidden"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Keterangan (opsional)</label>
              <input
                value={accountForm.description}
                onChange={(e) => setAccountForm({ ...accountForm, description: e.target.value })}
                placeholder="Contoh: Rekening SPP/UKT, Rekening PMB"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] outline-hidden"
              />
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
              <button type="button" onClick={() => setAccountModal({ open: false, id: null })} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
                Batal
              </button>
              <button type="submit" disabled={accountSaving} className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] rounded-xl disabled:opacity-60 cursor-pointer">
                {accountSaving ? 'Menyimpan...' : 'Simpan Rekening'}
              </button>
            </div>
          </form>
        </Modal>

        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
            {toast.message}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
