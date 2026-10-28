'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { confirmDialog } from '@/components/ui/ConfirmHost';
import { Modal } from '@/components/ui/Modal';
import { getApiBaseUrl } from '@/lib/api';
import { Info, Lightbulb, Lock, Pencil, Plus, RefreshCw, Trash2, Users } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  kind: 'TUGAS_AKHIR' | 'LAPANGAN';
  isSystem: boolean;
  needsSupervision: boolean;
  requiresRegistration: boolean;
  hasPartners: boolean;
  allowOwnPartner: boolean;
  feeComponentId: string | null;
  feeAmount: number;
  feeLabel: string | null;
  isGroup: boolean;
  minMembers: number;
  maxMembers: number;
  minLogbook: number;
  isActive: boolean;
  description: string | null;
  courseCount: number;
}

const emptyForm = {
  name: '',
  kind: 'LAPANGAN' as 'TUGAS_AKHIR' | 'LAPANGAN',
  needsSupervision: true,
  requiresRegistration: false,
  hasPartners: false,
  allowOwnPartner: true,
  feeOn: false,
  feeComponentId: '',
  isGroup: false,
  minMembers: 1,
  maxMembers: 1,
  minLogbook: 0,
  isActive: true,
  description: '',
};

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-300'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform`} style={{ transform: `translateX(${checked ? 18 : 2}px)` }} />
    </button>
  );
}

