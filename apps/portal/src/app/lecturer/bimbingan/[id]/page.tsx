'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import {
  ArrowLeft,
  RefreshCw,
  GraduationCap,
} from 'lucide-react';

function authHeaders(): Record<string, string> {
  const { token, user } = getAuthSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  else if (user?.lecturerId) headers['x-lecturer-id'] = user.lecturerId;
  return headers;
}

interface AdviseeAcademicHistory {
  academicYear: string;
  courses: Array<{
    code: string;
    name: string;
    sks: number;
    class: string;
    status: string;
    gradeLetter: string | null;
    gradePoint: number | null;
  }>;
}

interface AdviseeDetail {
  id: string;
  nim: string;
  fullName: string;
  email: string;
  gender: string;
  birthPlace: string;
  birthDate: string | null;
  phone: string;
  nik: string;
  nisn: string;
  religion: string;
  address: string;
  studyProgramName: string;
  facultyName: string;
  degreeLevel: string;
  entryYear: number;
  currentSemester: number;
  status: string;
  advisorLecturerName: string;
  registrationType: string;
  track: string;
  admissionClass: string;
  schoolName: string;
  npsn: string;
  graduationYear: string;
  major: string;
  fatherName: string;
  fatherPhone: string;
  fatherJob: string;
  motherName: string;
  motherPhone: string;
  motherJob: string;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianJob: string | null;
  ipk: number;
  totalSksLulus: number;
  academicHistory: AdviseeAcademicHistory[];
}

