import { Calendar, Clock, MapPin, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export function AgendaSection() {
  const agendaList = [
    {
      tanggal: '18',
      bulan: 'SEP',
      tahun: '2026',
      judul: 'Wisuda Program Sarjana & Magister Periode I Tahun Akademik 2026/2027',
      kategori: 'Seremonial',
      waktu: '08.00 - 12.30 WIB',
      lokasi: 'Auditorium Utama Nusantara Hall ITN',
      status: 'Akan Datang',
    },
    {
      tanggal: '25',
      bulan: 'SEP',
      tahun: '2026',
      judul: 'Seminar Nasional: Masa Depan Kedaulatan Data & Kecerdasan Buatan di Indonesia',
      kategori: 'Akademik',
      waktu: '09.00 - 15.00 WIB',
      lokasi: 'Gedung Riset Lantai 4 & Live Streaming YouTube',
      status: 'Pendaftaran Dibuka',
    },
    {
      tanggal: '05',
      bulan: 'OKT',
      tahun: '2026',
      judul: 'Pengenalan Kehidupan Kampus Mahasiswa Baru (PKKMB) Gelombang 2',
      kategori: 'Kemahasiswaan',
      waktu: '07.30 - 16.00 WIB',
      lokasi: 'Plaza Rektorat ITN',
      status: 'Wajib Mahasiswa Baru',
    },
    {
      tanggal: '19',
      bulan: 'OKT',
      tahun: '2026',
      judul: 'Pelaksanaan Ujian Tengah Semester (UTS) Gasal 2026/2027 Terpadu',
      kategori: 'Akademik',
      waktu: 'Sesuai Jadwal Kuliah',
      lokasi: 'Portal SIAKAD & Ruang Kelas Masing-Masing',
      status: 'Jadwal Akademik',
    },
    {
      tanggal: '10',
      bulan: 'NOV',
      tahun: '2026',
      judul: 'Batas Akhir Pendaftaran Mahasiswa Baru (PMB) Jalur Prestasi & Beasiswa',
      kategori: 'Penerimaan',
      waktu: '23.59 WIB',
      lokasi: 'Portal Daring pmb.itn.ac.id',
      status: 'Batas Pendaftaran',
    },
  ];

  return (
    <section id="agenda" className="py-20 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/80 text-[#1E3A8A] text-xs font-bold uppercase tracking-wider mb-3">
            Kalender Akademik
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Agenda & Kegiatan Kampus
          </h2>
          <p className="text-base text-slate-600 mt-2">
            Catat jadwal penting kegiatan akademik, seremonial, seminar riset, dan jadwal penerimaan mahasiswa baru.
          </p>
        </div>

        {/* Timeline List */}
        <div className="space-y-4">
          {agendaList.map((agenda, index) => (
            <div
              key={index}
              className="bg-slate-50 hover:bg-blue-50/40 rounded-xl p-5 sm:p-6 border border-slate-200/90 hover:border-[#1E3A8A]/30 transition-all duration-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 group"
            >
              {/* Kolom Tanggal */}
              <div className="flex items-center gap-5">
                <div className="flex flex-col items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-white border-2 border-[#1E3A8A] shadow-xs shrink-0 text-center">
                  <span className="text-xl sm:text-2xl font-black text-[#1E3A8A] leading-none">
                    {agenda.tanggal}
                  </span>
                  <span className="text-xs font-bold text-[#D4A017] tracking-wider mt-0.5 uppercase">
                    {agenda.bulan}
                  </span>
                </div>

                {/* Kolom Detail Agenda */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A]">
                      {agenda.kategori}
                    </span>
                    <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {agenda.status}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-[#1E3A8A] transition-colors leading-snug">
                    {agenda.judul}
                  </h3>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-500 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{agenda.waktu}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{agenda.lokasi}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="self-end sm:self-center shrink-0">
                <Link
                  href="#cta"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] hover:text-[#172554] bg-white group-hover:bg-[#1E3A8A] group-hover:text-white px-3.5 py-2 rounded-lg border border-slate-200 group-hover:border-[#1E3A8A] transition-all"
                >
                  <span>Detail Acara</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Link */}
        <div className="mt-8 text-center sm:text-right">
          <Link
            href="#cta"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#1E3A8A] hover:underline"
          >
            <span>Unduh Kalender Akademik Resmi 2026/2027 (PDF)</span>
            <ChevronRight className="w-4 h-4 text-[#D4A017]" />
          </Link>
        </div>

      </div>
    </section>
  );
}
