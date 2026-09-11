'use client';

import React, { useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  ShieldCheck, Users, Check, X, Edit3, Save, RotateCcw, Info, Lock, Unlock, Crown, UserCheck, GraduationCap, Building2, BookOpen, Wallet, FlaskConical, BarChart3, Settings,
} from 'lucide-react';

type Permission = { read: boolean; create: boolean; update: boolean; delete: boolean; export: boolean; approve: boolean; };
type RoleKey = 'SUPER_ADMIN' | 'ADMIN_BAAK' | 'ADMIN_PMB' | 'ADMIN_KEUANGAN' | 'ADMIN_LP3M' | 'LECTURER' | 'STUDENT';

const MODULES = ['Dashboard & Sistem','Data Mahasiswa','Data Dosen','Kurikulum & Mata Kuliah','Jadwal Perkuliahan','KRS Mahasiswa','Nilai & Akademik','Presensi & Kehadiran','Keuangan & Tagihan','PMB & Seleksi','LP3M & Penelitian','Laporan & Ekspor','Role & Pengguna','Pengaturan Sistem'];
const PERM_KEYS: (keyof Permission)[] = ['read','create','update','delete','export','approve'];
const PERM_LABELS: Record<keyof Permission, string> = { read:'Lihat', create:'Tambah', update:'Edit', delete:'Hapus', export:'Ekspor', approve:'Setujui' };

const ROLE_META: Record<RoleKey, {label:string; color:string; bg:string; desc:string}> = {
  SUPER_ADMIN: { label:'Super Admin', color:'#7C3AED', bg:'#EDE9FE', desc:'Akses penuh' },
  ADMIN_BAAK: { label:'Admin BAAK', color:'#1E3A8A', bg:'#DBEAFE', desc:'Administrasi akademik' },
  ADMIN_PMB: { label:'Admin PMB', color:'#0F766E', bg:'#CCFBF1', desc:'Penerimaan mahasiswa baru' },
  ADMIN_KEUANGAN: { label:'Admin Keuangan', color:'#B45309', bg:'#FEF3C7', desc:'Keuangan & pembayaran' },
  ADMIN_LP3M: { label:'Admin LP3M', color:'#065F46', bg:'#D1FAE5', desc:'Penelitian & tri dharma' },
  LECTURER: { label:'Dosen', color:'#1D4ED8', bg:'#DBEAFE', desc:'Pengajar & pembimbing' },
  STUDENT: { label:'Mahasiswa', color:'#0369A1', bg:'#E0F2FE', desc:'Peserta didik aktif' },
};

function allOn(): Permission { return { read:true, create:true, update:true, delete:true, export:true, approve:true }; }
function allOff(): Permission { return { read:false, create:false, update:false, delete:false, export:false, approve:false }; }

type Matrix = Record<RoleKey, Record<string, Permission>>;

