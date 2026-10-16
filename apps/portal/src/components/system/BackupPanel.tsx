'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Database, Download, HardDriveDownload, RefreshCw, Trash2 } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';
import { getAuthSession } from '@/lib/auth';

interface BackupFile {
  name: string;
  type: 'manual' | 'otomatis';
  sizeBytes: number;
  createdAt: string;
}

interface BackupList {
  directory: string;
  autoEnabled: boolean;
  autoHour: number;
  retention: number;
  running: boolean;
  items: BackupFile[];
}

const authHeaders = (): Record<string, string> => {
  const { token } = getAuthSession();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const fmtSize = (b: number) =>
  b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`;

const fmtDate = (v: string) =>
  new Date(v).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

async function errorOf(res: Response): Promise<string> {
  const json = await res.json().catch(() => null);
  const body = json?.data ?? json;
  return Array.isArray(body?.message) ? body.message.join(', ') : body?.message || `HTTP ${res.status}`;
}

export function BackupPanel() {
  const [data, setData] = useState<BackupList | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busyName, setBusyName] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${getApiBaseUrl()}/backups`, { headers: authHeaders() });
      if (!res.ok) throw new Error(await errorOf(res));
      const json = await res.json();
      setData(json.data ?? json);
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Gagal memuat daftar backup.' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setCreating(true);
    setMsg(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/backups`, { method: 'POST', headers: authHeaders() });
      if (!res.ok) throw new Error(await errorOf(res));
      const json = await res.json();
      const f: BackupFile = json.data ?? json;
      setMsg({ ok: true, text: `Backup berhasil dibuat: ${f.name} (${fmtSize(f.sizeBytes)}).` });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Backup gagal.' });
    } finally {
      setCreating(false);
    }
  };

  const download = async (name: string) => {
    setBusyName(name);
    try {
      const res = await fetch(`${getApiBaseUrl()}/backups/${encodeURIComponent(name)}/download`, { headers: authHeaders() });
      if (!res.ok) throw new Error(await errorOf(res));
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Gagal mengunduh backup.' });
    } finally {
      setBusyName(null);
    }
  };

  const remove = async (name: string) => {
    if (!window.confirm(`Hapus berkas backup ${name}? Tindakan ini tidak dapat dibatalkan.`)) return;
    setBusyName(name);
    try {
      const res = await fetch(`${getApiBaseUrl()}/backups/${encodeURIComponent(name)}`, { method: 'DELETE', headers: authHeaders() });
      if (!res.ok) throw new Error(await errorOf(res));
      setMsg({ ok: true, text: `Backup ${name} dihapus.` });
      await load();
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : 'Gagal menghapus backup.' });
    } finally {
      setBusyName(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Backup Database</h3>
            <p className="text-xs text-slate-500">
              {data
                ? data.autoEnabled
                  ? `Otomatis setiap hari setelah pukul ${String(data.autoHour).padStart(2, '0')}.00 · simpan ${data.retention} backup otomatis terakhir`
                  : 'Backup otomatis dinonaktifkan — hanya backup manual'
                : 'Memuat…'}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => void load()}
            className="inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Segarkan
          </button>
          <button
            onClick={create}
            disabled={creating}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl disabled:opacity-60 cursor-pointer"
          >
            {creating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HardDriveDownload className="w-3.5 h-3.5" />}
            {creating ? 'Membuat backup…' : 'Backup Sekarang'}
          </button>
        </div>
      </div>

      {msg && (
        <div
          className={`flex items-start gap-2 text-xs rounded-xl p-3 mb-4 border ${
            msg.ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {msg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="border border-slate-200 rounded-xl overflow-auto">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="py-2.5 px-3">Berkas</th>
              <th className="py-2.5 px-3">Jenis</th>
              <th className="py-2.5 px-3">Dibuat</th>
              <th className="py-2.5 px-3 text-right">Ukuran</th>
              <th className="py-2.5 px-3 text-right w-28">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {!loading && (data?.items.length ?? 0) === 0 && (
              <tr>
                <td colSpan={5} className="py-8 px-3 text-center text-slate-400">
                  Belum ada berkas backup. Klik “Backup Sekarang” untuk membuat yang pertama.
                </td>
              </tr>
            )}
            {data?.items.map((f) => (
              <tr key={f.name} className="hover:bg-slate-50/70">
                <td className="py-2.5 px-3 font-mono text-[11px] text-slate-800">{f.name}</td>
                <td className="py-2.5 px-3">
                  <span
                    className={`inline-flex text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      f.type === 'otomatis'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {f.type === 'otomatis' ? 'Otomatis' : 'Manual'}
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-600">{fmtDate(f.createdAt)}</td>
                <td className="py-2.5 px-3 text-right font-mono text-slate-600">{fmtSize(f.sizeBytes)}</td>
                <td className="py-2.5 px-3">
                  <div className="flex justify-end gap-1.5">
                    <button
                      title="Unduh"
                      disabled={busyName === f.name}
                      onClick={() => void download(f.name)}
                      className="p-1.5 rounded-lg text-[#1E3A8A] hover:bg-blue-50 disabled:opacity-40 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      title="Hapus"
                      disabled={busyName === f.name}
                      onClick={() => void remove(f.name)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 disabled:opacity-40 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
        Format <span className="font-mono">pg_dump -Fc</span>. Pulihkan dengan{' '}
        <span className="font-mono">pg_restore --clean --if-exists -d &lt;database&gt; &lt;berkas&gt;</span> dari server —
        pemulihan sengaja tidak tersedia di portal.
        {data && <> Lokasi di server: <span className="font-mono">{data.directory}</span>.</>}
      </p>
    </div>
  );
}
