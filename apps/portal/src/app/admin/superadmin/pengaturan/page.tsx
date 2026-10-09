'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  Calendar, Database, RefreshCw, Save, Globe, Mail, ArrowRight, AlertTriangle, Sliders, Info,
} from 'lucide-react';

type ToggleSetting = { label: string; desc: string; value: boolean; key: string };

export default function PengaturanSistemPage() {
  // Toggle & SMTP di bawah ini SENGAJA tidak tersambung ke sistem apa pun — belum ada
  // feature-flag, mode maintenance, atau penyimpanan kredensial SMTP di backend.
  // Jangan dijadikan tempat mengubah pengaturan sungguhan sampai infrastrukturnya dibangun.
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');

  const toggles: ToggleSetting[] = [
    { label: 'Mode Maintenance', desc: 'Nonaktifkan akses portal untuk seluruh pengguna sementara', value: maintenanceMode, key: 'maintenance' },
    { label: 'Mode Debug', desc: 'Aktifkan logging detail untuk troubleshooting sistem', value: debugMode, key: 'debug' },
    { label: 'Notifikasi Email', desc: 'Kirim notifikasi transaksi & akademik via email kampus', value: emailNotif, key: 'email' },
    { label: 'Push Notification', desc: 'Kirim push notifikasi ke aplikasi mobile mahasiswa & dosen', value: pushNotif, key: 'push' },
  ];

  const setters: Record<string, (v: boolean) => void> = {
    maintenance: setMaintenanceMode,
    debug: setDebugMode,
    email: setEmailNotif,
    push: setPushNotif,
  };

  return (
    <PortalLayout role="superadmin" userName="Super Administrator" userIdText="Sistem Informasi Akademik Terpadu">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">Konfigurasi Sistem</span>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">Pengaturan Sistem</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">Ringkasan pengaturan SIAKAD Premium dan tautan ke halaman pengelolaannya</p>
        </div>

        {/* Tautan ke pengaturan yang sudah nyata & tersambung database */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/admin/superadmin/kalender"
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center justify-between hover:border-[#1E3A8A] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center"><Calendar className="w-5 h-5 text-white" /></div>
              <div>
                <h3 className="font-bold text-slate-800">Kalender & Tahun Akademik</h3>
                <p className="text-xs text-slate-500">Semester aktif, periode KRS & UAS — dikelola di sini</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1E3A8A] group-hover:translate-x-0.5 transition-all" />
          </Link>

          <Link
            href="/admin/superadmin/pengaturan-dikti"
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center justify-between hover:border-[#1E3A8A] transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center"><Globe className="w-5 h-5 text-white" /></div>
              <div>
                <h3 className="font-bold text-slate-800">Integrasi PDDIKTI</h3>
                <p className="text-xs text-slate-500">Konfigurasi & uji koneksi Neo Feeder — dikelola di sini</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#1E3A8A] group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>

        {/* Peringatan jujur untuk bagian di bawah */}
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <p className="font-bold">Bagian di bawah ini belum tersambung ke sistem sebenarnya.</p>
            <p className="mt-0.5">Belum ada penyimpanan konfigurasi SMTP, mode maintenance/debug sungguhan, backup database otomatis, atau sinkronisasi PDDIKTI manual di sistem ini. Perubahan di bawah tidak akan tersimpan atau berefek apa pun sampai fiturnya dibangun.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Integrasi SMTP (belum tersambung) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden opacity-90">
            <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-slate-50">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center"><Mail className="w-5 h-5 text-white" /></div>
              <div className="flex-1">
                <h2 className="font-bold text-slate-800">Konfigurasi Email (SMTP)</h2>
                <p className="text-xs text-slate-500">Belum tersedia</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">SMTP Host</label>
                  <input value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} placeholder="mis. smtp.itn.ac.id" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Port</label>
                  <input value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Pengirim (From)</label>
                <input value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="mis. noreply@itn.ac.id" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all" />
              </div>
              <button disabled title="Belum tersedia — belum ada penyimpanan konfigurasi SMTP di backend" className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-200 text-slate-500 text-sm font-semibold rounded-xl cursor-not-allowed">
                <Save className="w-4 h-4" />Belum Tersedia
              </button>
            </div>
          </div>

          {/* Toggle fitur (belum tersambung) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden opacity-90">
            <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-slate-50">
              <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center"><Sliders className="w-5 h-5 text-white" /></div>
              <div className="flex-1">
                <h2 className="font-bold text-slate-800">Pengaturan Fitur Sistem</h2>
                <p className="text-xs text-slate-500">Belum tersambung — tampilan pratinjau saja</p>
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {toggles.map((t) => (
                <div key={t.key} className="flex items-center justify-between p-5">
                  <div className="flex-1 mr-4">
                    <p className="text-sm font-semibold text-slate-800">{t.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                  </div>
                  <button
                    onClick={() => setters[t.key]?.(!t.value)}
                    title="Belum tersambung ke sistem sebenarnya"
                    className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${t.value ? 'bg-slate-400' : 'bg-slate-200'}`}
                  >
                    <span className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform mt-1 ${t.value ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Backup Database (belum tersedia) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 opacity-90">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center"><Database className="w-5 h-5 text-white" /></div>
            <div>
              <h3 className="font-bold text-slate-800">Backup Database</h3>
              <p className="text-xs text-slate-500">Belum tersedia — belum ada mekanisme backup manual dari portal ini</p>
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>Backup database dikelola langsung di level infrastruktur (mis. cron pg_dump di server), bukan dari halaman ini. Hubungi tim infrastruktur untuk jadwal & lokasi backup yang sebenarnya.</span>
          </div>
          <button disabled className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-200 text-slate-500 text-sm font-semibold rounded-xl cursor-not-allowed">
            <RefreshCw className="w-4 h-4" />Belum Tersedia
          </button>
        </div>
      </div>
    </PortalLayout>
  );
}
