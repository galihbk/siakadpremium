'use client';

import React, { useState, useEffect } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import {
  Hash,
  Sliders,
  Save,
  RotateCcw,
  CheckCircle2,
  Info,
  Layers,
  GraduationCap,
  Building2,
  ListOrdered,
  Calendar,
  Copy,
  Check,
  Zap,
  Edit3,
  RefreshCw,
  Search,
} from 'lucide-react';

interface CustomProdiFormat {
  id: string;
  name: string;
  degree: string;
  diktiCode: string;
  nimCode: string;
  facultyName: string;
  lastSequence: number;
}

const DEFAULT_PRODI_LIST: CustomProdiFormat[] = [
  {
    id: 'prodi-1',
    name: 'Teknik Informatika',
    degree: 'S1',
    diktiCode: '55201',
    nimCode: '115',
    facultyName: 'Fakultas Teknologi Informasi',
    lastSequence: 42,
  },
  {
    id: 'prodi-2',
    name: 'Sistem Informasi',
    degree: 'S1',
    diktiCode: '57201',
    nimCode: '116',
    facultyName: 'Fakultas Teknologi Informasi',
    lastSequence: 28,
  },
  {
    id: 'prodi-3',
    name: 'Teknik Elektro',
    degree: 'S1',
    diktiCode: '20201',
    nimCode: '111',
    facultyName: 'Fakultas Teknik Industri',
    lastSequence: 15,
  },
  {
    id: 'prodi-4',
    name: 'Teknik Mesin',
    degree: 'S1',
    diktiCode: '21201',
    nimCode: '112',
    facultyName: 'Fakultas Teknik Industri',
    lastSequence: 19,
  },
  {
    id: 'prodi-5',
    name: 'Teknik Industri',
    degree: 'S1',
    diktiCode: '24201',
    nimCode: '114',
    facultyName: 'Fakultas Teknik Industri',
    lastSequence: 22,
  },
  {
    id: 'prodi-6',
    name: 'Teknik Sipil',
    degree: 'S1',
    diktiCode: '22201',
    nimCode: '121',
    facultyName: 'Fakultas Teknik Sipil & Perencanaan',
    lastSequence: 34,
  },
  {
    id: 'prodi-7',
    name: 'Arsitektur',
    degree: 'S1',
    diktiCode: '23201',
    nimCode: '122',
    facultyName: 'Fakultas Teknik Sipil & Perencanaan',
    lastSequence: 11,
  },
];

