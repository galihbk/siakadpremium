import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-blue-100 text-[#1E3A8A] flex items-center justify-center font-bold text-2xl mb-4">
        404
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Halaman Tidak Ditemukan</h2>
      <p className="text-sm text-slate-600 mb-6 max-w-md">
        Mohon maaf, halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
      </p>
      <Link
        href="/"
        className="px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#172554] text-white text-sm font-semibold rounded-xl transition-colors"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
