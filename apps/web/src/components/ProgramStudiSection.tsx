'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Award, BookOpen, CheckCircle, ChevronRight, GraduationCap } from 'lucide-react';

export function ProgramStudiSection() {
  const [filterLevel, setFilterLevel] = useState<'ALL' | 'S1' | 'S2'>('ALL');

  const prodiList = [
    {
      code: 'TIF-S1',
      nama: 'Teknik Informatika',
      fakultas: 'Fakultas Ilmu Komputer',
      jenjang: 'S1',
      akreditasi: 'Unggul',
      sks: 144,
      konsentrasi: 'Kecerdasan Buatan (AI), Rekayasa Perangkat Lunak, Keamanan Siber',
    },
    {
      code: 'SI-S1',
      nama: 'Sistem Informasi',
      fakultas: 'Fakultas Ilmu Komputer',
      jenjang: 'S1',
      akreditasi: 'Unggul',
      sks: 144,
      konsentrasi: 'Enterprise Systems, Business Intelligence, E-Commerce',
    },
    {
      code: 'TM-S1',
      nama: 'Teknik Mesin',
      fakultas: 'Fakultas Teknik',
      jenjang: 'S1',
      akreditasi: 'Unggul',
      sks: 146,
      konsentrasi: 'Konversi Energi, Mekatronika & Otomasi, Material Maju',
    },
    {
      code: 'TE-S1',
      nama: 'Teknik Elektro',
      fakultas: 'Fakultas Teknik',
      jenjang: 'S1',
      akreditasi: 'Unggul',
      sks: 144,
      konsentrasi: 'Sistem Tenaga Listrik, Telekomunikasi & IoT, Robotika',
    },
    {
      code: 'TS-S1',
      nama: 'Teknik Sipil',
      fakultas: 'Fakultas Teknik',
      jenjang: 'S1',
      akreditasi: 'Unggul',
      sks: 144,
      konsentrasi: 'Struktur Tahan Gempa, Manajemen Konstruksi, Hidroteknik',
    },
    {
      code: 'MNJ-S1',
      nama: 'Manajemen Bisnis',
      fakultas: 'Fakultas Ekonomi & Bisnis',
      jenjang: 'S1',
      akreditasi: 'Unggul',
      sks: 144,
      konsentrasi: 'Keuangan Korporasi, Pemasaran Digital, Kewirausahaan Global',
    },
    {
      code: 'TIF-S2',
      nama: 'Magister Teknik Informatika',
      fakultas: 'Fakultas Ilmu Komputer',
      jenjang: 'S2',
      akreditasi: 'Unggul',
      sks: 36,
      konsentrasi: 'Advanced Machine Learning, Cloud Computing Architecture, Big Data Science',
    },
    {
      code: 'TM-S2',
      nama: 'Magister Rekayasa Mesin',
      fakultas: 'Fakultas Teknik',
      jenjang: 'S2',
      akreditasi: 'Unggul',
      sks: 36,
      konsentrasi: 'Renewable Energy Engineering, Smart Manufacturing Systems',
    },
  ];

  const filtered =
    filterLevel === 'ALL'
      ? prodiList
      : prodiList.filter((p) => p.jenjang === filterLevel);

  return (
    <section id="prodi" className="py-20 bg-slate-50 border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider mb-3">
              Kurikulum Berstandar Internasional
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Program Studi Pilihan
            </h2>
            <p className="text-base text-slate-600 mt-2 max-w-2xl">
              Seluruh program studi dirancang selaras dengan Outcome-Based Education (OBE) dan kebutuhan industri global.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
            <button
              onClick={() => setFilterLevel('ALL')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                filterLevel === 'ALL'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Program
            </button>
            <button
              onClick={() => setFilterLevel('S1')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                filterLevel === 'S1'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sarjana (S1)
            </button>
            <button
              onClick={() => setFilterLevel('S2')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                filterLevel === 'S2'
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pascasarjana (S2)
            </button>
          </div>
        </div>

        {/* Prodi Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((item, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-subtle hover:shadow-card hover:border-[#1E3A8A]/40 transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-[#1E3A8A] border border-blue-200/80">
                    Jenjang {item.jenjang}
                  </span>
                  <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    <CheckCircle className="w-3 h-3" />
                    <span>{item.akreditasi}</span>
                  </div>
                </div>

                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-1 group-hover:text-[#1E3A8A] transition-colors leading-snug">
                  {item.nama}
                </h3>
                <p className="text-xs text-slate-500 font-medium mb-3">
                  {item.fakultas} &bull; {item.sks} SKS
                </p>

                <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
                  <strong className="text-slate-700">Fokus:</strong> {item.konsentrasi}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-[#1E3A8A]">
                <span>Kurikulum & Karir</span>
                <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
