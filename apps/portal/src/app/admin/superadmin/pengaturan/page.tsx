'use client';

import React, { useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  Settings, Calendar, Database, Shield, RefreshCw, Save, ToggleLeft, ToggleRight, Server, Globe, Mail, Bell, Download, AlertTriangle, Check, Info, Sliders, Clock,
} from 'lucide-react';

type ToggleSetting = { label: string; desc: string; value: boolean; key: string; };

export default function PengaturanSistemPage() {
  const [semesterAktif, setSemesterAktif] = useState('Gasal 2026/2027');
  const [tahunAjaran, setTahunAjaran] = useState('2026/2027');
  const [periodeKRS, setPeriodeKRS] = useState({ start: '2026-09-01', end: '2026-09-20' });
  const [periodeUAS, setPeriodeUAS] = useState({ start: '2026-12-15', end: '2026-12-29' });
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [pddiktiAuto, setPddiktiAuto] = useState(true);
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(false);
  const [backupAuto, setBackupAuto] = useState(true);
  const [backupSchedule, setBackupSchedule] = useState('02:00');
  const [toast, setToast] = useState<string|null>(null);
  const [backupRunning, setBackupRunning] = useState(false);
  const [syncRunning, setSyncRunning] = useState(false);
  const [smtpHost, setSmtpHost] = useState('smtp.itn.ac.id');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('noreply@itn.ac.id');

  const showToast = (msg: string) => { setToast(msg); setTimeout(()=>setToast(null), 3500); };

  const handleSaveAkademik = () => showToast('Pengaturan akademik berhasil disimpan');
  const handleSaveIntegrasi = () => showToast('Konfigurasi integrasi berhasil disimpan');
  const handleSaveNotifikasi = () => showToast('Pengaturan notifikasi berhasil diperbarui');
  const handleRunBackup = () => {
    setBackupRunning(true);
    setTimeout(()=>{ setBackupRunning(false); showToast('Backup database berhasil diselesaikan'); }, 3000);
  };
  const handleSyncPDDIKTI = () => {
    setSyncRunning(true);
    setTimeout(()=>{ setSyncRunning(false); showToast('Sinkronisasi PDDIKTI berhasil dijalankan'); }, 2500);
  };

  const toggles: ToggleSetting[] = [
    { label: 'Mode Maintenance', desc: 'Nonaktifkan akses portal untuk seluruh pengguna sementara', value: maintenanceMode, key: 'maintenance' },
    { label: 'Mode Debug', desc: 'Aktifkan logging detail untuk troubleshooting sistem', value: debugMode, key: 'debug' },
    { label: 'Sinkronisasi PDDIKTI Otomatis', desc: 'Jadwalkan sinkronisasi data ke Pangkalan Data Dikti secara berkala', value: pddiktiAuto, key: 'pddikti' },
    { label: 'Notifikasi Email', desc: 'Kirim notifikasi transaksi & akademik via email kampus', value: emailNotif, key: 'email' },
    { label: 'Push Notification', desc: 'Kirim push notifikasi ke aplikasi mobile mahasiswa & dosen', value: pushNotif, key: 'push' },
    { label: 'Backup Database Otomatis', desc: 'Lakukan backup database secara terjadwal setiap hari', value: backupAuto, key: 'backup' },
  ];

  const handleToggle = (key: string) => {
    if(key==='maintenance') setMaintenanceMode(v=>!v);
    if(key==='debug') setDebugMode(v=>!v);
    if(key==='pddikti') setPddiktiAuto(v=>!v);
    if(key==='email') setEmailNotif(v=>!v);
    if(key==='push') setPushNotif(v=>!v);
    if(key==='backup') setBackupAuto(v=>!v);
  };

  return (
    <PortalLayout role="superadmin" userName="Super Administrator" userIdText="Sistem Informasi Akademik Terpadu">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">Konfigurasi Sistem</span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Pengaturan Sistem</h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-1">Kelola konfigurasi akademik, integrasi layanan, dan pengaturan sistem SIAKAD Premium</p>
            </div>
            {maintenanceMode && (
              <div className="flex items-center gap-2 bg-amber-400/20 border border-amber-400/40 rounded-xl px-4 py-2">
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0"/>
                <span className="text-xs text-amber-200 font-semibold">Mode Maintenance Aktif</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pengaturan Akademik */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-slate-50">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center"><Calendar className="w-5 h-5 text-white"/></div>
              <div><h2 className="font-bold text-slate-800">Kalender Akademik</h2><p className="text-xs text-slate-500">Periode & jadwal semester aktif</p></div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Tahun Ajaran</label>
                  <input value={tahunAjaran} onChange={e=>setTahunAjaran(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Semester Aktif</label>
                  <select value={semesterAktif} onChange={e=>setSemesterAktif(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-white">
                    <option>Gasal 2026/2027</option>
                    <option>Genap 2025/2026</option>
                    <option>Gasal 2025/2026</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Periode Pengisian KRS</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={periodeKRS.start} onChange={e=>setPeriodeKRS(p=>({...p,start:e.target.value}))} className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"/>
                  <span className="text-slate-400 text-sm">—</span>
                  <input type="date" value={periodeKRS.end} onChange={e=>setPeriodeKRS(p=>({...p,end:e.target.value}))} className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Periode UAS</label>
                <div className="flex items-center gap-2">
                  <input type="date" value={periodeUAS.start} onChange={e=>setPeriodeUAS(p=>({...p,start:e.target.value}))} className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"/>
                  <span className="text-slate-400 text-sm">—</span>
                  <input type="date" value={periodeUAS.end} onChange={e=>setPeriodeUAS(p=>({...p,end:e.target.value}))} className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"/>
                </div>
              </div>
              <button onClick={handleSaveAkademik} className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1E3A8A] text-white text-sm font-semibold rounded-xl hover:bg-[#1e40af] transition-colors">
                <Save className="w-4 h-4"/>Simpan Pengaturan Akademik
              </button>
            </div>
          </div>

          {/* Integrasi SMTP */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-slate-50">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center"><Mail className="w-5 h-5 text-white"/></div>
              <div><h2 className="font-bold text-slate-800">Konfigurasi Email (SMTP)</h2><p className="text-xs text-slate-500">Pengaturan server email kampus</p></div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">SMTP Host</label>
                  <input value={smtpHost} onChange={e=>setSmtpHost(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"/>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Port</label>
                  <input value={smtpPort} onChange={e=>setSmtpPort(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"/>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email Pengirim (From)</label>
                <input value={smtpUser} onChange={e=>setSmtpUser(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"/>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Password SMTP</label>
                <input type="password" placeholder="••••••••••••" className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"/>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>showToast('Koneksi SMTP berhasil diuji')} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-200 transition-colors">
                  <Globe className="w-4 h-4"/>Test Koneksi
                </button>
                <button onClick={handleSaveIntegrasi} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors">
                  <Save className="w-4 h-4"/>Simpan
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Toggle Settings */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-slate-50">
            <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center"><Sliders className="w-5 h-5 text-white"/></div>
            <div><h2 className="font-bold text-slate-800">Pengaturan Fitur Sistem</h2><p className="text-xs text-slate-500">Aktifkan atau nonaktifkan fitur sesuai kebutuhan operasional</p></div>
          </div>
          <div className="divide-y divide-slate-50">
            {toggles.map(t=>(
              <div key={t.key} className="flex items-center justify-between p-5 hover:bg-slate-50/50 transition-colors">
                <div className="flex-1 mr-4">
                  <p className="text-sm font-semibold text-slate-800">{t.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                </div>
                <button onClick={()=>handleToggle(t.key)} className={`relative inline-flex w-11 h-6 rounded-full transition-colors ${t.value?'bg-blue-600':'bg-slate-200'}`}>
                  <span className={`inline-block w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform mt-1 ${t.value?'translate-x-6':'translate-x-1'}`}/>
                </button>
              </div>
            ))}
          </div>
          {backupAuto && (
            <div className="px-5 pb-5">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Jadwal Backup Harian</label>
              <div className="flex items-center gap-3">
                <input type="time" value={backupSchedule} onChange={e=>setBackupSchedule(e.target.value)} className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"/>
                <span className="text-xs text-slate-500">WIB setiap hari</span>
              </div>
            </div>
          )}
        </div>

        {/* Database & PDDIKTI Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center"><Database className="w-5 h-5 text-white"/></div>
              <div><h3 className="font-bold text-slate-800">Backup Database</h3><p className="text-xs text-slate-500">Buat cadangan data secara manual</p></div>
            </div>
            <div className="space-y-3 mb-4">
              {[{label:'Backup Terakhir',val:'10 Sep 2026 02:01 WIB'},{label:'Ukuran Backup',val:'1.84 GB'},{label:'Lokasi Penyimpanan',val:'/var/backups/siakad/'}].map(i=>(
                <div key={i.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{i.label}</span>
                  <span className="font-semibold text-slate-700">{i.val}</span>
                </div>
              ))}
            </div>
            <button onClick={handleRunBackup} disabled={backupRunning} className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-70">
              {backupRunning?<RefreshCw className="w-4 h-4 animate-spin"/>:<Download className="w-4 h-4"/>}
              {backupRunning?'Sedang Membackup...':'Jalankan Backup Sekarang'}
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center"><Globe className="w-5 h-5 text-white"/></div>
              <div><h3 className="font-bold text-slate-800">Sinkronisasi PDDIKTI</h3><p className="text-xs text-slate-500">Kirim data akademik ke Dikti</p></div>
            </div>
            <div className="space-y-3 mb-4">
              {[{label:'Sinkronisasi Terakhir',val:'11 Sep 2026 04:30 WIB'},{label:'Status Koneksi',val:'Terhubung'},{label:'Mahasiswa Tersinkronisasi',val:'8.540 mahasiswa'}].map(i=>(
                <div key={i.label} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{i.label}</span>
                  <span className={`font-semibold ${i.val==='Terhubung'?'text-emerald-600':'text-slate-700'}`}>{i.val}</span>
                </div>
              ))}
            </div>
            <button onClick={handleSyncPDDIKTI} disabled={syncRunning} className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-70">
              {syncRunning?<RefreshCw className="w-4 h-4 animate-spin"/>:<RefreshCw className="w-4 h-4"/>}
              {syncRunning?'Sedang Sinkronisasi...':'Sinkronkan ke PDDIKTI'}
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <Check className="w-4 h-4"/>{toast}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