export default function SettingFormatNimPage() {
  // Config state
  const [angkatanFormat, setAngkatanFormat] = useState<'2DIGIT' | '4DIGIT' | 'NONE'>('2DIGIT');
  const [institutionCode, setInstitutionCode] = useState<string>('27');
  const [useFacultyCode, setUseFacultyCode] = useState<boolean>(false);
  const [facultyCodeFormat, setFacultyCodeFormat] = useState<'2DIGIT' | '1DIGIT'>('2DIGIT');
  const [prodiCodeFormat, setProdiCodeFormat] = useState<'3DIGIT' | '2DIGIT' | 'DIKTI'>('3DIGIT');
  const [useJalurCode, setUseJalurCode] = useState<boolean>(true);
  const [sequenceLength, setSequenceLength] = useState<number>(4);
  const [delimiter, setDelimiter] = useState<string>(''); // '', '.', '-'
  const [customPatternInput, setCustomPatternInput] = useState<string>(
    '{INSTITUSI}{ANGKATAN_2DIGIT}{KODE_PRODI}{KODE_JALUR}{NO_URUT_4DIGIT}'
  );
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false);

  // Prodi Table State
  const [prodiList, setProdiList] = useState<CustomProdiFormat[]>(DEFAULT_PRODI_LIST);
  const [searchProdi, setSearchProdi] = useState<string>('');
  const [editingProdiId, setEditingProdiId] = useState<string | null>(null);
  const [tempNimCode, setTempNimCode] = useState<string>('');

  // Simulation State
  const [simYear, setSimYear] = useState<number>(2026);
  const [simProdiId, setSimProdiId] = useState<string>('prodi-1');
  const [simJalurCode, setSimJalurCode] = useState<string>('1');
  const [simSequence, setSimSequence] = useState<number>(1);
  const [copiedNim, setCopiedNim] = useState<boolean>(false);

  // Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load persisted config
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedConfig = localStorage.getItem('siakad_format_nim_config');
        if (savedConfig) {
          const parsed = JSON.parse(savedConfig);
          if (parsed.angkatanFormat) setAngkatanFormat(parsed.angkatanFormat);
          if (parsed.institutionCode !== undefined) setInstitutionCode(parsed.institutionCode);
          if (parsed.useFacultyCode !== undefined) setUseFacultyCode(parsed.useFacultyCode);
          if (parsed.facultyCodeFormat) setFacultyCodeFormat(parsed.facultyCodeFormat);
          if (parsed.prodiCodeFormat) setProdiCodeFormat(parsed.prodiCodeFormat);
          if (parsed.useJalurCode !== undefined) setUseJalurCode(parsed.useJalurCode);
          if (parsed.sequenceLength) setSequenceLength(parsed.sequenceLength);
          if (parsed.delimiter !== undefined) setDelimiter(parsed.delimiter);
          if (parsed.customPatternInput) setCustomPatternInput(parsed.customPatternInput);
          if (parsed.isAdvancedMode !== undefined) setIsAdvancedMode(parsed.isAdvancedMode);
        }

        const savedProdi = localStorage.getItem('siakad_prodi_nim_codes');
        if (savedProdi) {
          setProdiList(JSON.parse(savedProdi));
        }
      } catch (e) {
        console.error('Failed to parse NIM format config:', e);
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper to build NIM
  const generateSampleNim = (
    year: number,
    prodiId: string,
    jalurCode: string,
    seq: number
  ) => {
    const selectedProdi = prodiList.find((p) => p.id === prodiId) || prodiList[0];

    if (isAdvancedMode && customPatternInput.trim()) {
      const yearFull = String(year);
      const yearShort = yearFull.slice(-2);
      const seqPadded = String(seq).padStart(sequenceLength, '0');
      const prodiCodeVal =
        prodiCodeFormat === 'DIKTI' ? selectedProdi.diktiCode : selectedProdi.nimCode;
      const facultyCodeVal = '01';

      return customPatternInput
        .replace('{INSTITUSI}', institutionCode)
        .replace('{ANGKATAN_4DIGIT}', yearFull)
        .replace('{ANGKATAN_2DIGIT}', yearShort)
        .replace('{KODE_FAKULTAS}', facultyCodeVal)
        .replace('{KODE_PRODI}', prodiCodeVal)
        .replace('{KODE_JALUR}', jalurCode)
        .replace(/{NO_URUT_\dDIGIT}/g, seqPadded);
    }

    const parts: string[] = [];

    if (institutionCode.trim()) {
      parts.push(institutionCode.trim());
    }

    if (angkatanFormat === '2DIGIT') {
      parts.push(String(year).slice(-2));
    } else if (angkatanFormat === '4DIGIT') {
      parts.push(String(year));
    }

    if (useFacultyCode) {
      parts.push(facultyCodeFormat === '2DIGIT' ? '01' : '1');
    }

    if (prodiCodeFormat === 'DIKTI') {
      parts.push(selectedProdi.diktiCode);
    } else if (prodiCodeFormat === '2DIGIT') {
      parts.push(selectedProdi.nimCode.slice(-2));
    } else {
      parts.push(selectedProdi.nimCode);
    }

    if (useJalurCode) {
      parts.push(jalurCode);
    }

    const seqStr = String(seq).padStart(sequenceLength, '0');
    parts.push(seqStr);

    return parts.join(delimiter);
  };

  const sampleOutput = generateSampleNim(
    simYear,
    simProdiId,
    simJalurCode,
    simSequence
  );

  const handleSaveConfig = async () => {
    const configData = {
      angkatanFormat,
      institutionCode,
      useFacultyCode,
      facultyCodeFormat,
      prodiCodeFormat,
      useJalurCode,
      sequenceLength,
      delimiter,
      customPatternInput,
      isAdvancedMode,
      samplePattern: sampleOutput,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('siakad_format_nim_config', JSON.stringify(configData));
      localStorage.setItem('siakad_prodi_nim_codes', JSON.stringify(prodiList));
    }

    try {
      const apiBase = getApiBaseUrl();
      await fetch(`${apiBase}/landing-page`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nimFormat: sampleOutput,
        }),
      });
    } catch (e) {
      console.warn('Backend API update notice:', e);
    }

    showToast('Format NIM berhasil disimpan ke Database Sistem!');
  };

  const handleApplyPreset = (presetType: 'STANDAR' | 'DIKTI' | 'RINGKAS' | 'STRIP') => {
    if (presetType === 'STANDAR') {
      setAngkatanFormat('2DIGIT');
      setInstitutionCode('27');
      setUseFacultyCode(false);
      setProdiCodeFormat('3DIGIT');
      setUseJalurCode(true);
      setSequenceLength(4);
      setDelimiter('');
      setIsAdvancedMode(false);
      showToast('Preset Standar Kampus diterapkan');
    } else if (presetType === 'DIKTI') {
      setAngkatanFormat('4DIGIT');
      setInstitutionCode('');
      setUseFacultyCode(true);
      setFacultyCodeFormat('2DIGIT');
      setProdiCodeFormat('DIKTI');
      setUseJalurCode(true);
      setSequenceLength(4);
      setDelimiter('.');
      setIsAdvancedMode(false);
      showToast('Preset Format PDDIKTI diterapkan');
    } else if (presetType === 'RINGKAS') {
      setAngkatanFormat('2DIGIT');
      setInstitutionCode('');
      setUseFacultyCode(false);
      setProdiCodeFormat('2DIGIT');
      setUseJalurCode(false);
      setSequenceLength(3);
      setDelimiter('');
      setIsAdvancedMode(false);
      showToast('Preset Format Ringkas 7-Digit diterapkan');
    } else if (presetType === 'STRIP') {
      setAngkatanFormat('2DIGIT');
      setInstitutionCode('27');
      setUseFacultyCode(false);
      setProdiCodeFormat('3DIGIT');
      setUseJalurCode(true);
      setSequenceLength(4);
      setDelimiter('-');
      setIsAdvancedMode(false);
      showToast('Preset Pemisah Strip (-) diterapkan');
    }
  };

  const handleCopyNim = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(sampleOutput);
      setCopiedNim(true);
      setTimeout(() => setCopiedNim(false), 2000);
    }
  };

  const handleSaveProdiNimCode = (id: string) => {
    if (!tempNimCode.trim()) return;
    setProdiList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, nimCode: tempNimCode.trim() } : p))
    );
    setEditingProdiId(null);
    setTempNimCode('');
    showToast('Kode NIM Program Studi berhasil diperbarui!');
  };

  const handleResetCounter = (id: string, name: string) => {
    setProdiList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, lastSequence: 0 } : p))
    );
    showToast(`Counter nomor urut untuk ${name} telah direset ke 0!`);
  };

  const filteredProdi = prodiList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProdi.toLowerCase()) ||
      p.diktiCode.includes(searchProdi) ||
      p.nimCode.includes(searchProdi)
  );

  const selectedProdiObj = prodiList.find((p) => p.id === simProdiId) || prodiList[0];

  return (
    <PortalLayout
      role="superadmin"
      userName="Bambang Pratama, S.Kom., M.Cs."
      userIdText="Super Administrator & Pengelola Sistem"
      activeMenuHref="/admin/superadmin/format-nim"
    >
      <div className="w-full space-y-6 pb-12">
        {/* Header Title Section (Clean, Professional, No Badges) */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 sm:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <Hash className="w-6 h-6 text-[#1E3A8A]" />
              Setting Format NIM (Nomor Induk Mahasiswa)
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Pengaturan generator otomatis Nomor Induk Mahasiswa untuk registrasi PMB dan sistem akademik.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleApplyPreset('STANDAR')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset Default</span>
            </button>
            <button
              onClick={handleSaveConfig}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 transition-all shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Save className="w-4 h-4 text-[#D4A017]" />
              <span>Simpan Format NIM</span>
            </button>
          </div>
        </div>

        {/* Realtime Output Card (Clean Dark Card) */}
        <div className="bg-[#0F172A] rounded-2xl p-6 text-white shadow-md border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <p className="text-xs text-slate-400 font-medium">Contoh Output Hasil Generator NIM:</p>
            <div className="flex items-center gap-3">
              <div className="bg-slate-900 border border-slate-700 px-5 py-2.5 rounded-xl font-mono text-2xl sm:text-3xl font-bold text-amber-400 tracking-wider shadow-inner">
                {sampleOutput}
              </div>
              <button
                onClick={handleCopyNim}
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer border border-slate-700"
                title="Salin Contoh NIM"
              >
                {copiedNim ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 pt-0.5">
              Panjang: <span className="text-slate-200 font-mono font-semibold">{sampleOutput.length} Karakter</span> &bull; Status: <span className="text-emerald-400 font-medium">Valid & Terstruktur</span>
            </p>
          </div>

          {/* Clean Breakdown Summary Text */}
          <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 max-w-md w-full space-y-1.5 text-xs">
            <p className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Struktur Pembentukan NIM saat ini:</p>
            <p className="text-slate-300 font-mono leading-relaxed">
              {institutionCode && <span>Kode Kampus: <strong>{institutionCode}</strong> &bull; </span>}
              {angkatanFormat !== 'NONE' && <span>Angkatan: <strong>{angkatanFormat === '2DIGIT' ? String(simYear).slice(-2) : simYear}</strong> &bull; </span>}
              {useFacultyCode && <span>Fakultas: <strong>01</strong> &bull; </span>}
              <span>Prodi ({selectedProdiObj.name}): <strong>{selectedProdiObj.nimCode}</strong> &bull; </span>
              {useJalurCode && <span>Jalur: <strong>{simJalurCode}</strong> &bull; </span>}
              <span>Urutan: <strong>{String(simSequence).padStart(sequenceLength, '0')}</strong></span>
            </p>
          </div>
        </div>

        {/* Clean Presets Selector Cards */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Preset Format Umum:</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => handleApplyPreset('STANDAR')}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-[#1E3A8A] text-left transition-all cursor-pointer shadow-xs hover:shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#1E3A8A] transition-colors">
                  Standar Kampus (10-Digit)
                </h3>
                <Zap className="w-4 h-4 text-slate-400 group-hover:text-[#1E3A8A]" />
              </div>
              <p className="text-xs font-mono text-slate-600 mt-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                27 + 26 + 115 + 1 + 0001
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('DIKTI')}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-[#1E3A8A] text-left transition-all cursor-pointer shadow-xs hover:shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#1E3A8A] transition-colors">
                  Format PDDIKTI Titik (.)
                </h3>
                <Zap className="w-4 h-4 text-slate-400 group-hover:text-[#1E3A8A]" />
              </div>
              <p className="text-xs font-mono text-slate-600 mt-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                2026.01.55201.1.0001
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('RINGKAS')}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-[#1E3A8A] text-left transition-all cursor-pointer shadow-xs hover:shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#1E3A8A] transition-colors">
                  Format Ringkas 7-Digit
                </h3>
                <Zap className="w-4 h-4 text-slate-400 group-hover:text-[#1E3A8A]" />
              </div>
              <p className="text-xs font-mono text-slate-600 mt-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                26 + 15 + 001
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleApplyPreset('STRIP')}
              className="bg-white p-4 rounded-xl border border-slate-200 hover:border-[#1E3A8A] text-left transition-all cursor-pointer shadow-xs hover:shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm group-hover:text-[#1E3A8A] transition-colors">
                  Pemisah Strip (-)
                </h3>
                <Zap className="w-4 h-4 text-slate-400 group-hover:text-[#1E3A8A]" />
              </div>
              <p className="text-xs font-mono text-slate-600 mt-1.5 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                27-26-115-1-0001
              </p>
            </button>
          </div>
        </div>

        {/* Builder Options & Simulation Sandbox */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form Builder (2 Cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Sliders className="w-5 h-5 text-[#1E3A8A]" />
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Konfigurasi Aturan Generator NIM</h2>
                  <p className="text-xs text-slate-500">Pilih komponen yang disertakan dalam Nomor Induk Mahasiswa</p>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2.5 py-1">
                <span className="text-xs font-semibold text-slate-600">Mode Formula</span>
                <button
                  onClick={() => setIsAdvancedMode((v) => !v)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                    isAdvancedMode ? 'bg-[#1E3A8A]' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform mt-0.5 ${
                      isAdvancedMode ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {!isAdvancedMode ? (
                <>
                  {/* 1. Kode Institusi & Tahun Angkatan */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-[#1E3A8A]" /> Prefix / Kode Institusi
                      </label>
                      <input
                        type="text"
                        value={institutionCode}
                        onChange={(e) => setInstitutionCode(e.target.value)}
                        placeholder="Contoh: 27 (atau kosongkan)"
                        className="w-full text-sm font-mono border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-[#1E3A8A]"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Kode identitas awal di depan NIM (opsional).</p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#1E3A8A]" /> Format Tahun Angkatan
                      </label>
                      <select
                        value={angkatanFormat}
                        onChange={(e) => setAngkatanFormat(e.target.value as any)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-[#1E3A8A] bg-white"
                      >
                        <option value="2DIGIT">2 Digit Terakhir Tahun (Contoh: 26)</option>
                        <option value="4DIGIT">4 Digit Lengkap Tahun (Contoh: 2026)</option>
                        <option value="NONE">Tidak Menggunakan Tahun</option>
                      </select>
                      <p className="text-[11px] text-slate-400 mt-1">Format tahun registrasi mahasiswa baru.</p>
                    </div>
                  </div>

                  {/* 2. Kode Fakultas & Prodi */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-slate-700" /> Sertakan Kode Fakultas
                        </label>
                        <input
                          type="checkbox"
                          checked={useFacultyCode}
                          onChange={(e) => setUseFacultyCode(e.target.checked)}
                          className="w-4 h-4 accent-[#1E3A8A] rounded cursor-pointer"
                        />
                      </div>
                      <select
                        disabled={!useFacultyCode}
                        value={facultyCodeFormat}
                        onChange={(e) => setFacultyCodeFormat(e.target.value as any)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-[#1E3A8A] bg-white disabled:bg-slate-100 disabled:text-slate-400"
                      >
                        <option value="2DIGIT">2 Digit Kode Fakultas (01, 02, dst)</option>
                        <option value="1DIGIT">1 Digit Kode Fakultas (1, 2, dst)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-700" /> Format Kode Program Studi
                      </label>
                      <select
                        value={prodiCodeFormat}
                        onChange={(e) => setProdiCodeFormat(e.target.value as any)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-[#1E3A8A] bg-white"
                      >
                        <option value="3DIGIT">3 Digit Internal (Contoh: 115 Teknik Informatika)</option>
                        <option value="2DIGIT">2 Digit Ringkas (Contoh: 15 / 50)</option>
                        <option value="DIKTI">Kode Asli PDDIKTI (Contoh: 55201)</option>
                      </select>
                    </div>
                  </div>

                  {/* 3. Jalur Masuk & Digit Nomor Urut */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                          <ListOrdered className="w-3.5 h-3.5 text-slate-700" /> Sertakan Kode Jalur PMB
                        </label>
                        <input
                          type="checkbox"
                          checked={useJalurCode}
                          onChange={(e) => setUseJalurCode(e.target.checked)}
                          className="w-4 h-4 accent-[#1E3A8A] rounded cursor-pointer"
                        />
                      </div>
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        1 = Reguler, 2 = Beasiswa, 3 = Transfer, 4 = Internasional
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Digit Nomor Urut (Auto Increment)
                      </label>
                      <select
                        value={sequenceLength}
                        onChange={(e) => setSequenceLength(Number(e.target.value))}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-[#1E3A8A] bg-white font-mono"
                      >
                        <option value={3}>3 Digit (001 - 999)</option>
                        <option value={4}>4 Digit (0001 - 9999)</option>
                        <option value={5}>5 Digit (00001 - 99999)</option>
                      </select>
                    </div>
                  </div>

                  {/* 4. Delimiter */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">
                      Karakter Pemisah (Delimiter)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {[
                        { label: 'Tanpa Pemisah (Polos)', val: '' },
                        { label: 'Titik (.)', val: '.' },
                        { label: 'Strip (-)', val: '-' },
                        { label: 'Garis Miring (/)', val: '/' },
                      ].map((item) => (
                        <button
                          key={item.val}
                          type="button"
                          onClick={() => setDelimiter(item.val)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            delimiter === item.val
                              ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                /* Advanced Mode */
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3 text-slate-700 text-xs">
                    <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Mode Pengaturan Custom Formula Active</p>
                      <p className="mt-0.5 text-slate-500">
                        Tuliskan kombinasi tag variabel langsung sesuai kebutuhan standar universitas.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Formula Custom String
                    </label>
                    <input
                      type="text"
                      value={customPatternInput}
                      onChange={(e) => setCustomPatternInput(e.target.value)}
                      className="w-full text-sm font-mono border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-[#1E3A8A] bg-slate-900 text-amber-300 font-bold"
                    />
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-700 mb-2">Tag Variabel yang Tersedia:</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
                      <code className="bg-slate-100 p-2 rounded border text-slate-700">{`{INSTITUSI}`}</code>
                      <code className="bg-slate-100 p-2 rounded border text-slate-700">{`{ANGKATAN_2DIGIT}`}</code>
                      <code className="bg-slate-100 p-2 rounded border text-slate-700">{`{ANGKATAN_4DIGIT}`}</code>
                      <code className="bg-slate-100 p-2 rounded border text-slate-700">{`{KODE_FAKULTAS}`}</code>
                      <code className="bg-slate-100 p-2 rounded border text-slate-700">{`{KODE_PRODI}`}</code>
                      <code className="bg-slate-100 p-2 rounded border text-slate-700">{`{KODE_JALUR}`}</code>
                      <code className="bg-slate-100 p-2 rounded border text-slate-700">{`{NO_URUT_4DIGIT}`}</code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Simulation Box (1 Col) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between">
            <div>
              <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-slate-700" />
                <h2 className="font-bold text-slate-900 text-base">Uji Simulator NIM</h2>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tahun Angkatan PMB</label>
                  <input
                    type="number"
                    value={simYear}
                    onChange={(e) => setSimYear(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Pilih Program Studi</label>
                  <select
                    value={simProdiId}
                    onChange={(e) => setSimProdiId(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800 font-semibold"
                  >
                    {prodiList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.degree}) - Kode {p.nimCode}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Jalur Pendaftaran PMB</label>
                  <select
                    value={simJalurCode}
                    onChange={(e) => setSimJalurCode(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 bg-white text-slate-800 font-semibold"
                  >
                    <option value="1">1 - Reguler / Mandiri</option>
                    <option value="2">2 - Beasiswa Unggulan</option>
                    <option value="3">3 - Transfer / Alih Jenjang</option>
                    <option value="4">4 - Kelas Internasional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nomor Urut Pendaftaran</label>
                  <input
                    type="number"
                    value={simSequence}
                    onChange={(e) => setSimSequence(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-2">
              <p className="text-xs text-slate-500 font-medium">Hasil Output Formatter:</p>
              <div className="p-3 bg-white rounded-xl border border-slate-200 text-center font-mono font-bold text-lg text-slate-900 tracking-wider">
                {sampleOutput}
              </div>
            </div>
          </div>
        </div>

        {/* Master Data Kode NIM per Program Studi */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-[#1E3A8A]" /> Master Kode NIM & Counter Nomor Urut per Program Studi
              </h2>
              <p className="text-xs text-slate-500">
                Kelola kode internal NIM tiap prodi dan pantau nomor urut pendaftaran mahasiswa terakhir.
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari program studi..."
                value={searchProdi}
                onChange={(e) => setSearchProdi(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Nama Program Studi</th>
                  <th className="py-3 px-4">Fakultas</th>
                  <th className="py-3 px-4 text-center">Kode Dikti</th>
                  <th className="py-3 px-4 text-center">Kode Internal NIM</th>
                  <th className="py-3 px-4 text-center">No Urut Terakhir</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProdi.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {p.name} <span className="text-[11px] font-normal text-slate-500">({p.degree})</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{p.facultyName}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-700">
                      {p.diktiCode}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {editingProdiId === p.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="text"
                            value={tempNimCode}
                            onChange={(e) => setTempNimCode(e.target.value)}
                            className="w-16 font-mono text-center border border-blue-500 rounded py-0.5 text-xs font-bold"
                          />
                          <button
                            onClick={() => handleSaveProdiNimCode(p.id)}
                            className="p-1 bg-emerald-600 text-white rounded hover:bg-emerald-700"
                            title="Simpan"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono font-bold text-[#1E3A8A]">
                          {p.nimCode}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-semibold text-slate-800">
                      {String(p.lastSequence).padStart(sequenceLength, '0')}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingProdiId(p.id);
                          setTempNimCode(p.nimCode);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                        title="Edit Kode NIM"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Kode</span>
                      </button>
                      <button
                        onClick={() => handleResetCounter(p.id, p.name)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1 text-xs font-semibold"
                        title="Reset Nomor Urut Ke 0"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reset Counter</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-blue-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{toastMessage}</span>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
