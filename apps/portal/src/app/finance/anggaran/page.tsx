'use client';
import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { TrendingUp, Download } from 'lucide-react';

const DATA = [
  { kategori:'Gaji Dosen & Pegawai', alokasi:5000000000, realisasi:4250000000 },
  { kategori:'Sarana Prasarana & Pemeliharaan', alokasi:4000000000, realisasi:2400000000 },
  { kategori:'Operasional Akademik & Lab', alokasi:2000000000, realisasi:1400000000 },
  { kategori:'Penelitian & Pengabdian P3M', alokasi:1500000000, realisasi:825000000 },
  { kategori:'Beasiswa & Bantuan UKT', alokasi:1200000000, realisasi:545000000 },
  { kategori:'Kemahasiswaan & Event', alokasi:800000000, realisasi:420000000 },
];
const formatRp = (v: number) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(v);
const total = { alokasi: DATA.reduce((a,d)=>a+d.alokasi,0), realisasi: DATA.reduce((a,d)=>a+d.realisasi,0) };

export default function AnggaranPage() {
  return (
    <PortalLayout role="finance" userName="Admin Keuangan" userIdText="Divisi Keuangan & Perbendaharaan">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">Anggaran Kampus</span>
          <h1 className="text-xl sm:text-2xl font-black">Realisasi Anggaran Kampus</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">Monitoring realisasi anggaran per kategori tahun ajaran berjalan</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[{label:'Total Alokasi',val:formatRp(total.alokasi),color:'text-blue-700'},{label:'Realisasi',val:formatRp(total.realisasi),color:'text-emerald-700'},{label:'Sisa Anggaran',val:formatRp(total.alokasi-total.realisasi),color:'text-amber-700'}].map(c=>(
            <div key={c.label} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <p className="text-xs text-slate-500 mb-1">{c.label}</p>
              <p className={`text-xl font-black ${c.color}`}>{c.val}</p>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-slate-100">
            <h2 className="font-bold text-slate-800">Realisasi Per Kategori</h2>
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#1e40af] transition-colors"><Download className="w-3.5 h-3.5"/>Ekspor Laporan</button>
          </div>
          <div className="p-5 space-y-5">
            {DATA.map((d,i)=>{
              const pct = Math.round(d.realisasi/d.alokasi*100);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-slate-700">{d.kategori}</span>
                    <span className={`text-sm font-black ${pct>90?'text-red-600':pct>60?'text-amber-600':'text-emerald-600'}`}>{pct}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-2.5 rounded-full transition-all ${pct>90?'bg-red-500':pct>60?'bg-amber-500':'bg-emerald-500'}`} style={{width:`${pct}%`}}/>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>Realisasi: {formatRp(d.realisasi)}</span>
                    <span>Alokasi: {formatRp(d.alokasi)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