const DEFAULT: Matrix = {
  SUPER_ADMIN: Object.fromEntries(MODULES.map(m=>[m,allOn()])) as Record<string,Permission>,
  ADMIN_BAAK: Object.fromEntries(MODULES.map(m=>[m,{read:['Dashboard & Sistem','Data Mahasiswa','Data Dosen','Kurikulum & Mata Kuliah','Jadwal Perkuliahan','KRS Mahasiswa','Nilai & Akademik','Presensi & Kehadiran','Laporan & Ekspor'].includes(m), create:['Data Mahasiswa','Data Dosen','Kurikulum & Mata Kuliah','Jadwal Perkuliahan'].includes(m), update:['Data Mahasiswa','Data Dosen','Kurikulum & Mata Kuliah','Jadwal Perkuliahan','Nilai & Akademik'].includes(m), delete:false, export:['Dashboard & Sistem','Data Mahasiswa','Data Dosen','Kurikulum & Mata Kuliah','Jadwal Perkuliahan','KRS Mahasiswa','Nilai & Akademik','Presensi & Kehadiran','Laporan & Ekspor'].includes(m), approve:['Data Mahasiswa','Jadwal Perkuliahan','KRS Mahasiswa','Nilai & Akademik'].includes(m)}])) as Record<string,Permission>,
  ADMIN_PMB: Object.fromEntries(MODULES.map(m=>[m,{read:['Dashboard & Sistem','Kurikulum & Mata Kuliah','PMB & Seleksi','Laporan & Ekspor'].includes(m), create:['PMB & Seleksi'].includes(m), update:['PMB & Seleksi'].includes(m), delete:false, export:['PMB & Seleksi','Laporan & Ekspor'].includes(m), approve:['PMB & Seleksi'].includes(m)}])) as Record<string,Permission>,
  ADMIN_KEUANGAN: Object.fromEntries(MODULES.map(m=>[m,{read:['Dashboard & Sistem','Data Mahasiswa','Keuangan & Tagihan','Laporan & Ekspor'].includes(m), create:['Keuangan & Tagihan'].includes(m), update:['Keuangan & Tagihan'].includes(m), delete:false, export:['Keuangan & Tagihan','Laporan & Ekspor'].includes(m), approve:['Keuangan & Tagihan'].includes(m)}])) as Record<string,Permission>,
  ADMIN_LP3M: Object.fromEntries(MODULES.map(m=>[m,{read:['Dashboard & Sistem','Data Dosen','LP3M & Penelitian','Laporan & Ekspor'].includes(m), create:['LP3M & Penelitian'].includes(m), update:['LP3M & Penelitian'].includes(m), delete:false, export:['LP3M & Penelitian','Laporan & Ekspor'].includes(m), approve:['LP3M & Penelitian'].includes(m)}])) as Record<string,Permission>,
  LECTURER: Object.fromEntries(MODULES.map(m=>[m,{read:['Dashboard & Sistem','Data Mahasiswa','Data Dosen','Kurikulum & Mata Kuliah','Jadwal Perkuliahan','KRS Mahasiswa','Nilai & Akademik','Presensi & Kehadiran','LP3M & Penelitian','Laporan & Ekspor'].includes(m), create:['Nilai & Akademik','Presensi & Kehadiran','LP3M & Penelitian'].includes(m), update:['Data Dosen','Nilai & Akademik','Presensi & Kehadiran','LP3M & Penelitian'].includes(m), delete:false, export:['Nilai & Akademik','LP3M & Penelitian','Laporan & Ekspor'].includes(m), approve:['KRS Mahasiswa'].includes(m)}])) as Record<string,Permission>,
  STUDENT: Object.fromEntries(MODULES.map(m=>[m,{read:['Dashboard & Sistem','Data Mahasiswa','Data Dosen','Kurikulum & Mata Kuliah','Jadwal Perkuliahan','KRS Mahasiswa','Nilai & Akademik','Presensi & Kehadiran','Keuangan & Tagihan','Laporan & Ekspor'].includes(m), create:['KRS Mahasiswa'].includes(m), update:['Data Mahasiswa','KRS Mahasiswa'].includes(m), delete:['KRS Mahasiswa'].includes(m), export:['Nilai & Akademik','Laporan & Ekspor'].includes(m), approve:false}])) as Record<string,Permission>,
};