/** Tab Pengaturan Akademik: aturan jenis tugas akhir & kegiatan lapangan (master untuk kategori mata kuliah). */
export function JenisKegiatanPanel() {
  const apiBase = getApiBaseUrl();
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Category | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [feeComponents, setFeeComponents] = useState<{ id: string; code: string; name: string; defaultAmount: number }[]>([]);
  const [feeLoadError, setFeeLoadError] = useState(false);
  // Daftar komponen dimuat saat halaman dibuka dan tiap modal dibuka (komponen baru dari Keuangan langsung muncul)
  const loadFeeComponents = useCallback(() => {
    fetch(`${apiBase}/academic/course-categories/fee-components`, { cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        const rows = j?.data ?? j;
        if (!Array.isArray(rows)) throw new Error('Format tidak dikenal');
        setFeeComponents(rows);
        setFeeLoadError(false);
      })
      .catch(() => setFeeLoadError(true));
  }, [apiBase]);
  useEffect(() => {
    loadFeeComponents();
  }, [loadFeeComponents]);
  const [saving, setSaving] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/academic/course-categories`, { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      const rows = json?.data ?? json;
      if (Array.isArray(rows)) setItems(rows);
    } finally {
      setLoading(false);
    }
  }, [apiBase]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    loadFeeComponents();
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setOpen(true);
  };

  const openEdit = (c: Category) => {
    loadFeeComponents();
    setEditing(c);
    setForm({
      name: c.name,
      kind: c.kind,
      needsSupervision: c.needsSupervision,
      requiresRegistration: c.requiresRegistration,
      hasPartners: c.hasPartners,
      allowOwnPartner: c.allowOwnPartner,
      feeOn: Boolean(c.feeComponentId),
      feeComponentId: c.feeComponentId || '',
      isGroup: c.isGroup,
      minMembers: c.minMembers,
      maxMembers: c.maxMembers,
      minLogbook: c.minLogbook,
      isActive: c.isActive,
      description: c.description || '',
    });
    setError('');
    setOpen(true);
  };

  const save = async () => {
    setError('');
    if (form.feeOn && !form.feeComponentId) {
      setError('Pilih komponen biaya, atau matikan "Ada biaya khusus".');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/academic/course-categories${editing ? `/${editing.id}` : ''}`, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, feeComponentId: form.feeOn ? form.feeComponentId : null }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error((Array.isArray(json?.message) ? json.message.join(', ') : json?.message) || 'Gagal menyimpan.');
      setOpen(false);
      showToast(json?.message || 'Tersimpan.');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Category, v: boolean) => {
    const res = await fetch(`${apiBase}/academic/course-categories/${c.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: v }),
    });
    const json = await res.json().catch(() => null);
    if (!res.ok) showToast(json?.message || 'Gagal mengubah status.', 'error');
    load();
  };

  const remove = async (c: Category) => {
    if (!(await confirmDialog(`Hapus jenis "${c.name}"?`))) return;
    const res = await fetch(`${apiBase}/academic/course-categories/${c.id}`, { method: 'DELETE' });
    const json = await res.json().catch(() => null);
    if (!res.ok) return showToast(json?.message || 'Gagal menghapus.', 'error');
    showToast(json?.message || 'Terhapus.');
    load();
  };

  const field = 'w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white';

  const renderGroup = (title: string, rows: Category[]) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-subtle overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70">
        <h2 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[11px] uppercase text-slate-500 border-b border-slate-100">
              <th className="px-4 py-2.5">Jenis</th>
              <th className="px-3 py-2.5">Pendaftaran</th>
              <th className="px-3 py-2.5">Peserta</th>
              <th className="px-3 py-2.5">Min. Logbook</th>
              <th className="px-3 py-2.5">Mata Kuliah</th>
              <th className="px-3 py-2.5">Aktif</th>
              <th className="px-3 py-2.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                  Belum ada jenis.
                </td>
              </tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className={c.isActive ? '' : 'opacity-60'}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    {c.name}
                    {c.isSystem && <Lock className="w-3 h-3 text-amber-600" aria-label="Dipakai sistem Tugas Akhir" />}
                  </div>
                  {c.description && <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm">{c.description}</p>}
                </td>
                <td className="px-3 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.requiresRegistration ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {c.requiresRegistration ? 'Wajib mendaftar' : 'Langsung plotting'}
                  </span>
                  {c.feeAmount > 0 && (
                    <span className="block text-[10px] font-semibold text-amber-700 mt-1">
                      {c.feeLabel || `Biaya ${c.name}`}: Rp {Math.round(c.feeAmount).toLocaleString('id-ID')}
                    </span>
                  )}
                  {c.requiresRegistration && (
                    <span className="block text-[10px] text-slate-500 mt-1">
                      {c.hasPartners ? (c.allowOwnPartner ? 'Mitra: daftar + boleh mitra lain' : 'Mitra: hanya dari daftar') : 'Tempat diisi mahasiswa'}
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {c.isGroup ? (
                    <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                      <Users className="w-3.5 h-3.5" /> Kelompok {c.minMembers}-{c.maxMembers}
                    </span>
                  ) : (
                    <span className="text-slate-600">Individu</span>
                  )}
                </td>
                <td className="px-3 py-3 text-slate-700">{c.minLogbook > 0 ? `${c.minLogbook} entri` : '-'}</td>
                <td className="px-3 py-3 text-slate-700">{c.courseCount}</td>
                <td className="px-3 py-3">
                  <Toggle checked={c.isActive} onChange={(v) => toggleActive(c, v)} disabled={c.isSystem} />
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-500 hover:text-[#1E3A8A] hover:bg-slate-100 cursor-pointer" title="Ubah">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {!c.isSystem && (
                      <button onClick={() => remove(c)} className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 cursor-pointer" title="Hapus">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-600 max-w-2xl">
            Atur sekali aturan tiap jenis (Skripsi/TA, KKN, PLP, Kerja Praktik, Magang). Mata kuliah cukup memilih jenisnya, aturannya ikut otomatis.
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={load} className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer">
              <RefreshCw className="w-3.5 h-3.5" /> Segarkan
            </button>
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-blue-900 text-white text-xs font-bold rounded-xl cursor-pointer">
              <Plus className="w-3.5 h-3.5" /> Tambah Jenis
            </button>
          </div>
        </div>

        {toast && (
          <div className={`px-4 py-2.5 rounded-xl text-xs font-semibold border ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>{toast.msg}</div>
        )}

        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 flex items-start gap-2 text-xs text-slate-700">
          <Info className="w-4 h-4 text-[#1E3A8A] mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p>
              <b>Wajib mendaftar</b>: mahasiswa harus mendaftar dulu (tempat, periode, berkas) sebelum pembimbing ditetapkan. <b>Langsung plotting</b>: siapa pun yang mengambil mata kuliahnya langsung muncul di daftar Bimbingan Tugas Akhir untuk diplot pembimbingnya.
            </p>
            <p>
              <b>Kelompok</b>: pendaftaran dan logbook dilakukan per kelompok (ketua + anggota), sedangkan nilai tetap per mahasiswa. Jenis bergembok dipakai sistem Tugas Akhir sehingga namanya tidak dapat diubah atau dihapus. Mengubah nama jenis otomatis memperbarui mata kuliah yang memakainya.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-slate-500">Memuat...</p>
        ) : (
          <>
            {renderGroup('Tugas Akhir', items.filter((i) => i.kind === 'TUGAS_AKHIR'))}
            {renderGroup('Kegiatan Lapangan', items.filter((i) => i.kind === 'LAPANGAN'))}
          </>
        )}
      </div>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={editing ? `Ubah Jenis: ${editing.name}` : 'Tambah Jenis'}>
        <div className="space-y-4">
          {error && <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">{error}</p>}
          <button
            type="button"
            onClick={() => setShowTips(true)}
            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-[11px] font-bold text-amber-800 cursor-pointer"
          >
            <span className="inline-flex items-center gap-2">
              <Lightbulb className="w-4 h-4" /> Tips pengisian
            </span>
            <span>Lihat</span>
          </button>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama jenis</label>
            <input value={form.name} disabled={editing?.isSystem} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Magang Industri" className={`${field} disabled:bg-slate-50`} />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Menu</label>
            <select value={form.kind} disabled={editing?.isSystem} onChange={(e) => setForm({ ...form, kind: e.target.value as 'TUGAS_AKHIR' | 'LAPANGAN' })} className={`${field} disabled:bg-slate-50`}>
              <option value="LAPANGAN">Kegiatan Lapangan</option>
              <option value="TUGAS_AKHIR">Tugas Akhir</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200">
              <span>
                <span className="block text-xs font-semibold text-slate-700">Wajib mendaftar</span>
              </span>
              <Toggle checked={form.requiresRegistration} onChange={(v) => setForm({ ...form, requiresRegistration: v })} />
            </label>
            <label className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200">
              <span>
                <span className="block text-xs font-semibold text-slate-700">Berkelompok</span>
              </span>
              <Toggle checked={form.isGroup} onChange={(v) => setForm({ ...form, isGroup: v, minMembers: v ? Math.max(2, form.minMembers) : 1, maxMembers: v ? Math.max(2, form.maxMembers) : 1 })} />
            </label>
          </div>
          {form.kind === 'LAPANGAN' && (
            <div className="space-y-3">
              <label className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200">
                <span>
                  <span className="block text-xs font-semibold text-slate-700">Ada biaya khusus</span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">
                    {form.feeOn ? 'Mahasiswa harus lunas dulu sebelum diplot pembimbing atau dikelompokkan.' : 'Tanpa biaya tambahan di luar tagihan kuliah.'}
                  </span>
                </span>
                <Toggle checked={form.feeOn} onChange={(v) => setForm({ ...form, feeOn: v })} />
              </label>
              {form.feeOn && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Komponen biaya</label>
                  <select value={form.feeComponentId} onChange={(e) => setForm({ ...form, feeComponentId: e.target.value })} className={field}>
                    <option value="">Pilih komponen biaya...</option>
                    {/* komponen yang sedang dipakai tetap tampil walau sudah nonaktif di Keuangan */}
                    {editing?.feeComponentId && !feeComponents.some((c) => c.id === editing.feeComponentId) && (
                      <option value={editing.feeComponentId}>{editing.feeLabel} (nonaktif)</option>
                    )}
                    {feeComponents.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - Rp {Math.round(c.defaultAmount).toLocaleString('id-ID')}
                      </option>
                    ))}
                  </select>
                  {feeLoadError ? (
                    <p className="text-[11px] text-rose-700 mt-1">
                      Gagal memuat daftar komponen biaya dari server.{' '}
                      <button type="button" onClick={loadFeeComponents} className="font-bold underline cursor-pointer">
                        Coba lagi
                      </button>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-500 mt-1">
                      {feeComponents.length === 0
                        ? 'Belum ada komponen biaya sekali bayar. Minta Keuangan menambahkannya di Aturan Biaya Perkuliahan (kategori Sekali Bayar).'
                        : 'Tarif dan nama diatur Keuangan di Aturan Biaya Perkuliahan; perubahan tarif berlaku untuk tagihan baru.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          {form.requiresRegistration && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200">
                <span>
                  <span className="block text-xs font-semibold text-slate-700">Punya mitra</span>
                  <span className="block text-[11px] text-slate-500 mt-0.5">{form.hasPartners ? 'Akademik mengisi daftar mitra.' : 'Mahasiswa mengetik tempat sendiri.'}</span>
                </span>
                <Toggle checked={form.hasPartners} onChange={(v) => setForm({ ...form, hasPartners: v })} />
              </label>
              {form.hasPartners && (
                <label className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200">
                  <span>
                    <span className="block text-xs font-semibold text-slate-700">Boleh mitra lain</span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">{form.allowOwnPartner ? 'Mahasiswa boleh mengisi mitra di luar daftar.' : 'Mahasiswa hanya memilih dari daftar.'}</span>
                  </span>
                  <Toggle checked={form.allowOwnPartner} onChange={(v) => setForm({ ...form, allowOwnPartner: v })} />
                </label>
              )}
            </div>
          )}
          {form.isGroup && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Anggota minimal</label>
                <input type="number" min={1} value={form.minMembers} onChange={(e) => setForm({ ...form, minMembers: Number(e.target.value) })} className={field} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Anggota maksimal</label>
                <input type="number" min={2} value={form.maxMembers} onChange={(e) => setForm({ ...form, maxMembers: Number(e.target.value) })} className={field} />
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Minimal entri logbook</label>
              <input type="number" min={0} value={form.minLogbook} onChange={(e) => setForm({ ...form, minLogbook: Number(e.target.value) })} className={field} />
              <p className="text-[11px] text-slate-500 mt-1">0 = tanpa logbook.</p>
            </div>
            <label className="flex items-start justify-between gap-3 p-3 rounded-xl border border-slate-200 self-start">
              <span>
                <span className="block text-xs font-semibold text-slate-700">Masuk daftar bimbingan</span>
              </span>
              <Toggle checked={form.needsSupervision} disabled={editing?.isSystem} onChange={(v) => setForm({ ...form, needsSupervision: v })} />
            </label>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan (opsional)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={field} />
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer">
              Batal
            </button>
            <button onClick={save} disabled={saving} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 disabled:opacity-60 cursor-pointer">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showTips} onClose={() => setShowTips(false)} title="Tips Pengisian">
        <div className="space-y-4 text-xs text-slate-700">
          <dl className="space-y-3">
            {[
              ['Nama jenis', 'Muncul di pilihan kategori saat membuat mata kuliah. Gunakan nama singkat yang dikenal mahasiswa (PLP, KKN, Magang). Mengubah nama otomatis memperbarui mata kuliah yang memakainya.'],
              ['Menu', 'Menentukan jenis tampil di menu Tugas Akhir (skripsi, seminar proposal) atau Kegiatan Lapangan (PLP, KKN, KP, magang). Jenis baru umumnya masuk Kegiatan Lapangan.'],
              ['Wajib mendaftar', 'Aktif: mahasiswa mendaftar dulu (tempat, periode, berkas), baru pembimbing ditetapkan. Mati: siapa pun yang mengambil mata kuliahnya langsung diplot pembimbing oleh BAAK.'],
              ['Ada biaya khusus', 'Untuk kegiatan yang memungut biaya tambahan (pembekalan, akomodasi, dan sebagainya). Pilih komponen biaya dari master Keuangan (Aturan Biaya Perkuliahan, kategori Sekali Bayar); tarifnya diatur Keuangan. Tagihan terbit otomatis lewat modul Keuangan saat mahasiswa menyimpan KRS dengan mata kuliah jenis ini (tagihan terpisah dari UKT/SPP; dibatalkan bila belum dibayar dan mata kuliahnya dikeluarkan dari KRS). Mahasiswa baru bisa diplot pembimbing atau dikelompokkan setelah lunas. Mengubah tarif komponen tidak mengubah tagihan yang sudah terbit.'],
              ['Punya mitra', 'Hanya untuk jenis yang wajib mendaftar. Aktif: akademik mengisi daftar mitra di tab jenis ini, dan mahasiswa memilih mitra saat mendaftar. Mati: mahasiswa mengetik nama tempat sendiri.'],
              ['Boleh mitra lain', 'Muncul bila Punya mitra aktif. Aktif: mahasiswa boleh memilih dari daftar atau mengisi mitra lain yang mereka tuju. Mati: mahasiswa hanya boleh memilih mitra yang ada di daftar.'],
              ['Berkelompok', 'Aktif untuk kegiatan bersama (KKN, PLP): pendaftaran dan logbook per kelompok, nilai tetap per mahasiswa. Mati untuk kegiatan individu (KP, skripsi). Anggota minimal dan maksimal membatasi ukuran kelompok.'],
              ['Minimal entri logbook', '0 berarti tanpa logbook. Isi bila kegiatan wajib dicatat berkala, misalnya 12 untuk magang satu semester (satu entri per minggu).'],
              ['Masuk daftar bimbingan', 'Aktif: kelas otomatis tanpa jadwal tetap dan mahasiswanya muncul di Bimbingan Tugas Akhir. Matikan bila hanya penanda nilai (seperti Seminar Proposal).'],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="font-bold text-slate-900">{k}</dt>
                <dd className="text-slate-600 mt-0.5">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button onClick={() => setShowTips(false)} className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 cursor-pointer">
              Mengerti
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
