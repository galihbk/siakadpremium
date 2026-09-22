'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import {
  ShieldCheck,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
  KeyRound,
  Globe,
  Info,
  Wifi,
} from 'lucide-react';

interface PddiktiSetting {
  baseUrl: string;
  username: string;
  password: string | null;
  secretKey: string | null;
  hasPassword: boolean;
  hasSecretKey: boolean;
  semesterId: string;
  isActive: boolean;
  isConnected: boolean;
  lastSyncAt: string | null;
}

const EMPTY_SETTING: PddiktiSetting = {
  baseUrl: '',
  username: '',
  password: null,
  secretKey: null,
  hasPassword: false,
  hasSecretKey: false,
  semesterId: '',
  isActive: false,
  isConnected: false,
  lastSyncAt: null,
};

export default function PengaturanDiktiPage() {
  const [setting, setSetting] = useState<PddiktiSetting>(EMPTY_SETTING);
  const [passwordInput, setPasswordInput] = useState('');
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const apiBase = getApiBaseUrl();

  const loadSetting = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/integration-settings/pddikti`, { cache: 'no-store' });
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
    setTimeout(() => setToast(null), 4500);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const body: any = {
        baseUrl: setting.baseUrl,
        username: setting.username,
        semesterId: setting.semesterId,
        isActive: setting.isActive,
      };
      if (passwordInput.trim()) body.password = passwordInput.trim();
      if (secretKeyInput.trim()) body.secretKey = secretKeyInput.trim();

      const res = await fetch(`${apiBase}/integration-settings/pddikti`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error('Gagal menyimpan');

      const json = await res.json();
      setSetting({ ...EMPTY_SETTING, ...(json?.data || json) });
      setPasswordInput('');
      setSecretKeyInput('');
      showToast('success', 'Konfigurasi koneksi PDDIKTI berhasil disimpan ke database.');
    } catch {
      showToast('error', 'Gagal menyimpan konfigurasi. Periksa koneksi ke server API.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await fetch(`${apiBase}/integration-settings/pddikti/test-connection`, { method: 'POST' });
      const json = await res.json();
      const result = json?.data || json;
      showToast(result.success ? 'success' : 'error', result.message);
    } catch {
      showToast('error', 'Gagal menguji koneksi. Periksa koneksi ke server API.');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <PortalLayout role="superadmin" userName="Super Administrator" userIdText="Sistem Informasi Akademik Terpadu">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
                Integrasi Pemerintah
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-[#D4A017]" />
                Pengaturan PDDIKTI (Web Service Neo Feeder)
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-1">
                Konfigurasi kredensial Web Service Neo Feeder Kemdikbudristek untuk sinkronisasi data akademik ke Pangkalan Data Dikti.
              </p>
            </div>
            <div
              className={`flex items-center gap-2 border rounded-xl px-4 py-2 ${
                setting.isConnected ? 'bg-emerald-400/15 border-emerald-400/40' : 'bg-amber-400/15 border-amber-400/40'
              }`}
            >
              {setting.isConnected ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              ) : (
                <XCircle className="w-4 h-4 text-amber-300 shrink-0" />
              )}
              <span className={`text-xs font-semibold ${setting.isConnected ? 'text-emerald-200' : 'text-amber-200'}`}>
                {setting.isConnected ? 'Terhubung' : 'Belum Terhubung'}
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
              {/* Endpoint */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-slate-50">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">Endpoint Web Service</h2>
                    <p className="text-xs text-slate-500">Alamat Web Service Neo Feeder institusi</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Base URL</label>
                    <input
                      value={setting.baseUrl || ''}
                      onChange={(e) => setSetting((s) => ({ ...s, baseUrl: e.target.value }))}
                      placeholder="https://feeder.kemdikbud.go.id/ws/live"
                      className="w-full text-sm font-mono border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Semester ID Aktif</label>
                    <input
                      value={setting.semesterId || ''}
                      onChange={(e) => setSetting((s) => ({ ...s, semesterId: e.target.value }))}
                      placeholder="Contoh: 20261"
                      className="w-full text-sm font-mono border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Aktifkan Sinkronisasi</p>
                      <p className="text-xs text-slate-500 mt-0.5">Gunakan koneksi ini untuk fitur Pull/Push data PDDIKTI</p>
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

              {/* Kredensial */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-slate-50">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                    <KeyRound className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-800">Kredensial Login</h2>
                    <p className="text-xs text-slate-500">Akun operator Web Service Neo Feeder</p>
                  </div>
                </div>
                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Username / Kode PT</label>
                    <input
                      value={setting.username || ''}
                      onChange={(e) => setSetting((s) => ({ ...s, username: e.target.value }))}
                      placeholder="Contoh: 071032"
                      className="w-full text-sm font-mono border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Password {setting.hasPassword && <span className="text-emerald-600 font-normal">(tersimpan: {setting.password})</span>}
                    </label>
                    <input
                      type="password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder={setting.hasPassword ? 'Kosongkan jika tidak ingin mengganti' : 'Masukkan password'}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Secret Key (opsional) {setting.hasSecretKey && <span className="text-emerald-600 font-normal">(tersimpan: {setting.secretKey})</span>}
                    </label>
                    <input
                      type="password"
                      value={secretKeyInput}
                      onChange={(e) => setSecretKeyInput(e.target.value)}
                      placeholder={setting.hasSecretKey ? 'Kosongkan jika tidak ingin mengganti' : 'Masukkan secret key jika ada'}
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-4 text-xs text-blue-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
              <span>
                Password dan Secret Key disimpan terenkripsi secara sebagian (masking) saat ditampilkan kembali. Isi ulang kolom hanya jika ingin mengganti kredensial yang tersimpan.
              </span>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-60"
              >
                {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wifi className="w-4 h-4" />}
                {isTesting ? 'Menguji Koneksi...' : 'Test Koneksi'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#1E3A8A] text-white text-sm font-bold rounded-xl hover:bg-[#1e40af] transition-colors disabled:opacity-60"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan DIKTI'}
              </button>
            </div>
          </>
        )}

        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 max-w-sm ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            {toast.message}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
