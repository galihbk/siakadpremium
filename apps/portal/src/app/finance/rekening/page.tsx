'use client';
import React from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Landmark, TrendingUp, RefreshCw } from 'lucide-react';

const BANKS = [
  { bank:'Bank BNI', keterangan:'Virtual Account & Host-to-Host', no:'08234-9988-121', nama:'Yayasan ITN Malang - Rek Operasional UKT', saldo:12450000000, status:'Online' },
  { bank:'Bank Mandiri', keterangan:'Mandiri Bill Payment', no:'144-00-9821-331', nama:'Institut Teknologi Nusantara - Kas Umum', saldo:8120500000, status:'Online' },
  { bank:'Bank BRI', keterangan:'BRIVA Terpadu', no:'0021-01-002931-50-2', nama:'ITN Malang - Dana Mahasiswa & Wisuda', saldo:5340000000, status:'Online' },
  { bank:'Bank BCA', keterangan:'Payroll & Sarpras Kampus', no:'822-019-3381', nama:'Institut Teknologi Nusantara - Sarpras', saldo:2730000000, status:'Online' },
];
const formatRp = (v: number) => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(v);
const totalSaldo = BANKS.reduce((a,b)=>a+b.saldo,0);

export default function RekeningPage() {
  return (
    <PortalLayout role="finance" userName="Admin Keuangan" userIdText="Divisi Keuangan & Perbendaharaan">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">Aset Keuangan</span>
          <h1 className="text-xl sm:text-2xl font-black">Rekening Bank &amp; Kas</h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">Pantau saldo dan status rekening operasional kampus</p>
          <div className="mt-4 bg-white/10 rounded-xl p-4 inline-block">
            <p className="text-xs text-blue-200">Total Saldo Seluruh Rekening</p>
            <p className="text-3xl font-black">{formatRp(totalSaldo)}</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BANKS.map((b,i)=>(
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] flex items-center justify-center"><Landmark className="w-5 h-5 text-white"/></div>
                  <div><p className="font-bold text-slate-800 text-sm">{b.bank}</p><p className="text-xs text-slate-500">{b.keterangan}</p></div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-700">{b.status}</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">No. Rekening</span><span className="font-mono font-bold text-slate-700">{b.no}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Nama Rekening</span><span className="font-semibold text-slate-700 text-right max-w-[60%]">{b.nama}</span></div>
                <div className="flex justify-between pt-2 border-t border-slate-100"><span className="text-slate-500">Saldo</span><span className="text-lg font-black text-[#1E3A8A]">{formatRp(b.saldo)}</span></div>
              </div>
              <button className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 bg-slate-100 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors"><RefreshCw className="w-3.5 h-3.5"/>Sinkronkan Saldo</button>
            </div>
          ))}
        </div>
      </div>
    </PortalLayout>
  );
}