export default function AdviseeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [detail, setDetail] = useState<AdviseeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const apiBase = getApiBaseUrl();

  useEffect(() => {
    if (!id) return;
    async function loadDetail() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const res = await fetch(`${apiBase}/lecturers/advisees/${id}/detail`, { headers: authHeaders() });
        if (res.ok) {
          const json = await res.json();
          setDetail(json.data || json);
        } else {
          const json = await res.json().catch(() => null);
          setErrorMsg(json?.message || 'Gagal memuat detail mahasiswa.');
        }
      } catch (err) {
        setErrorMsg('Gagal terhubung ke server.');
      } finally {
        setIsLoading(false);
      }
    }
    loadDetail();
  }, [id]);

  return (
    <PortalLayout role="lecturer" userName={detail?.advisorLecturerName || 'Dosen'} userIdText="">
      <div className="space-y-6">
        <button
          onClick={() => router.push('/lecturer/bimbingan')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#1E3A8A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Daftar Bimbingan
        </button>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mb-2 text-[#1E3A8A]" />
            <p className="text-xs">Memuat detail mahasiswa...</p>
          </div>
        ) : errorMsg || !detail ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center text-slate-400">
            <p className="text-sm font-semibold text-slate-600">{errorMsg || 'Mahasiswa tidak ditemukan.'}</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 text-white font-bold text-xl flex items-center justify-center border-2 border-white/40 shrink-0">
                {detail.fullName.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">{detail.fullName}</h1>
                <p className="text-xs sm:text-sm text-blue-200 mt-1 font-mono">NIM: {detail.nim}</p>
                <p className="text-xs sm:text-sm text-blue-200 mt-0.5">
                  {detail.studyProgramName} &bull; {detail.facultyName}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Data Akademik */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h4 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-3">Data Akademik</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Program Studi</span>
                    <strong className="text-slate-800">{detail.studyProgramName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Fakultas</span>
                    <strong className="text-slate-800">{detail.facultyName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Semester Aktif</span>
                    <strong className="text-slate-800">
                      Semester {detail.currentSemester} (Angkatan {detail.entryYear})
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Status Mahasiswa</span>
                    <strong className="text-slate-800">{detail.status}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Indeks Prestasi Kumulatif</span>
                    <strong className="text-[#1E3A8A] text-sm">{detail.ipk.toFixed(2)} / 4.00</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total SKS Lulus</span>
                    <strong className="text-slate-800">{detail.totalSksLulus} SKS</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Dosen Pembimbing Akademik</span>
                    <strong className="text-slate-800">{detail.advisorLecturerName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Jalur Masuk PMB</span>
                    <strong className="text-slate-800">
                      {detail.registrationType} &bull; {detail.track} &bull; {detail.admissionClass}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Biodata Diri */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h4 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-3">Biodata Diri</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Jenis Kelamin</span>
                    <strong className="text-slate-800">{detail.gender}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Tempat, Tanggal Lahir</span>
                    <strong className="text-slate-800">
                      {detail.birthPlace}
                      {detail.birthDate
                        ? `, ${new Date(detail.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`
                        : ''}
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">NIK</span>
                    <strong className="text-slate-800 font-mono">{detail.nik}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">NISN</span>
                    <strong className="text-slate-800 font-mono">{detail.nisn}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Agama</span>
                    <strong className="text-slate-800">{detail.religion}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">No. Telepon</span>
                    <strong className="text-slate-800">{detail.phone}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Email</span>
                    <strong className="text-slate-800">{detail.email}</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Alamat</span>
                    <strong className="text-slate-800">{detail.address}</strong>
                  </div>
                </div>
              </div>

              {/* Sekolah Asal */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h4 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-3">Sekolah Asal</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Asal Sekolah</span>
                    <strong className="text-slate-800">{detail.schoolName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">NPSN</span>
                    <strong className="text-slate-800 font-mono">{detail.npsn}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Tahun Lulus</span>
                    <strong className="text-slate-800">{detail.graduationYear}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Jurusan</span>
                    <strong className="text-slate-800">{detail.major}</strong>
                  </div>
                </div>
              </div>

              {/* Data Orang Tua / Wali */}
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h4 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-3">Data Orang Tua / Wali</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Nama Ayah</span>
                    <strong className="text-slate-800">
                      {detail.fatherName} {detail.fatherJob !== '-' ? `(${detail.fatherJob})` : ''}
                    </strong>
                    <p className="text-slate-500">{detail.fatherPhone}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Nama Ibu</span>
                    <strong className="text-slate-800">
                      {detail.motherName} {detail.motherJob !== '-' ? `(${detail.motherJob})` : ''}
                    </strong>
                    <p className="text-slate-500">{detail.motherPhone}</p>
                  </div>
                  {detail.guardianName && (
                    <div className="col-span-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Wali</span>
                      <strong className="text-slate-800">
                        {detail.guardianName} {detail.guardianJob ? `(${detail.guardianJob})` : ''}
                      </strong>
                      <p className="text-slate-500">{detail.guardianPhone}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Riwayat KRS */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5">
              <h4 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                Riwayat KRS
              </h4>
              {detail.academicHistory.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl border border-slate-200">
                  Belum ada riwayat KRS.
                </p>
              ) : (
                <div className="space-y-4">
                  {detail.academicHistory.map((h, idx) => (
                    <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 border-b border-slate-200 text-xs">
                        T.A. {h.academicYear}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="text-slate-500">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold">Kode</th>
                              <th className="px-4 py-2 text-left font-semibold">Mata Kuliah</th>
                              <th className="px-4 py-2 text-center font-semibold">SKS</th>
                              <th className="px-4 py-2 text-center font-semibold">Kelas</th>
                              <th className="px-4 py-2 text-center font-semibold">Status</th>
                              <th className="px-4 py-2 text-right font-semibold">Nilai</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {h.courses.map((c, ci) => (
                              <tr key={ci}>
                                <td className="px-4 py-2 font-mono text-slate-500">{c.code}</td>
                                <td className="px-4 py-2 text-slate-800">{c.name}</td>
                                <td className="px-4 py-2 text-slate-500 text-center">{c.sks}</td>
                                <td className="px-4 py-2 text-slate-500 text-center">{c.class}</td>
                                <td className="px-4 py-2 text-center">
                                  <span
                                    className={`px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                                      c.status === 'APPROVED'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : c.status === 'SUBMITTED'
                                        ? 'bg-amber-100 text-amber-700'
                                        : 'bg-slate-100 text-slate-600'
                                    }`}
                                  >
                                    {c.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2 text-right font-bold text-slate-700">{c.gradeLetter || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </PortalLayout>
  );
}
