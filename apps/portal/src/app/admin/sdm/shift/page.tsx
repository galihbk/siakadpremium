'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { Modal } from '@/components/ui/Modal';
import { getApiBaseUrl } from '@/lib/api';
import { Plus, Pencil, Trash2, Clock, Star, Loader2 } from 'lucide-react';

interface ShiftItem {
  id: string;
  name: string;
  startPagi: string | null;
  toleransiPagi: number;
  startSore: string | null;
  toleransiSore: number;
  isDefault: boolean;
  totalPegawai: number;
}

const emptyForm = {
  name: '',
  startPagi: '07:00',
  toleransiPagi: 15,
  startSore: '15:00',
  toleransiSore: 15,
  isDefault: false,
};

export default function PengaturanShiftPage() {
  const [shifts, setShifts] = useState<ShiftItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ShiftItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBaseUrl()}/shifts`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setShifts(json.data ?? json ?? []);
    } catch (err) {
      console.error('Gagal memuat shift', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (s: ShiftItem) => {
    setEditing(s);
    setForm({
      name: s.name,
      startPagi: s.startPagi || '',
      toleransiPagi: s.toleransiPagi,
      startSore: s.startSore || '',
      toleransiSore: s.toleransiSore,
      isDefault: s.isDefault,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('Nama shift wajib diisi.');
      return;
    }
    setSaving(true);
    try {
      const url = editing ? `${getApiBaseUrl()}/shifts/${editing.id}` : `${getApiBaseUrl()}/shifts`;
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setModalOpen(false);
      await load();
    } catch (err) {
      console.error('Gagal menyimpan shift', err);
      alert('Gagal menyimpan shift. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s: ShiftItem) => {
    if (!confirm(`Hapus shift "${s.name}"? Pegawai yang memakai shift ini akan kembali ke shift default.`)) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/shifts/${s.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await load();
    } catch (err) {
      console.error('Gagal menghapus shift', err);
      alert('Gagal menghapus shift.');
    }
  };

  return (
    <PortalLayout role="sdm" userName="Dewi Lestari, S.Psi., M.M." userIdText="Kepala Biro SDM & Kepegawaian">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
              Kepegawaian
            </span>
            <h1 className="text-xl sm:text-2xl font-black">Pengaturan Shift</h1>
            <p className="text-xs sm:text-sm text-blue-200 mt-1">
              Template jam kerja untuk menentukan batas tepat waktu absen pagi & sore
            </p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 bg-white text-[#1E3A8A] rounded-xl text-xs font-bold hover:bg-blue-50 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Tambah Shift
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Nama Shift</th>
                  <th className="px-4 py-3 text-left font-semibold">Jam Masuk Pagi</th>
                  <th className="px-4 py-3 text-left font-semibold">Jam Masuk Sore</th>
                  <th className="px-4 py-3 text-center font-semibold">Pegawai</th>
                  <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    </td>
                  </tr>
                )}
                {!loading && shifts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                      Belum ada shift. Tambahkan template shift pertama.
                    </td>
                  </tr>
                )}
                {shifts.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5">
                        {s.name}
                        {s.isDefault && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            <Star className="w-2.5 h-2.5" /> Default
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.startPagi ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-500" /> {s.startPagi} (+{s.toleransiPagi} menit)
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {s.startSore ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-500" /> {s.startSore} (+{s.toleransiSore} menit)
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold">{s.totalPegawai}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit shift"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus shift"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500">
            Shift ditetapkan per pegawai di menu Data Pegawai. Pegawai tanpa shift otomatis memakai shift yang ditandai Default.
          </div>
        </div>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit Shift: ${editing.name}` : 'Tambah Shift Baru'}
        subtitle="Jam masuk dipakai sebagai batas tepat waktu absen pagi/sore"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nama Shift</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Contoh: Shift Pagi, Shift Normal"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jam Masuk Pagi</label>
              <input
                type="time"
                value={form.startPagi}
                onChange={(e) => setForm((f) => ({ ...f, startPagi: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Toleransi Telat (menit)</label>
              <input
                type="number"
                min={0}
                value={form.toleransiPagi}
                onChange={(e) => setForm((f) => ({ ...f, toleransiPagi: Number(e.target.value) || 0 }))}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Jam Masuk Sore</label>
              <input
                type="time"
                value={form.startSore}
                onChange={(e) => setForm((f) => ({ ...f, startSore: e.target.value }))}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Toleransi Telat (menit)</label>
              <input
                type="number"
                min={0}
                value={form.toleransiSore}
                onChange={(e) => setForm((f) => ({ ...f, toleransiSore: Number(e.target.value) || 0 }))}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="w-4 h-4 rounded border-slate-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
            />
            <span className="text-xs font-semibold text-slate-700">Jadikan shift default (berlaku untuk pegawai tanpa shift)</span>
          </label>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#1E3A8A] rounded-lg hover:bg-[#172554] disabled:opacity-60 cursor-pointer"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Simpan
            </button>
          </div>
        </div>
      </Modal>
    </PortalLayout>
  );
}
