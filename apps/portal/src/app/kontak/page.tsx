'use client';

import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  Building2,
  Clock,
  Mail,
  MapPin,
  Phone,
  Send,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function KontakPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'PMB',
    subject: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', category: 'PMB', subject: '', message: '' });
    }, 4000);
  };

  const departments = [
    {
      name: 'Layanan PMB (Penerimaan Mahasiswa Baru)',
      phone: '(021) 7890-1234 ext. 101',
      wa: '+62 812-3456-7890',
      email: 'pmb@itn.ac.id',
      location: 'Gedung Rektorat Lt. 1, Kampus Utama',
    },
    {
      name: 'Biro Administrasi Akademik & Kemahasiswaan (BAAK)',
      phone: '(021) 7890-1234 ext. 202',
      wa: '+62 813-9876-5432',
      email: 'baak@itn.ac.id',
      location: 'Gedung Pelayanan Terpadu Lt. 2',
    },
    {
      name: 'Helpdesk SIAKAD Premium & IT Center',
      phone: '(021) 7890-1234 ext. 303',
      wa: '+62 811-2233-4455',
      email: 'support.siakad@itn.ac.id',
      location: 'Gedung Data Center & Komputasi Lt. 3',
    },
    {
      name: 'Biro Keuangan & Pembayaran UKT/SPP',
      phone: '(021) 7890-1234 ext. 404',
      wa: '+62 812-7788-9900',
      email: 'keuangan@itn.ac.id',
      location: 'Gedung Rektorat Sayap Timur Lt. 1',
    },
  ];

  const faqs = [
    {
      q: 'Bagaimana cara mengakses akun Portal SIAKAD Premium?',
      a: 'Mahasiswa dan dosen dapat masuk melalui tautan "Portal Akademik" di navbar atas menggunakan NIM/NIDN dan kata sandi yang diterbitkan oleh BAAK saat awal semester.',
    },
    {
      q: 'Kapan jadwal operasional pelayanan administrasi tatap muka?',
      a: 'Layanan kantor buka setiap hari Senin - Jumat pukul 08.00 - 16.00 WIB. Untuk hari Sabtu, layanan administrasi berlangsung secara daring melalui helpdesk tiket.',
    },
    {
      q: 'Di mana lokasi pelaksanaan Ujian Masuk PMB Jalur Mandiri?',
      a: 'Ujian Computer-Based Test (CBT) diselenggarakan di Lab Komputasi Kampus Utama Gedung B atau dapat diikuti secara daring dari rumah dengan proctoring browser.',
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-grow">
        {/* Header Hero Section */}
        <section className="bg-gradient-to-br from-[#0F172A] via-[#1E3A8A] to-[#172554] text-white py-14 sm:py-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4A017_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-[#D4A017]/20 border border-[#D4A017]/40 text-[#D4A017] text-xs font-bold uppercase tracking-wider mb-3">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Pusat Informasi & Layanan</span>
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                Hubungi Kami
              </h1>
              <p className="mt-3 text-sm sm:text-base text-blue-100/90 leading-relaxed">
                Kami siap membantu kebutuhan informasi akademik, pendaftaran mahasiswa baru, verifikasi dokumen, maupun kerjasama kelembagaan.
              </p>
            </div>
          </div>
        </section>

        {/* 2 Kampus Cards */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#D4A017]">
                  Kampus Utama (Rektorat)
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  Institut Teknologi Nusantara &bull; Kampus A
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Jl. Nusantara Raya No. 101, Kawasan Edukasi Mandiri, Jakarta Selatan 12440
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-[#1E3A8A]">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    (021) 7890-1234
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    humas@itn.ac.id
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-card flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E3A8A]">
                  Kampus Inovasi & Riset
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-0.5">
                  Technopark & Laboratorium Riset ITN
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                  Jl. Riset Sains Terpadu Kav. 45, Science Park Cybercity, BSD City 15345
                </p>
                <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-[#1E3A8A]">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5" />
                    (021) 7890-5678
                  </span>
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    technopark@itn.ac.id
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Form + Department Directory */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Form Aspirasi & Layanan */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-10 shadow-card">
              <div className="mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">
                  Layanan Aspirasi & Informasi
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
                  Kirim Pertanyaan / Pesan
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Isi formulir berikut untuk berinteraksi langsung dengan tim humas dan layanan akademik ITN.
                </p>
              </div>

              {formSubmitted ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-fade-in">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-emerald-950">
                    Pesan Anda Berhasil Terkirim!
                  </h3>
                  <p className="text-xs text-emerald-800 leading-relaxed max-w-md mx-auto">
                    Terima kasih telah menghubungi Institut Teknologi Nusantara. Tim helpdesk kami akan membalas pesan melalui email dalam kurun waktu 1x24 jam kerja.
                  </p>
                  <button
                    onClick={() => setFormSubmitted(false)}
                    className="text-xs font-bold text-emerald-800 underline mt-2"
                  >
                    Kirim pesan lain
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nama Lengkap *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="cth. Hendra Gunawan"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Alamat Email Resmi *
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="nama@email.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Tujuan Bagian / Kategori *
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10 bg-white"
                      >
                        <option value="PMB">Penerimaan Mahasiswa Baru (PMB)</option>
                        <option value="BAAK">Administrasi Akademik (BAAK / KRS)</option>
                        <option value="SIAKAD">Kendala Teknis SIAKAD Premium</option>
                        <option value="Keuangan">UKT / Tagihan Keuangan</option>
                        <option value="Kerjasama">Kemitraan Industri / Kampus</option>
                        <option value="Umum">Pertanyaan Umum Lainnya</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Subjek Pesan *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="cth. Pertanyaan Beasiswa Prestasi"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Isi Pesan / Keterangan Lengkap *
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Tuliskan pertanyaan atau kendala yang Anda alami secara jelas..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:border-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/10"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#1E3A8A] text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-[#172554] transition-all"
                  >
                    <Send className="w-4 h-4 text-[#D4A017]" />
                    <span>Kirim Pesan Sekarang</span>
                  </button>
                </form>
              )}
            </div>

            {/* Direktori Departemen */}
            <div className="lg:col-span-5 space-y-4">
              <h3 className="text-base font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#1E3A8A]" />
                <span>Direktori Kontak Langsung</span>
              </h3>

              {departments.map((dept, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 border border-slate-200 shadow-subtle text-xs">
                  <p className="font-bold text-slate-900 text-sm">{dept.name}</p>
                  <p className="text-slate-500 mt-0.5">{dept.location}</p>
                  
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1 text-slate-700">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Telepon:</span>
                      <span className="font-mono font-semibold">{dept.phone}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">WhatsApp:</span>
                      <span className="font-mono font-semibold text-emerald-700">{dept.wa}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Email:</span>
                      <span className="font-medium text-[#1E3A8A]">{dept.email}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Operating Hours Card */}
              <div className="bg-blue-50 border border-blue-200/80 rounded-xl p-4 text-xs text-blue-900">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <Clock className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Jam Operasional Pelayanan</span>
                </div>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Senin - Jumat: 08.00 - 16.00 WIB (Tatap Muka & Daring)<br />
                  Sabtu: 08.00 - 12.00 WIB (Khusus Layanan PMB & Daring)<br />
                  Minggu & Hari Libur Nasional: Tutup
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* FAQ Section */}
        <section className="bg-white py-14 sm:py-20 border-t border-slate-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <span className="text-xs font-bold uppercase tracking-wider text-[#D4A017]">
                Tanya Jawab Populer
              </span>
              <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
                Pertanyaan yang Sering Diajukan
              </h2>
            </div>

            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80">
                  <h4 className="text-sm font-bold text-slate-900 flex items-start gap-2.5">
                    <HelpCircle className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                    <span>{faq.q}</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-2 pl-6 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
