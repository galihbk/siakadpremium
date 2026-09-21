'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import { CompressedFileUpload } from '@/components/common/CompressedFileUpload';
import { ArrowLeft, UploadCloud, RefreshCw, Check, X, FileText, Download, ExternalLink } from 'lucide-react';

function authHeaders(): Record<string, string> {
  const { token, user } = getAuthSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  else if ((user as any)?.lecturerId) headers['x-lecturer-id'] = (user as any).lecturerId;
  return headers;
}

export default function LecturerRpsUploadPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params?.classId as string;
  const apiBase = getApiBaseUrl();

  const [courseName, setCourseName] = useState('');
  const [className, setClassName] = useState('');
  const [rpsFileUrl, setRpsFileUrl] = useState<string | null>(null);
  const [rpsFileName, setRpsFileName] = useState<string | null>(null);
  const [rpsUploadedAt, setRpsUploadedAt] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadRps = useCallback(async () => {
    if (!classId) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${apiBase}/lecturers/classes/${classId}/rps`, { headers: authHeaders() });
      if (res.ok) {
        const json = await res.json();
        const data = json.data || json;
        setCourseName(data.courseName || '');
        setClassName(data.className || '');
        setRpsFileUrl(data.rpsFileUrl || null);
        setRpsFileName(data.rpsFileName || null);
        setRpsUploadedAt(data.rpsUploadedAt || null);
      } else {
        const json = await res.json().catch(() => null);
        showToast(json?.message || 'Gagal memuat data RPS.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    loadRps();
  }, [loadRps]);

  const handleUpload = async () => {
    if (!pendingFile) {
      showToast('Pilih berkas RPS terlebih dahulu.', 'error');
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', pendingFile);
      const uploadRes = await fetch(`${apiBase}/storage/upload?folder=rps-documents`, {
        method: 'POST',
        body: formData,
      });
      const uploadJson = await uploadRes.json().catch(() => null);
      if (!uploadRes.ok || !uploadJson?.data?.url) {
        showToast(uploadJson?.message || 'Gagal mengunggah berkas.', 'error');
        return;
      }

      const res = await fetch(`${apiBase}/lecturers/classes/${classId}/rps`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ fileUrl: uploadJson.data.url, fileName: pendingFile.name }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok) {
        showToast(json?.data?.message || json?.message || 'Berkas RPS berhasil diunggah.');
        setPendingFile(null);
        await loadRps();
      } else {
        showToast(json?.message || 'Gagal menyimpan berkas RPS.', 'error');
      }
    } catch {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <PortalLayout role="lecturer" userName="" userIdText="">
      <div className="space-y-6">
        <button
          onClick={() => router.push('/lecturer/rps')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#1E3A8A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Daftar Kelas
        </button>

        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <UploadCloud className="w-6 h-6" />
            {courseName || 'Upload RPS'}
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">{className}</p>
        </div>

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-[#1E3A8A] mb-2" />
            <p className="text-sm">Memuat data RPS...</p>
          </div>
        ) : (
          <>
            {rpsFileUrl && (
              <div className="bg-white rounded-2xl border border-slate-200 p-5">
                <h4 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider mb-3">Berkas RPS Saat Ini</h4>
                <div className="flex items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1E3A8A] flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{rpsFileName || 'Berkas RPS'}</p>
                      {rpsUploadedAt && (
                        <p className="text-[11px] text-slate-400">
                          Diunggah {new Date(rpsUploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                  <a
                    href={rpsFileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 shrink-0"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Lihat
                  </a>
                </div>
              </div>
            )}

            <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
              <h4 className="text-xs font-bold text-[#1E3A8A] uppercase tracking-wider">
                {rpsFileUrl ? 'Ganti / Unggah Ulang Berkas RPS' : 'Unggah Berkas RPS'}
              </h4>
              <CompressedFileUpload
                label="Berkas RPS (PDF/Word)"
                sublabel="Format yang didukung: PDF atau Word (DOC/DOCX). Maksimal ukuran wajar untuk dokumen RPS."
                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                maxSizeBytes={5 * 1024 * 1024}
                onFileReady={(file) => setPendingFile(file)}
                onFileRemoved={() => setPendingFile(null)}
              />
              <button
                onClick={handleUpload}
                disabled={isUploading || !pendingFile}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isUploading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                Unggah Berkas RPS
              </button>
            </div>
          </>
        )}

        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 text-white text-sm font-semibold px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-500'
            }`}
          >
            {toast.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
            {toast.msg}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
