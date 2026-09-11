'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Sparkles,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import {
  compressUploadedFile,
  formatFileSize,
  fileToBase64,
  CompressResult,
} from '@/lib/fileCompression';

export interface CompressedFileUploadProps {
  label?: string;
  sublabel?: string;
  accept?: string;
  required?: boolean;
  maxSizeBytes?: number;
  initialPreviewUrl?: string;
  onFileReady: (file: File, base64?: string) => void;
  onFileRemoved?: () => void;
  className?: string;
}

export const CompressedFileUpload: React.FC<CompressedFileUploadProps> = ({
  label = 'Unggah Berkas',
  sublabel = 'Format yang didukung: Gambar (JPG, PNG, WebP) atau Dokumen PDF. Otomatis dikompresi.',
  accept = 'image/jpeg,image/png,image/webp,application/pdf',
  required = false,
  maxSizeBytes = 1024 * 1024, // 1 MB target
  initialPreviewUrl,
  onFileReady,
  onFileRemoved,
  className = '',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [compressResult, setCompressResult] = useState<CompressResult | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialPreviewUrl || null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleProcessFile = async (rawFile: File) => {
    setErrorMsg(null);
    setIsCompressing(true);

    try {
      // Jalankan kompresi otomatis
      const result = await compressUploadedFile(rawFile, {
        imageOptions: {
          maxSizeBytes,
          maxWidthOrHeight: 1600,
          initialQuality: 0.8,
        },
        pdfOptions: {
          maxSizeBytes: Math.max(maxSizeBytes, 1.5 * 1024 * 1024),
        },
      });

      setCompressResult(result);

      let base64Data: string | undefined = undefined;
      if (result.file.type.startsWith('image/')) {
        base64Data = await fileToBase64(result.file);
        setPreviewUrl(base64Data);
      } else {
        setPreviewUrl(null);
      }

      // Berikan file hasil kompresi ke form induk
      onFileReady(result.file, base64Data);
    } catch (err: any) {
      console.error('Gagal mengompresi file:', err);
      setErrorMsg('Gagal memproses file. Silakan coba file lain.');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleProcessFile(files[0]);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCompressResult(null);
    setPreviewUrl(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileRemoved) {
      onFileRemoved();
    }
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-bold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Upload Zone */}
      <div
        onClick={() => !isCompressing && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
            : compressResult
            ? 'border-emerald-300 bg-emerald-50/20'
            : 'border-slate-200 hover:border-slate-300 bg-slate-50/60 hover:bg-slate-50'
        }`}
      >
        {isCompressing ? (
          <div className="py-4 flex flex-col items-center justify-center space-y-2">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            <div className="text-xs font-bold text-slate-700">Mengompresi Berkas...</div>
            <p className="text-[11px] text-slate-400">
              Mengoptimalkan resolusi dan ukuran file secara instan di peramban.
            </p>
          </div>
        ) : compressResult ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3 min-w-0">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#1E3A8A] flex items-center justify-center shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
              )}

              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate max-w-xs">
                  {compressResult.file.name}
                </p>

                {/* Ukuran dan persentase penghematan */}
                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px]">
                  {compressResult.wasCompressed ? (
                    <>
                      <span className="text-slate-400 line-through">
                        {formatFileSize(compressResult.originalSize)}
                      </span>
                      <ArrowRight className="w-3 h-3 text-emerald-600" />
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {formatFileSize(compressResult.compressedSize)}
                      </span>
                      <span className="font-bold text-emerald-600">
                        (-{compressResult.savedPercent}%)
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-600 font-medium">
                      {formatFileSize(compressResult.compressedSize)} (Ukuran sudah optimal)
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Hapus / Ganti Berkas"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5 py-2">
            <div className="w-10 h-10 rounded-full bg-blue-50 text-[#1E3A8A] flex items-center justify-center mx-auto">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold text-slate-800">
              Klik untuk pilih berkas <span className="font-normal text-slate-500">atau tarik ke sini</span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              {sublabel}
            </p>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-1.5 text-rose-600 text-[11px] font-medium mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
