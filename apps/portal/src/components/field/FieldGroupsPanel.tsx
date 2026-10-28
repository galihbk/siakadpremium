'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { confirmDialog } from '@/components/ui/ConfirmHost';
import { getApiBaseUrl } from '@/lib/api';
import { FieldCategory, fieldFetch } from '@/lib/fieldActivity';
import { Check, CheckCircle2, AlertTriangle, Pencil, Plus, RefreshCw, Search, Trash2, UserCheck, Users, X } from 'lucide-react';

interface Member {
  studentId: string;
  nim: string;
  name: string;
  studyProgram: string;
}

interface Group {
  id: string;
  name: string;
  notes: string | null;
  supervisorId: string | null;
  supervisorName: string | null;
  members: Member[];
}

interface GroupList {
  academicYearName: string;
  totalStudents: number;
  ungrouped: number;
  items: Group[];
}

interface LecturerOption {
  id: string;
  nidn: string;
  fullName: string;
}

const inputCls =
  'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]';

/** Kelompok KKN/PLP dan sejenisnya: dibentuk akademik, satu pembimbing per kelompok. */
export function FieldGroupsPanel({ category }: { category: FieldCategory }) {
  const [data, setData] = useState<GroupList | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ ok: boolean; text: string } | null>(null);
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);

  const [editing, setEditing] = useState<Group | 'new' | null>(null);
  const [form, setForm] = useState({ name: '', supervisorId: '', notes: '' });
  const [selected, setSelected] = useState<Member[]>([]);
  const [available, setAvailable] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const notify = (ok: boolean, text: string) => {
    setToast({ ok, text });
    setTimeout(() => setToast((t) => (t?.text === text ? null : t)), 4500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fieldFetch<GroupList>(`/admin/groups?categoryId=${category.id}`));
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal memuat kelompok.');
    } finally {
      setLoading(false);
    }
  }, [category.id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetch(`${getApiBaseUrl()}/lecturers`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j && setLecturers(j.data || []))
      .catch(() => undefined);
  }, []);

  // daftar mahasiswa yang masih bebas (dimuat saat modal terbuka / pencarian berubah)
  useEffect(() => {
    if (!editing) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams({ categoryId: category.id });
      if (editing !== 'new') params.set('groupId', editing.id);
      if (search.trim()) params.set('search', search.trim());
      fieldFetch<{ items: Member[] }>(`/admin/groups/available-students?${params}`)
        .then((r) => setAvailable(r.items))
        .catch(() => setAvailable([]));
    }, 250);
    return () => clearTimeout(t);
  }, [editing, search, category.id]);

  const openNew = () => {
    setEditing('new');
    setForm({ name: `Kelompok ${(data?.items.length ?? 0) + 1}`, supervisorId: '', notes: '' });
    setSelected([]);
    setSearch('');
    setFormError(null);
  };

  const openEdit = (g: Group) => {
    setEditing(g);
    setForm({ name: g.name, supervisorId: g.supervisorId ?? '', notes: g.notes ?? '' });
    setSelected(g.members);
    setSearch('');
    setFormError(null);
  };

  const toggle = (m: Member) =>
    setSelected((cur) => (cur.some((x) => x.studentId === m.studentId) ? cur.filter((x) => x.studentId !== m.studentId) : [...cur, m]));

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setFormError(null);
    try {
      const body = { name: form.name, supervisorId: form.supervisorId || null, notes: form.notes, memberIds: selected.map((m) => m.studentId) };
      const r =
        editing === 'new'
          ? await fieldFetch<{ message: string }>('/admin/groups', { method: 'POST', body: { ...body, categoryId: category.id } })
          : await fieldFetch<{ message: string }>(`/admin/groups/${editing.id}`, { method: 'PUT', body });
      notify(true, r.message);
      setEditing(null);
      await load();
      window.dispatchEvent(new Event('siakad:thesis-updated'));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan kelompok.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (g: Group) => {
    const ok = await confirmDialog(`Hapus ${g.name}? Anggota kembali tanpa kelompok dan pembimbing kelompok dilepas dari semua anggotanya.`);
    if (!ok) return;
    try {
      const r = await fieldFetch<{ message: string }>(`/admin/groups/${g.id}`, { method: 'DELETE' });
      notify(true, r.message);
      await load();
      window.dispatchEvent(new Event('siakad:thesis-updated'));
    } catch (err) {
      notify(false, err instanceof Error ? err.message : 'Gagal menghapus kelompok.');
    }
  };

  const selectedIds = useMemo(() => new Set(selected.map((m) => m.studentId)), [selected]);
  const pool = useMemo(() => available.filter((m) => !selectedIds.has(m.studentId)), [available, selectedIds]);
  const count = selected.length;
  const countOk = count >= category.minMembers && count <= category.maxMembers;

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[60] px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-medium ${toast.ok ? 'bg-slate-900 text-white border-slate-700' : 'bg-rose-600 text-white border-rose-500'}`}>
          {toast.ok ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="max-w-sm">{toast.text}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl p-4 border border-slate-200 shadow-sm bg-blue-50 text-[#1E3A8A]">
          <p className="text-xs text-slate-500 mb-1">{category.requiresRegistration ? (category.feeAmount > 0 ? 'Disetujui & lunas' : 'Pendaftar disetujui') : category.feeAmount > 0 ? 'Sudah lunas' : `Mengambil MK ${category.name}`}</p>
          <p className="text-2xl font-black">{data?.totalStudents ?? 0}</p>
        </div>
        <div className="rounded-2xl p-4 border border-slate-200 shadow-sm bg-amber-50 text-amber-700">
          <p className="text-xs text-slate-500 mb-1">Belum Berkelompok</p>
          <p className="text-2xl font-black">{data?.ungrouped ?? 0}</p>
        </div>
        <div className="rounded-2xl p-4 border border-slate-200 shadow-sm bg-emerald-50 text-emerald-700">
          <p className="text-xs text-slate-500 mb-1">Jumlah Kelompok</p>
          <p className="text-2xl font-black">{data?.items.length ?? 0}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-600">
            Anggota ditentukan akademik, {category.minMembers}-{category.maxMembers} orang per kelompok, satu pembimbing untuk satu kelompok.
            {data?.academicYearName && <> &bull; Tahun akademik {data.academicYearName}</>}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Segarkan
            </button>
            <button onClick={openNew} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold rounded-xl cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Buat Kelompok
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Kelompok</th>
                <th className="px-4 py-3 text-left font-semibold">Anggota</th>
                <th className="px-4 py-3 text-left font-semibold">Pembimbing</th>
                <th className="px-4 py-3 text-center font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {!loading && (data?.items.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-10 text-center text-slate-400">
                    Belum ada kelompok {category.name}. Klik &quot;Buat Kelompok&quot; untuk memulai.
                  </td>
                </tr>
              )}
              {data?.items.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/70 align-top">
                  <td className="px-4 py-3">
                    <span className="font-bold text-slate-800 inline-flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> {g.name}
                    </span>
                    <span className="block text-[11px] text-slate-400">{g.members.length} anggota</span>
                  </td>
                  <td className="px-4 py-3">
                    <ul className="space-y-0.5">
                      {g.members.map((m) => (
                        <li key={m.studentId} className="text-slate-700">
                          {m.name} <span className="font-mono text-[11px] text-slate-400">{m.nim}</span>
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-4 py-3">
                    {g.supervisorName ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                        <UserCheck className="w-3.5 h-3.5" /> {g.supervisorName}
                      </span>
                    ) : (
                      <span className="text-amber-700 font-semibold">Belum ditetapkan</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <button onClick={() => openEdit(g)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-bold text-[11px] cursor-pointer">
                      <Pencil className="w-3 h-3" /> Ubah
                    </button>
                    <button onClick={() => remove(g)} className="ml-1.5 inline-flex items-center px-2 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer" aria-label="Hapus kelompok">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={!!editing}
        onClose={() => setEditing(null)}
        title={editing === 'new' ? `Buat Kelompok ${category.name}` : 'Ubah Kelompok'}
        subtitle={`Anggota ${category.minMembers}-${category.maxMembers} orang, satu pembimbing`}
        maxWidth="3xl"
      >
        <div className="space-y-4 text-xs">
          {formError && <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{formError}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama kelompok</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pembimbing</label>
              <SearchableSelect
                value={form.supervisorId}
                onChange={(id) => setForm({ ...form, supervisorId: id })}
                emptyLabel="Belum ditentukan"
                placeholder="Belum ditentukan"
                searchPlaceholder="Cari nama atau NIDN dosen..."
                options={lecturers.map((l) => ({ value: l.id, label: `${l.fullName} (NIDN: ${l.nidn})` }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <span className="font-bold text-slate-700">Anggota terpilih</span>
                <span className={`text-[11px] font-bold ${countOk ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {count} / {category.minMembers}-{category.maxMembers}
                </span>
              </div>
              <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {selected.length === 0 && <li className="px-3 py-6 text-center text-slate-400">Belum ada anggota.</li>}
                {selected.map((m) => (
                  <li key={m.studentId} className="px-3 py-2 flex items-center justify-between gap-2">
                    <span>
                      <span className="font-semibold text-slate-800 block">{m.name}</span>
                      <span className="font-mono text-[11px] text-slate-400">{m.nim} &bull; {m.studyProgram}</span>
                    </span>
                    <button onClick={() => toggle(m)} className="text-slate-400 hover:text-rose-600 cursor-pointer" aria-label="Keluarkan">
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-3 py-2 bg-slate-50 border-b border-slate-200">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={category.requiresRegistration || category.feeAmount > 0 ? 'Cari mahasiswa yang memenuhi syarat...' : 'Cari mahasiswa belum berkelompok...'} className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-hidden focus:border-[#1E3A8A]" />
                </div>
              </div>
              <ul className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {pool.length === 0 && <li className="px-3 py-6 text-center text-slate-400">Tidak ada mahasiswa yang tersedia.</li>}
                {pool.map((m) => (
                  <li key={m.studentId}>
                    <button
                      onClick={() => toggle(m)}
                      disabled={count >= category.maxMembers}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50/60 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer flex items-center justify-between gap-2"
                    >
                      <span>
                        <span className="font-semibold text-slate-800 block">{m.name}</span>
                        <span className="font-mono text-[11px] text-slate-400">{m.nim} &bull; {m.studyProgram}</span>
                      </span>
                      <Plus className="w-4 h-4 text-[#1E3A8A] shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Catatan (opsional)</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} placeholder="Contoh: lokasi desa/sekolah penempatan." />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
              Batal
            </button>
            <button type="button" onClick={save} disabled={busy || !countOk || !form.name.trim()} className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-800 disabled:opacity-50 cursor-pointer">
              <Check className="w-3.5 h-3.5" /> Simpan
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
