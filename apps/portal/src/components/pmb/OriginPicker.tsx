'use client';

import { useEffect, useRef, useState } from 'react';

interface UniversityOption {
  id: string; // kode perguruan tinggi (PDDIKTI) atau ID Feeder (cadangan)
  code?: string;
  name: string;
  source?: string;
}
interface ProgramOption {
  id: string;
  label: string;
  name: string;
  jenjang?: string;
  feederId?: string | null;
}

export interface OriginValues {
  originInstitution: string;
  originInstitutionCode: string;
  originInstitutionId: string;
  originStudyProgram: string;
  originStudyProgramLevel: string;
  originStudyProgramId: string;
}

const INPUT =
  'w-full px-3.5 py-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]';

/**
 * Pemilih perguruan tinggi dan program studi asal. Saran diambil dari referensi Neo Feeder lewat API,
 * sehingga nama yang dipilih pasti dikenali saat data dikirim ke Feeder. Bila tidak ada saran
 * (Feeder belum terhubung / tidak ketemu), teks yang diketik tetap dipakai.
 */
export function OriginPicker({
  apiBaseUrl,
  required,
  value,
  onChange,
}: {
  apiBaseUrl: string;
  required: boolean;
  value: OriginValues;
  onChange: (patch: Partial<OriginValues>) => void;
}) {
  const [ptOptions, setPtOptions] = useState<UniversityOption[]>([]);
  const [ptOpen, setPtOpen] = useState(false);
  const [prodiOptions, setProdiOptions] = useState<ProgramOption[]>([]);
  const [prodiOpen, setProdiOpen] = useState(false);
  const ptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prodiTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Daftar dari Feeder bisa tidak termuat (belum terhubung / lambat); pendaftar diberi tahu dan tetap bisa mengetik.
  const [unavailable, setUnavailable] = useState(false);
  const [searching, setSearching] = useState(false);

  const read = async (url: string) => {
    setSearching(true);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        setUnavailable(true);
        return [];
      }
      const json = await res.json();
      const payload = json?.data !== undefined ? json.data : json;
      setUnavailable(payload?.status !== undefined && payload.status !== 'OK');
      const list = Array.isArray(payload) ? payload : payload?.items;
      return Array.isArray(list) ? list : [];
    } catch {
      setUnavailable(true);
      return [];
    } finally {
      setSearching(false);
    }
  };

  const onPtText = (text: string) => {
    // Mengetik ulang membatalkan pilihan sebelumnya (perguruan tinggi dan prodi harus dipilih ulang)
    onChange({ originInstitution: text, originInstitutionCode: '', originInstitutionId: '', originStudyProgramId: '', originStudyProgramLevel: '' });
    if (ptTimer.current) clearTimeout(ptTimer.current);
    if (text.trim().length < 3) {
      setPtOptions([]);
      return;
    }
    ptTimer.current = setTimeout(async () => {
      setPtOptions(await read(`${apiBaseUrl}/admissions/pmb/origin-universities?search=${encodeURIComponent(text.trim())}`));
      setPtOpen(true);
    }, 350);
  };

  // Perguruan tinggi sudah dipilih dari saran bila kodenya atau ID Feeder-nya terisi
  const picked = !!(value.originInstitutionCode || value.originInstitutionId);

  const loadProdi = async (text: string) => {
    if (!picked) {
      setProdiOptions([]);
      return;
    }
    setProdiOptions(
      await read(
        `${apiBaseUrl}/admissions/pmb/origin-study-programs?universityId=${encodeURIComponent(value.originInstitutionId || value.originInstitutionCode)}&universityName=${encodeURIComponent(value.originInstitution)}&search=${encodeURIComponent(text.trim())}`,
      ),
    );
    setProdiOpen(true);
  };

  const onProdiText = (text: string) => {
    onChange({ originStudyProgram: text, originStudyProgramId: '', originStudyProgramLevel: '' });
    if (prodiTimer.current) clearTimeout(prodiTimer.current);
    prodiTimer.current = setTimeout(() => loadProdi(text), 350);
  };

  useEffect(
    () => () => {
      if (ptTimer.current) clearTimeout(ptTimer.current);
      if (prodiTimer.current) clearTimeout(prodiTimer.current);
    },
    [],
  );

  const star = required ? <span className="text-red-500">*</span> : null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="relative">
        <label className="block text-xs font-bold text-slate-700 mb-1">Nama Perguruan Tinggi Asal {star}</label>
        <input
          type="text"
          autoComplete="off"
          placeholder="Ketik nama perguruan tinggi (min. 3 huruf)..."
          value={value.originInstitution}
          onChange={(e) => onPtText(e.target.value)}
          onFocus={() => ptOptions.length > 0 && setPtOpen(true)}
          onBlur={() => setTimeout(() => setPtOpen(false), 150)}
          className={INPUT}
        />
        {ptOpen && ptOptions.length > 0 && (
          <div className="absolute z-30 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            {ptOptions.map((o) => (
              <button
                key={o.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  // ID berbentuk UUID berarti hasil cadangan dari Feeder; selain itu itu kode PT dari PDDIKTI
                  const fromFeeder = /^[0-9a-f-]{36}$/i.test(o.id);
                  onChange({
                    originInstitution: o.name,
                    originInstitutionCode: o.code || (fromFeeder ? '' : o.id),
                    originInstitutionId: fromFeeder ? o.id : '',
                    originStudyProgram: '',
                    originStudyProgramLevel: '',
                    originStudyProgramId: '',
                  });
                  setPtOpen(false);
                  setProdiOptions([]);
                }}
                className="block w-full text-left px-3.5 py-2 text-xs hover:bg-blue-50 cursor-pointer"
              >
                {o.name}
              </button>
            ))}
          </div>
        )}
        {searching && <span className="text-[11px] text-slate-500 mt-1 block">Mencari...</span>}
        {!searching && ptOptions.length === 0 && value.originInstitution.trim().length >= 3 && !picked && (
          <span className="text-[11px] text-slate-500 mt-1 block">
            {unavailable
              ? 'Daftar perguruan tinggi belum dapat dimuat saat ini. Ketik nama perguruan tinggi secara manual.'
              : 'Tidak ada di rekomendasi? Teks yang Anda ketik tetap dipakai.'}
          </span>
        )}
      </div>

      <div className="relative">
        <label className="block text-xs font-bold text-slate-700 mb-1">Program Studi Asal {star}</label>
        <input
          type="text"
          autoComplete="off"
          placeholder={picked ? 'Pilih atau ketik program studi...' : 'Ketik program studi'}
          value={value.originStudyProgram}
          onChange={(e) => onProdiText(e.target.value)}
          onFocus={() => (picked ? loadProdi(value.originStudyProgram) : undefined)}
          onBlur={() => setTimeout(() => setProdiOpen(false), 150)}
          className={INPUT}
        />
        {prodiOpen && prodiOptions.length > 0 && (
          <div className="absolute z-30 mt-1 w-full max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-lg">
            {prodiOptions.map((o) => (
              <button
                key={o.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange({ originStudyProgram: o.label, originStudyProgramLevel: o.jenjang || '', originStudyProgramId: o.feederId || '' });
                  setProdiOpen(false);
                }}
                className="block w-full text-left px-3.5 py-2 text-xs hover:bg-blue-50 cursor-pointer"
              >
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
