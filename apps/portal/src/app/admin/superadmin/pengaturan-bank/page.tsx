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
} from 'lucide-react';

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
  }, []);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const body: any = {
        provider: setting.provider,
        environment: setting.environment,
        isActive: setting.isActive,
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
      showToast('success', 'Konfigurasi payment gateway bank berhasil disimpan ke database.');
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
                Konfigurasi kredensial API payment gateway untuk pemrosesan pembayaran (UKT, PMB, biaya lainnya).
              </p>
            </div>
            <div
              className={`flex items-center gap-2 border rounded-xl px-4 py-2 ${
                setting.isActive
                  ? 'bg-emerald-400/15 border-emerald-400/40'
                  : 'bg-amber-400/15 border-amber-400/40'
              }`}
            >
              {setting.isActive ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-amber-300 shrink-0" />
              )}
              <span className={`text-xs font-semibold ${setting.isActive ? 'text-emerald-200' : 'text-amber-200'}`}>
                {setting.isActive ? 'Integrasi Aktif' : 'Integrasi Nonaktif'}
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
                      <option value="MANUAL">Transfer Manual (Tanpa API)</option>
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

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#1E3A8A] text-white text-sm font-bold rounded-xl hover:bg-[#1e40af] transition-colors disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Bank'}
              </button>
            </div>
          </>
        )}

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