export default function RolesPermissionsPage() {
  const [matrix, setMatrix] = useState<Matrix>(DEFAULT);
  const [editing, setEditing] = useState<RoleKey|null>(null);
  const [draft, setDraft] = useState<Matrix>(DEFAULT);
  const [selected, setSelected] = useState<RoleKey>('SUPER_ADMIN');
  const [toast, setToast] = useState(false);

  const toggle = (mod:string, p:keyof Permission) => {
    if(!editing) return;
    setDraft(prev=>({...prev,[editing]:{...prev[editing],[mod]:{...prev[editing][mod],[p]:!prev[editing][mod][p]}}}));
  };
  const startEdit = (r:RoleKey) => { setEditing(r); setDraft(JSON.parse(JSON.stringify(matrix))); setSelected(r); };
  const save = () => { setMatrix(JSON.parse(JSON.stringify(draft))); setEditing(null); setToast(true); setTimeout(()=>setToast(false),3000); };
  const cancel = () => { setEditing(null); };
  const grantAll = (mod:string) => { if(!editing) return; setDraft(prev=>({...prev,[editing]:{...prev[editing],[mod]:allOn()}})); };
  const revokeAll = (mod:string) => { if(!editing) return; setDraft(prev=>({...prev,[editing]:{...prev[editing],[mod]:allOff()}})); };

  const active = editing ? draft : matrix;
  const counts = (r:RoleKey) => { let on=0,tot=0; MODULES.forEach(m=>PERM_KEYS.forEach(p=>{tot++;if(active[r][m][p])on++;})); return {on,tot}; };

  return (
    <PortalLayout role="superadmin" userName="Super Administrator" userIdText="Sistem Informasi Akademik Terpadu">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#4338CA] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">Manajemen Akses Sistem</span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Role &amp; Permission</h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-1">Kelola hak akses setiap role pengguna terhadap modul-modul di SIAKAD Premium</p>
            </div>
            <div className="flex items-center gap-2 text-xs bg-white/10 rounded-xl px-3 py-2">
              <Info className="w-4 h-4 text-yellow-300 shrink-0" />
              <span className="text-blue-100">Pilih role lalu klik <b>Edit</b> untuk mengubah akses modul</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {(Object.keys(ROLE_META) as RoleKey[]).map(role=>{
            const meta = ROLE_META[role];
            const {on,tot} = counts(role);
            return (
              <button key={role} onClick={()=>{setSelected(role);}} className={`rounded-xl p-3 text-left border-2 transition-all ${selected===role?'border-[#1E3A8A] shadow-md':'border-transparent'}`} style={{background:meta.bg}}>
                <p className="text-xs font-bold truncate mb-0.5" style={{color:meta.color}}>{meta.label}</p>
                <p className="text-[10px] text-slate-500">{on}/{tot} akses</p>
                <div className="h-1 rounded-full bg-white/60 mt-2"><div className="h-1 rounded-full" style={{width:`${Math.round(on/tot*100)}%`,background:meta.color}} /></div>
              </button>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <div>
              <h2 className="font-bold text-slate-800">{ROLE_META[selected].label}</h2>
              <p className="text-xs text-slate-500">{ROLE_META[selected].desc}</p>
            </div>
            <div className="flex gap-2">
              {editing===selected ? (
                <>
                  <button onClick={cancel} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"><RotateCcw className="w-3.5 h-3.5"/>Batal</button>
                  <button onClick={save} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1e40af] transition-colors"><Save className="w-3.5 h-3.5"/>Simpan</button>
                </>
              ) : selected!=='SUPER_ADMIN' && (
                <button onClick={()=>startEdit(selected)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1e40af] transition-colors"><Edit3 className="w-3.5 h-3.5"/>Edit Akses</button>
              )}
            </div>
          </div>
          {selected==='SUPER_ADMIN' && (
            <div className="mx-5 mt-4 flex items-center gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3">
              <Lock className="w-4 h-4 text-violet-600 shrink-0"/>
              <p className="text-xs text-violet-700 font-medium">Super Admin memiliki akses penuh ke semua modul dan tidak dapat dibatasi.</p>
            </div>
          )}
          <div className="overflow-x-auto px-5 pb-5 mt-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left">
                  <th className="pb-3 text-slate-500 font-semibold w-52">Modul Sistem</th>
                  {PERM_KEYS.map(p=><th key={p} className="pb-3 text-center text-slate-500 font-semibold px-2">{PERM_LABELS[p]}</th>)}
                  {editing===selected && <th className="pb-3 text-center text-slate-500 font-semibold px-2">Aksi Cepat</th>}
                </tr>
              </thead>
              <tbody>
                {MODULES.map(mod=>{
                  const perms = active[selected][mod];
                  const allG = PERM_KEYS.every(p=>perms[p]);
                  const noneG = PERM_KEYS.every(p=>!perms[p]);
                  return (
                    <tr key={mod} className="border-t border-slate-50 hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 pr-4"><span className="font-medium text-slate-700">{mod}</span></td>
                      {PERM_KEYS.map(perm=>{
                        const on = perms[perm];
                        const canEdit = editing===selected;
                        return (
                          <td key={perm} className="py-3 text-center px-2">
                            {canEdit ? (
                              <button onClick={()=>toggle(mod,perm)} className={`w-7 h-7 rounded-lg mx-auto flex items-center justify-center transition-all ${on?'bg-emerald-100 text-emerald-600 hover:bg-emerald-200':'bg-slate-100 text-slate-300 hover:bg-slate-200'}`}>
                                {on?<Check className="w-3.5 h-3.5"/>:<X className="w-3.5 h-3.5"/>}
                              </button>
                            ) : (
                              <div className={`w-6 h-6 rounded-md mx-auto flex items-center justify-center ${on?'bg-emerald-100':'bg-slate-100'}`}>
                                {on?<Check className="w-3.5 h-3.5 text-emerald-600"/>:<X className="w-3 h-3 text-slate-300"/>}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      {editing===selected && (
                        <td className="py-3 text-center px-2">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={()=>grantAll(mod)} disabled={allG} className="w-7 h-7 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors disabled:opacity-30"><Unlock className="w-3.5 h-3.5"/></button>
                            <button onClick={()=>revokeAll(mod)} disabled={noneG} className="w-7 h-7 rounded-lg flex items-center justify-center bg-red-50 text-red-500 hover:bg-red-100 transition-colors disabled:opacity-30"><Lock className="w-3.5 h-3.5"/></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {toast && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <Check className="w-4 h-4"/>Perubahan role berhasil disimpan
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
