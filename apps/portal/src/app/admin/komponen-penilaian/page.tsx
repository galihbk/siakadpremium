'use client';

import React, { useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import { confirmDialog } from '@/components/ui/ConfirmHost';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';
import { Plus, Pencil, Trash2, Lock, Copy, ListChecks, Info, X, RefreshCw } from 'lucide-react';

interface SchemeComponent {
  id?: string;
  name: string;
  source: 'MANUAL' | 'ATTENDANCE';
}

interface Scheme {
  id: string;
  name: string;
  notes: string | null;
  effectiveFromYearId: string;
  effectiveFromLabel: string;
  replacedByLabel: string | null;
  isLocked: boolean;
  status: 'BERLAKU' | 'AKAN_DATANG' | 'DIGANTIKAN';
  components: Array<{ id: string; code: string; name: string; source: 'MANUAL' | 'ATTENDANCE' }>;
}

interface YearOption {
  id: string;
  label: string;
}

const STATUS_STYLE: Record<Scheme['status'], { label: string; cls: string }> = {
  BERLAKU: { label: 'Berlaku sekarang', cls: 'bg-emerald-100 text-emerald-700' },
  AKAN_DATANG: { label: 'Akan berlaku', cls: 'bg-blue-100 text-blue-700' },
  DIGANTIKAN: { label: 'Sudah digantikan', cls: 'bg-slate-100 text-slate-600' },
};

/** Susunan bawaan sistem selama ini: kehadiran otomatis + tugas + UTS + UAS. */
const DEFAULT_COMPONENTS: SchemeComponent[] = [
  { name: 'Kehadiran', source: 'ATTENDANCE' },
  { name: 'Tugas', source: 'MANUAL' },
  { name: 'UTS', source: 'MANUAL' },
  { name: 'UAS', source: 'MANUAL' },
];

const inputCls =
  'w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] outline-hidden';

function authHeaders(): Record<string, string> {
  const { token } = getAuthSession();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function KomponenPenilaianPage() {
  const apiBase = getApiBaseUrl();
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [years, setYears] = useState<YearOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ text: string; ok: boolean } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<{ name: string; effectiveFromYearId: string; notes: string; components: SchemeComponent[] }>({
    name: '',
    effectiveFromYearId: '',
    notes: '',
    components: DEFAULT_COMPONENTS,
  });

  const showToast = (text: string, ok = true) => {
    setToast({ text, ok });
    setTimeout(() => setToast(null), 4500);
  };

  const load = async () => {
    setLoading(true);
    try {
      const [sRes, yRes] = await Promise.all([
        fetch(`${apiBase}/academic/assessment-schemes`, { cache: 'no-store', headers: authHeaders() }),
        fetch(`${apiBase}/academic/years`, { cache: 'no-store', headers: authHeaders() }),
      ]);
      if (sRes.ok) {
        const j = await sRes.json();
        const list = j?.data ?? j;
        if (Array.isArray(list)) setSchemes(list);
      }
      if (yRes.ok) {
        const j = await yRes.json();
        const list = j?.data ?? j;
        if (Array.isArray(list)) {
          setYears(list.map((y: any) => ({ id: y.id, label: `${y.name} ${y.semesterLabel || ''}`.trim() })));
        }
      }
    } catch {
      showToast('Gagal memuat data dari server.', false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreate = (base?: Scheme) => {
    setEditingId(null);
    setFormError(null);
    setForm({
      name: base ? `${base.name} (versi baru)` : '',
      effectiveFromYearId: '',
      notes: '',
      components: base ? base.components.map((c) => ({ name: c.name, source: c.source })) : DEFAULT_COMPONENTS,
    });
    setModalOpen(true);
  };

  const openEdit = (s: Scheme) => {
    setEditingId(s.id);
    setFormError(null);
    setForm({
      name: s.name,
      effectiveFromYearId: s.effectiveFromYearId,
      notes: s.notes || '',
      components: s.components.map((c) => ({ name: c.name, source: c.source })),
    });
    setModalOpen(true);
  };

  const setComponent = (i: number, patch: Partial<SchemeComponent>) =>
    setForm((f) => ({ ...f, components: f.components.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.name.trim()) return setFormError('Nama skema wajib diisi.');
    if (!form.effectiveFromYearId) return setFormError('Pilih tahun akademik dan semester mulai berlaku.');
    if (form.components.length === 0 || form.components.some((c) => !c.name.trim())) return setFormError('Isi nama semua komponen (minimal satu).');

    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/academic/assessment-schemes${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({
          name: form.name,
          effectiveFromYearId: form.effectiveFromYearId,
          notes: form.notes,
          components: form.components.map((c) => ({ name: c.name, source: c.source })),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(Array.isArray(json?.message) ? json.message.join(', ') : json?.message || 'Gagal menyimpan skema.');
      setModalOpen(false);
      showToast(editingId ? 'Skema penilaian diperbarui.' : 'Skema penilaian dibuat.');
      await load();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan skema.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: Scheme) => {
    if (!(await confirmDialog(`Hapus skema "${s.name}"?`))) return;
    try {
      const res = await fetch(`${apiBase}/academic/assessment-schemes/${s.id}`, { method: 'DELETE', headers: authHeaders() });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.message || 'Gagal menghapus skema.');
      showToast('Skema dihapus.');
      await load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gagal menghapus skema.', false);
    }
  };

  return (
    <PortalLayout role="admin" userName="Admin BAAK" userIdText="Biro Administrasi Akademik & Kemahasiswaan" activeMenuHref="/admin/komponen-penilaian">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
              <ListChecks className="w-3.5 h-3.5" /> Penilaian
            </span>
            <h1 className="text-xl sm:text-2xl font-black">Komponen Penilaian</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl">
              Tentukan komponen penilaian yang dipakai seluruh kampus. Berlaku untuk semua dosen mulai semester yang Anda pilih, sampai Anda membuat skema yang lebih baru. Bobot tiap komponen diatur dosen pengampu di Kontrak Kuliah.
            </p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => void load()} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-semibold border border-white/20 disabled:opacity-60 cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Segarkan
            </button>
            <button onClick={() => openCreate()} className="flex items-center gap-2 px-4 py-2 bg-[#D4A017] hover:bg-[#C59114] text-slate-950 rounded-xl text-xs font-bold cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Buat Skema Baru
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p>
              <strong>Cara kerja:</strong> skema berlaku mulai tahun akademik dan semester yang dipilih, dan terus dipakai sampai ada skema yang lebih baru. Skema baru tidak mengubah nilai semester sebelumnya.
            </p>
            <p>
              Setelah dosen menginput nilai memakai sebuah skema, skema itu <strong>terkunci</strong>. Untuk mengubah komponen, buat skema baru yang berlaku mulai semester berikutnya.
            </p>
            <p>
              <strong>Bobot</strong> tiap komponen ditentukan <strong>dosen pengampu</strong> per kelas di menu Kontrak Kuliah. Di sini Anda hanya menentukan komponen apa saja yang boleh dipakai.
            </p>
            <p>Komponen bertanda <em>otomatis</em> diambil dari persentase kehadiran mahasiswa, bukan diinput dosen.</p>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-sm text-slate-500">Memuat skema penilaian...</div>
        ) : schemes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
            <p className="font-bold text-slate-800">Belum ada skema komponen penilaian</p>
            <p className="text-xs text-slate-500 max-w-lg mx-auto">
              Selama belum ada skema, nilai dihitung dengan cara bawaan: Kehadiran, Tugas, UTS, dan UAS dengan bobot dari Kontrak Kuliah tiap kelas. Buat skema untuk menyeragamkan komponen di seluruh kampus.
            </p>
            <button onClick={() => openCreate()} className="inline-flex items-center gap-2 px-4 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white rounded-xl text-xs font-bold cursor-pointer">
              <Plus className="w-3.5 h-3.5 text-[#D4A017]" /> Buat Skema Pertama
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {schemes.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
                <div className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  <div className="space-y-2 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-base font-black text-slate-900">{s.name}</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLE[s.status].cls}`}>{STATUS_STYLE[s.status].label}</span>
                      {s.isLocked && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Lock className="w-3 h-3" /> Terkunci (sudah dipakai input nilai)
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">
                      Berlaku mulai <strong className="text-slate-900">{s.effectiveFromLabel}</strong>
                      {s.replacedByLabel ? (
                        <>
                          {' '}
                          sampai sebelum <strong className="text-slate-900">{s.replacedByLabel}</strong>
                        </>
                      ) : (
                        ' dan seterusnya'
                      )}
                    </p>
                    {s.notes && <p className="text-xs text-slate-500">{s.notes}</p>}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {s.components.map((c) => (
                        <span key={c.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                          <span className="font-bold text-slate-800">{c.name}</span>
                          {c.source === 'ATTENDANCE' && <span className="text-[10px] text-slate-500 italic">otomatis</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button onClick={() => openCreate(s)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer">
                      <Copy className="w-3.5 h-3.5" /> Buat versi baru
                    </button>
                    {!s.isLocked && (
                      <>
                        <button onClick={() => openEdit(s)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#1E3A8A] border border-blue-200 bg-blue-50 rounded-xl hover:bg-blue-100 cursor-pointer">
                          <Pencil className="w-3.5 h-3.5" /> Ubah
                        </button>
                        <button onClick={() => remove(s)} className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 border border-rose-200 bg-rose-50 rounded-xl hover:bg-rose-100 cursor-pointer">
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingId ? 'Ubah Skema Penilaian' : 'Skema Penilaian Baru'} size="2xl">
          <form onSubmit={submit} className="space-y-4 text-xs">
            {formError && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 font-semibold">{formError}</div>}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Nama Skema *</label>
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Skema Penilaian 2026/2027" />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Berlaku Mulai *</label>
                <select className={`${inputCls} bg-white`} value={form.effectiveFromYearId} onChange={(e) => setForm({ ...form, effectiveFromYearId: e.target.value })}>
                  <option value="">-- Pilih tahun akademik & semester --</option>
                  {years.map((y) => (
                    <option key={y.id} value={y.id}>
                      {y.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1.5">Komponen Penilaian *</label>
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100">
                {form.components.map((c, i) => (
                  <div key={i} className="flex flex-wrap items-center gap-2 p-2.5">
                    <input
                      className={`${inputCls} flex-1 min-w-[10rem]`}
                      value={c.name}
                      onChange={(e) => setComponent(i, { name: e.target.value })}
                      placeholder="Nama komponen (mis. Quiz, Praktikum)"
                    />
                    <label className="inline-flex items-center gap-1.5 text-slate-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={c.source === 'ATTENDANCE'}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            components: f.components.map((x, idx) => ({
                              ...x,
                              // hanya satu komponen yang boleh otomatis dari kehadiran
                              source: idx === i ? (e.target.checked ? 'ATTENDANCE' : 'MANUAL') : e.target.checked ? 'MANUAL' : x.source,
                            })),
                          }))
                        }
                        className="accent-[#1E3A8A]"
                      />
                      Otomatis dari kehadiran
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, components: f.components.filter((_, idx) => idx !== i) }))}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                      title="Hapus komponen"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, components: [...f.components, { name: '', source: 'MANUAL' }] }))}
                disabled={form.components.length >= 12}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] border border-blue-200 rounded-lg hover:bg-blue-50 disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Tambah Komponen
              </button>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Catatan (opsional)</label>
              <input className={inputCls} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Mis. SK Rektor atau alasan perubahan" />
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
              <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
                Batal
              </button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-[#172554] rounded-xl disabled:opacity-60 cursor-pointer">
                {saving ? 'Menyimpan...' : 'Simpan Skema'}
              </button>
            </div>
          </form>
        </Modal>

        {toast && (
          <div className={`fixed bottom-6 right-6 z-[60] max-w-sm px-4 py-3 rounded-xl text-sm font-semibold shadow-lg text-white ${toast.ok ? 'bg-emerald-600' : 'bg-rose-600'}`}>{toast.text}</div>
        )}
      </div>
    </PortalLayout>
  );
}
