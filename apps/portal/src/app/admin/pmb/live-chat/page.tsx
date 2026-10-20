'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCheck, Clock, MessageCircle, Mail, Phone, RefreshCw, Search, Send, X, XCircle, RotateCcw } from 'lucide-react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';

interface ThreadItem {
  id: string;
  status: 'OPEN' | 'CLOSED';
  unread: number;
  lastMessageAt: string;
  applicant: { kind: 'APPLICANT' | 'VISITOR'; fullName: string; email: string; whatsapp: string };
  lastMessage: { body: string; sender: 'APPLICANT' | 'STAFF'; createdAt: string } | null;
}

interface Msg {
  id: string;
  from: 'staff' | 'applicant';
  name: string;
  body: string;
  createdAt: string;
}

interface ThreadDetail {
  id: string;
  status: 'OPEN' | 'CLOSED';
  applicant: { kind: 'APPLICANT' | 'VISITOR'; fullName: string; email: string; whatsapp: string };
}

const FILTERS = [
  { key: '', label: 'Semua' },
  { key: 'UNREAD', label: 'Belum dibaca' },
  { key: 'OPEN', label: 'Terbuka' },
  { key: 'CLOSED', label: 'Ditutup' },
  { key: 'VISITOR', label: 'Tamu' },
] as const;

const MAX_LEN = 1000;

interface HoursDay {
  day: number;
  open: boolean;
  from: string;
  to: string;
}
interface HoursSettings {
  mode: 'AUTO' | 'OPEN' | 'CLOSED';
  schedule: HoursDay[];
  offlineMessage: string;
  allowOfflineMessages: boolean;
}
interface HoursStatus extends HoursSettings {
  open: boolean;
  nextOpen: string | null;
}
const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
// tampil Senin..Minggu
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
const MODES = [
  { key: 'AUTO', label: 'Ikuti jadwal', hint: 'Buka/tutup otomatis sesuai jam di bawah' },
  { key: 'OPEN', label: 'Paksa buka', hint: 'Selalu buka, abaikan jadwal' },
  { key: 'CLOSED', label: 'Paksa tutup', hint: 'Selalu tutup (libur/rapat)' },
] as const;

const timeLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
};
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${getApiBaseUrl()}/admissions/admin/pmb/chat${path}`, { cache: 'no-store', ...init });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
  return (json?.data ?? json) as T;
}

function HoursDialog({ onClose, onSaved }: { onClose: () => void; onSaved: (s: HoursStatus) => void }) {
  const [form, setForm] = useState<HoursSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api<HoursSettings>('/settings')
      .then(setForm)
      .catch((e) => setErr(e instanceof Error ? e.message : 'Gagal memuat pengaturan.'));
  }, []);

  const setDay = (day: number, patch: Partial<HoursDay>) =>
    setForm((f) => (f ? { ...f, schedule: f.schedule.map((d) => (d.day === day ? { ...d, ...patch } : d)) } : f));

  const save = async () => {
    if (!form) return;
    setSaving(true);
    setErr(null);
    try {
      const st = await api<HoursStatus>('/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      onSaved(st);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Gagal menyimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#1E3A8A]" />
          <h2 className="font-extrabold text-slate-900 flex-1">Jam Operasional Live Chat</h2>
          <button onClick={onClose} aria-label="Tutup" className="p-1 rounded-lg hover:bg-slate-100 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
        {!form ? (
          <p className="p-8 text-center text-xs text-slate-400">{err ?? 'Memuat…'}</p>
        ) : (
          <div className="overflow-y-auto p-5 space-y-5">
            <div>
              <p className="text-xs font-bold text-slate-700 mb-2">Mode</p>
              <div className="grid grid-cols-3 gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => setForm({ ...form, mode: m.key })}
                    className={`text-left p-2.5 rounded-xl border cursor-pointer ${
                      form.mode === m.key ? 'border-[#1E3A8A] bg-blue-50' : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <p className="text-xs font-bold text-slate-900">{m.label}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">{m.hint}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className={form.mode === 'AUTO' ? '' : 'opacity-50'}>
              <p className="text-xs font-bold text-slate-700 mb-2">Jadwal mingguan (WIB)</p>
              <div className="space-y-1.5">
                {DAY_ORDER.map((n) => {
                  const d = form.schedule.find((x) => x.day === n)!;
                  return (
                    <div key={n} className="flex items-center gap-3 text-xs">
                      <label className="flex items-center gap-2 w-28 shrink-0 font-semibold text-slate-700 cursor-pointer">
                        <input type="checkbox" checked={d.open} onChange={(e) => setDay(n, { open: e.target.checked })} className="accent-[#1E3A8A]" />
                        {DAY_NAMES[n]}
                      </label>
                      {d.open ? (
                        <div className="flex items-center gap-1.5">
                          <input type="time" value={d.from} onChange={(e) => setDay(n, { from: e.target.value })} className="border border-slate-200 rounded-lg px-2 py-1" />
                          <span className="text-slate-400">–</span>
                          <input type="time" value={d.to} onChange={(e) => setDay(n, { to: e.target.value })} className="border border-slate-200 rounded-lg px-2 py-1" />
                        </div>
                      ) : (
                        <span className="text-slate-400">Libur</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 mb-1.5">Pesan di luar jam operasional</p>
              <textarea
                value={form.offlineMessage}
                onChange={(e) => setForm({ ...form, offlineMessage: e.target.value.slice(0, 300) })}
                rows={2}
                className="w-full resize-none text-xs border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
              />
              <label className="flex items-start gap-2 mt-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowOfflineMessages}
                  onChange={(e) => setForm({ ...form, allowOfflineMessages: e.target.checked })}
                  className="accent-[#1E3A8A] mt-0.5"
                />
                <span>
                  Tetap izinkan pengunjung menitipkan pesan saat tutup
                  <span className="block text-[10px] text-slate-400">Bila dimatikan, kolom kirim dikunci selama chat tutup.</span>
                </span>
              </label>
            </div>
            {err && <p className="text-xs text-rose-600">{err}</p>}
          </div>
        )}
        <div className="px-5 py-3 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
            Batal
          </button>
          <button
            onClick={() => void save()}
            disabled={!form || saving}
            className="px-4 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg disabled:opacity-40 cursor-pointer"
          >
            {saving ? 'Menyimpan…' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PmbLiveChatPage() {
  const [threads, setThreads] = useState<ThreadItem[]>([]);
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ThreadDetail | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hours, setHours] = useState<HoursStatus | null>(null);
  const [showHours, setShowHours] = useState(false);
  const lastTime = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () =>
      fetch(`${getApiBaseUrl()}/admissions/pmb/chat/status`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((j) => setHours(j.data ?? j))
        .catch(() => undefined);
    void load();
    const id = window.setInterval(load, 60000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const loadThreads = useCallback(async () => {
    try {
      const qs = new URLSearchParams();
      if (filter) qs.set('status', filter);
      if (debouncedSearch) qs.set('search', debouncedSearch);
      const d = await api<{ items: ThreadItem[] }>(`/threads?${qs.toString()}`);
      setThreads(d.items);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat percakapan.');
    } finally {
      setLoadingList(false);
    }
  }, [filter, debouncedSearch]);

  useEffect(() => {
    setLoadingList(true);
    void loadThreads();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void loadThreads();
    }, 5000);
    return () => window.clearInterval(id);
  }, [loadThreads]);

  const markRead = useCallback(async (id: string) => {
    try {
      await api(`/threads/${id}/read`, { method: 'POST' });
      setThreads((prev) => prev.map((t) => (t.id === id ? { ...t, unread: 0 } : t)));
    } catch {
      /* tidak fatal */
    }
  }, []);

  const pollMessages = useCallback(
    async (id: string, reset = false) => {
      try {
        const after = reset ? '' : lastTime.current ? `?after=${encodeURIComponent(lastTime.current)}` : '';
        const d = await api<{ thread: ThreadDetail & { unread: number }; messages: Msg[] }>(`/threads/${id}/messages${after}`);
        setDetail({ id: d.thread.id, status: d.thread.status, applicant: d.thread.applicant });
        setMessages((prev) => {
          const base = reset ? [] : prev;
          const seen = new Set(base.map((m) => m.id));
          const fresh = d.messages.filter((m) => !seen.has(m.id));
          return fresh.length ? [...base, ...fresh] : base;
        });
        if (d.messages.length) lastTime.current = d.messages[d.messages.length - 1].createdAt;
        if (d.thread.unread > 0) void markRead(id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Gagal memuat pesan.');
      }
    },
    [markRead],
  );

  useEffect(() => {
    if (!activeId) return;
    lastTime.current = null;
    setMessages([]);
    setDetail(null);
    void pollMessages(activeId, true);
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void pollMessages(activeId);
    }, 3000);
    return () => window.clearInterval(id);
  }, [activeId, pollMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const body = text.trim();
    if (!body || !activeId || sending) return;
    setSending(true);
    setError(null);
    try {
      await api(`/threads/${activeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: body }),
      });
      setText('');
      await pollMessages(activeId);
      void loadThreads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pesan gagal dikirim.');
    } finally {
      setSending(false);
    }
  };

  const toggleStatus = async () => {
    if (!detail) return;
    const next = detail.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    try {
      await api(`/threads/${detail.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      setDetail({ ...detail, status: next });
      void loadThreads();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah status.');
    }
  };

  const unreadTotal = threads.reduce((n, t) => n + t.unread, 0);

  return (
    <PortalLayout role="pmb" userName="" userIdText="">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[#1E3A8A]" /> Live Chat Pendaftar
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Balas pertanyaan calon mahasiswa. Percakapan diperbarui otomatis; pendaftar hanya melihat nama &ldquo;Panitia PMB&rdquo;.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {unreadTotal > 0 && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">{unreadTotal} pesan belum dibaca</span>
            )}
            <button
              onClick={() => setShowHours(true)}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:border-[#1E3A8A] cursor-pointer"
            >
              {hours && <span className={`w-2 h-2 rounded-full ${hours.open ? 'bg-emerald-500' : 'bg-slate-400'}`} />}
              {hours ? (hours.open ? 'Chat Buka' : 'Chat Tutup') : 'Jam Operasional'}
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>

        {hours && !hours.open && (
          <div className="text-xs p-3 rounded-xl border bg-amber-50 border-amber-200 text-amber-900">
            Live chat sedang <b>tutup</b>
            {hours.mode === 'CLOSED' ? ' (dipaksa tutup)' : ' (di luar jam operasional)'}
            {hours.nextOpen ? ` — buka ${hours.nextOpen}` : ''}. {hours.allowOfflineMessages ? 'Pengunjung masih dapat menitipkan pesan.' : 'Pengunjung tidak dapat mengirim pesan.'}
          </div>
        )}
        {showHours && <HoursDialog onClose={() => setShowHours(false)} onSaved={setHours} />}

        {error && <div className="text-xs p-3 rounded-xl border bg-rose-50 border-rose-200 text-rose-800">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-[22rem_1fr] gap-4 lg:h-[calc(100vh-14rem)] lg:min-h-[28rem]">
          {/* Daftar percakapan */}
          <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden ${activeId ? 'hidden lg:flex' : 'flex'} min-h-[24rem]`}>
            <div className="p-3 border-b border-slate-100 space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama, email, atau WhatsApp…"
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border cursor-pointer ${
                      filter === f.key ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#1E3A8A]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {loadingList && <p className="p-6 text-center text-xs text-slate-400">Memuat…</p>}
              {!loadingList && threads.length === 0 && (
                <p className="p-6 text-center text-xs text-slate-400">Belum ada percakapan{filter || debouncedSearch ? ' yang cocok' : ''}.</p>
              )}
              {threads.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-slate-50 cursor-pointer ${activeId === t.id ? 'bg-blue-50/70' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate flex items-center gap-1.5 ${t.unread ? 'font-extrabold text-slate-900' : 'font-semibold text-slate-800'}`}>
                      <span className="truncate">{t.applicant.fullName}</span>
                      {t.applicant.kind === 'VISITOR' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200 shrink-0">Tamu</span>
                      )}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0">{timeLabel(t.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className={`text-xs truncate ${t.unread ? 'text-slate-800' : 'text-slate-500'}`}>
                      {t.lastMessage ? `${t.lastMessage.sender === 'STAFF' ? 'Anda: ' : ''}${t.lastMessage.body}` : '—'}
                    </span>
                    {t.unread > 0 ? (
                      <span className="min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#D4A017] text-slate-950 text-[10px] font-extrabold flex items-center justify-center shrink-0">{t.unread}</span>
                    ) : t.status === 'CLOSED' ? (
                      <span className="text-[10px] font-semibold text-slate-400 shrink-0">Ditutup</span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Percakapan */}
          <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden ${activeId ? 'flex' : 'hidden lg:flex'} min-h-[28rem]`}>
            {!activeId || !detail ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 p-8">
                {activeId ? <RefreshCw className="w-5 h-5 animate-spin" /> : <MessageCircle className="w-10 h-10 mb-2" />}
                <p className="text-sm mt-2">{activeId ? 'Memuat percakapan…' : 'Pilih percakapan di sebelah kiri.'}</p>
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center gap-3">
                  <button onClick={() => setActiveId(null)} className="lg:hidden text-xs font-semibold text-[#1E3A8A] cursor-pointer">
                    ← Daftar
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 truncate">{detail.applicant.fullName}</p>
                    <p className="text-[11px] text-slate-500 flex flex-wrap gap-x-3">
                      {detail.applicant.kind === 'VISITOR' && <span className="font-bold text-violet-700">Pengunjung (belum punya akun)</span>}
                      {detail.applicant.email && <span className="inline-flex items-center gap-1"><Mail className="w-3 h-3" />{detail.applicant.email}</span>}
                      {detail.applicant.whatsapp && <span className="inline-flex items-center gap-1"><Phone className="w-3 h-3" />{detail.applicant.whatsapp}</span>}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                      detail.status === 'OPEN' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}
                  >
                    {detail.status === 'OPEN' ? 'Terbuka' : 'Ditutup'}
                  </span>
                  <button
                    onClick={toggleStatus}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    {detail.status === 'OPEN' ? <><XCircle className="w-3.5 h-3.5" /> Tutup</> : <><RotateCcw className="w-3.5 h-3.5" /> Buka kembali</>}
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto bg-slate-50 px-4 py-4 space-y-2">
                  {messages.map((m, i) => {
                    const showDay = i === 0 || dayLabel(messages[i - 1].createdAt) !== dayLabel(m.createdAt);
                    const mine = m.from === 'staff';
                    return (
                      <div key={m.id}>
                        {showDay && <p className="text-center text-[10px] font-semibold text-slate-400 my-3">{dayLabel(m.createdAt)}</p>}
                        <div className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-snug ${mine ? 'bg-[#1E3A8A] text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'}`}>
                            <p className="whitespace-pre-wrap break-words">{m.body}</p>
                            <p className={`text-[10px] mt-1 text-right ${mine ? 'text-blue-200' : 'text-slate-400'}`}>
                              {mine ? `${m.name} · ` : ''}
                              {new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                              {mine && <CheckCheck className="w-3 h-3 inline ml-1 opacity-70" />}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>

                <div className="border-t border-slate-100 p-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={text}
                      onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          void send();
                        }
                      }}
                      rows={2}
                      placeholder="Tulis balasan… (Enter untuk kirim, Shift+Enter baris baru)"
                      className="flex-1 resize-none text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                    />
                    <button
                      onClick={() => void send()}
                      disabled={sending || !text.trim()}
                      className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl disabled:opacity-40 cursor-pointer"
                    >
                      <Send className="w-4 h-4" /> Kirim
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 text-right">{text.length}/{MAX_LEN}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
