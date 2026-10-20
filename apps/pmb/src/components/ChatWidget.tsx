'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Headset, MessageCircle, Send, X } from 'lucide-react';
import { getApiBaseUrl } from '@/lib/api';

interface ChatMessage {
  id: string;
  from: 'me' | 'staff';
  name: string;
  body: string;
  createdAt: string;
}

type Mode = 'applicant' | 'visitor' | 'new';

interface ChatHours {
  open: boolean;
  offlineMessage: string;
  allowOfflineMessages: boolean;
  nextOpen: string | null;
}

const MAX_LEN = 1000;
const POLL_OPEN_MS = 3000;
const POLL_CLOSED_MS = 20000;
const STATUS_MS = 60000;
const VISITOR_KEY = 'pmb_visitor_token';

const hhmm = (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
const dayLabel = (iso: string) => new Date(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

function readModeAndToken(): { mode: Mode; token: string | null } {
  try {
    const applicant = localStorage.getItem('pmb_applicant_token') || localStorage.getItem('pmb_account_token');
    if (applicant) return { mode: 'applicant', token: applicant };
    const visitor = localStorage.getItem(VISITOR_KEY);
    if (visitor) return { mode: 'visitor', token: visitor };
  } catch {
    /* penyimpanan tidak tersedia */
  }
  return { mode: 'new', token: null };
}

/**
 * Live chat dengan Panitia PMB, tersedia di semua halaman PMB (polling).
 *  - Pendaftar yang login memakai token akunnya.
 *  - Pengunjung yang belum punya akun mengisi nama + email/WhatsApp + pesan pertama, lalu mendapat token tamu.
 */
export function ChatWidget() {
  const pathname = usePathname();
  const [{ mode, token }, setAuth] = useState<{ mode: Mode; token: string | null }>({ mode: 'new', token: null });
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [unread, setUnread] = useState(0);
  const [status, setStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [hours, setHours] = useState<ChatHours | null>(null);
  // formulir awal pengunjung
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [website, setWebsite] = useState(''); // honeypot: dibiarkan kosong oleh manusia
  const lastTime = useRef<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(open);
  openRef.current = open;

  // Baca ulang token saat halaman berpindah (mis. setelah login) atau storage berubah.
  useEffect(() => {
    const sync = () => {
      const next = readModeAndToken();
      setAuth((prev) => {
        if (prev.mode === next.mode && prev.token === next.token) return prev;
        lastTime.current = null;
        setMessages([]);
        setUnread(0);
        setDisabled(false);
        return next;
      });
    };
    sync();
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, [pathname]);

  const headers = useCallback((): Record<string, string> => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const merge = useCallback((incoming: ChatMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      const fresh = incoming.filter((m) => !seen.has(m.id));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
    lastTime.current = incoming[incoming.length - 1].createdAt;
  }, []);

  const markRead = useCallback(async () => {
    if (!token) return;
    try {
      await fetch(`${getApiBaseUrl()}/admissions/pmb/chat/read`, { method: 'POST', headers: headers() });
      setUnread(0);
    } catch {
      /* tidak fatal */
    }
  }, [token, headers]);

  const poll = useCallback(async () => {
    if (!token) return;
    try {
      const url = `${getApiBaseUrl()}/admissions/pmb/chat${lastTime.current ? `?after=${encodeURIComponent(lastTime.current)}` : ''}`;
      const res = await fetch(url, { cache: 'no-store', headers: headers() });
      if (res.status === 401 || res.status === 403 || res.status === 404) {
        if (mode === 'visitor') {
          // token tamu kedaluwarsa / percakapan hilang -> mulai ulang dari formulir
          try {
            localStorage.removeItem(VISITOR_KEY);
          } catch {
            /* abaikan */
          }
          lastTime.current = null;
          setMessages([]);
          setAuth({ mode: 'new', token: null });
        } else {
          setDisabled(true);
        }
        return;
      }
      if (!res.ok) return;
      const json = await res.json();
      const d = json.data ?? json;
      setStatus(d.status === 'CLOSED' ? 'CLOSED' : 'OPEN');
      merge(d.messages ?? []);
      if (openRef.current) {
        if ((d.unread ?? 0) > 0) void markRead();
      } else {
        setUnread(d.unread ?? 0);
      }
    } catch {
      /* jaringan putus sesaat -- coba lagi pada putaran berikutnya */
    }
  }, [token, mode, headers, merge, markRead]);

  // Jam operasional: diperiksa saat dimuat dan tiap menit (tanpa token, endpoint publik).
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/admissions/pmb/chat/status`, { cache: 'no-store' });
        if (!res.ok) return;
        const json = await res.json();
        if (alive) setHours(json.data ?? json);
      } catch {
        /* tanpa info jam, widget tetap berfungsi seperti biasa */
      }
    };
    void load();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, STATUS_MS);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (disabled || !token) return;
    void poll();
    const id = window.setInterval(
      () => {
        if (document.visibilityState === 'visible') void poll();
      },
      open ? POLL_OPEN_MS : POLL_CLOSED_MS,
    );
    return () => window.clearInterval(id);
  }, [open, disabled, token, poll]);

  useEffect(() => {
    if (open && token) {
      setUnread(0);
      void markRead();
    }
  }, [open, token, markRead]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const errorFrom = async (res: Response, fallback: string) => {
    const j = await res.json().catch(() => null);
    const msg = j?.message;
    return Array.isArray(msg) ? msg.join(', ') : msg || (res.status === 429 ? 'Terlalu banyak permintaan, coba beberapa saat lagi.' : fallback);
  };

  const send = async () => {
    const body = text.trim();
    if (!body || sending || !token || blocked) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/admissions/pmb/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers() },
        body: JSON.stringify({ message: body }),
      });
      if (!res.ok) throw new Error(await errorFrom(res, 'Pesan gagal dikirim.'));
      setText('');
      setStatus('OPEN');
      await poll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pesan gagal dikirim.');
    } finally {
      setSending(false);
    }
  };

  const startVisitor = async () => {
    if (sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`${getApiBaseUrl()}/admissions/pmb/chat/visitor/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, contact, message: text, website }),
      });
      if (!res.ok) throw new Error(await errorFrom(res, 'Chat gagal dimulai.'));
      const json = await res.json();
      const d = json.data ?? json;
      try {
        localStorage.setItem(VISITOR_KEY, d.token);
      } catch {
        /* tetap lanjut untuk sesi ini */
      }
      setText('');
      lastTime.current = null;
      setMessages([]);
      setAuth({ mode: 'visitor', token: d.token });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chat gagal dimulai.');
    } finally {
      setSending(false);
    }
  };

  if (disabled) return null;

  const isNew = mode === 'new';
  const closed = hours?.open === false;
  const blocked = closed && hours?.allowOfflineMessages === false;
  const canSubmitNew = !blocked && name.trim().length >= 2 && contact.trim().length >= 5 && text.trim().length > 0;

  return (
    <div className="fixed bottom-6 right-6 z-40 print:hidden">
      {open && (
        <div className="mb-3 w-[min(22rem,calc(100vw-2rem))] h-[min(32rem,calc(100vh-8rem))] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] text-white px-4 py-3 flex items-center gap-3">
            <span className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
              <Headset className="w-4 h-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold leading-tight">Panitia PMB</p>
              <p className="text-[11px] text-blue-200 flex items-center gap-1.5">
                {hours && <span className={`w-1.5 h-1.5 rounded-full ${closed ? 'bg-slate-400' : 'bg-emerald-400'}`} />}
                {hours ? (closed ? 'Di luar jam operasional' : 'Online · biasanya membalas cepat') : 'Tanyakan seputar pendaftaran'}
              </p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Tutup chat" className="p-1 rounded-lg hover:bg-white/10 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          {closed && hours && (
            <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-[11px] text-amber-900 leading-snug">
              <p className="font-bold">Live chat sedang tutup{hours.nextOpen ? ` · buka ${hours.nextOpen}` : ''}</p>
              <p className="mt-0.5">{blocked ? 'Pesan baru belum dapat dikirim saat ini.' : hours.offlineMessage}</p>
            </div>
          )}

          {isNew ? (
            <div className="flex-1 overflow-y-auto bg-slate-50 p-4 space-y-3">
              <p className="text-xs text-slate-600 leading-relaxed bg-white border border-slate-200 rounded-xl p-3">
                Halo! Perkenalkan diri Anda dan tuliskan pertanyaan. Panitia akan membalas di sini, dan kontak Anda dipakai bila perlu menghubungi di luar chat.
              </p>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 60))}
                placeholder="Nama Anda"
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
              />
              <input
                value={contact}
                onChange={(e) => setContact(e.target.value.slice(0, 80))}
                placeholder="Email atau nomor WhatsApp"
                inputMode="email"
                className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
              />
              {/* honeypot: disembunyikan dari manusia dan pembaca layar */}
              <input
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="absolute -left-[9999px] w-px h-px opacity-0"
              />
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, MAX_LEN))}
                rows={4}
                placeholder="Tulis pertanyaan Anda…"
                className="w-full resize-none text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] bg-white"
              />
              {error && <p className="text-[11px] text-rose-600">{error}</p>}
              <button
                onClick={() => void startVisitor()}
                disabled={sending || !canSubmitNew}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-xl disabled:opacity-40 cursor-pointer"
              >
                <Send className="w-4 h-4" /> {sending ? 'Memulai…' : 'Mulai Chat'}
              </button>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto bg-slate-50 px-3 py-3 space-y-2">
                {messages.length === 0 && (
                  <div className="text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-xl p-4 mt-2 leading-relaxed">
                    Halo! Silakan tulis pertanyaan Anda tentang persyaratan, biaya, atau proses pendaftaran.
                  </div>
                )}
                {messages.map((m, i) => {
                  const showDay = i === 0 || dayLabel(messages[i - 1].createdAt) !== dayLabel(m.createdAt);
                  return (
                    <div key={m.id}>
                      {showDay && <p className="text-center text-[10px] font-semibold text-slate-400 my-2">{dayLabel(m.createdAt)}</p>}
                      <div className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-2xl px-3 py-2 text-[13px] leading-snug ${
                            m.from === 'me' ? 'bg-[#1E3A8A] text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                          <p className={`text-[10px] mt-1 text-right ${m.from === 'me' ? 'text-blue-200' : 'text-slate-400'}`}>
                            {m.from === 'staff' ? `${m.name} · ` : ''}
                            {hhmm(m.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {status === 'CLOSED' && (
                  <p className="text-center text-[11px] text-slate-500 bg-slate-100 rounded-lg p-2">
                    Percakapan ditutup oleh panitia. Kirim pesan baru untuk membukanya kembali.
                  </p>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="border-t border-slate-200 bg-white p-2.5">
                {error && <p className="text-[11px] text-rose-600 mb-1.5 px-1">{error}</p>}
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
                    rows={1}
                    placeholder="Tulis pesan… (Enter untuk kirim)"
                    className="flex-1 resize-none max-h-28 text-sm border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A]"
                  />
                  <button
                    onClick={() => void send()}
                    disabled={sending || blocked || !text.trim()}
                    aria-label="Kirim"
                    className="w-10 h-10 rounded-xl bg-[#1E3A8A] hover:bg-blue-900 text-white flex items-center justify-center disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {text.length > MAX_LEN - 100 && <p className="text-[10px] text-slate-400 text-right mt-1">{text.length}/{MAX_LEN}</p>}
              </div>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Tutup live chat' : 'Buka live chat dengan panitia PMB'}
        className="relative ml-auto flex items-center gap-2 pl-4 pr-5 py-3 rounded-full bg-[#D4A017] hover:bg-[#C59114] text-slate-950 font-bold text-sm shadow-xl cursor-pointer"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline">Live Chat</span>
        {unread > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[1.4rem] h-[1.4rem] px-1 rounded-full bg-rose-600 text-white text-[11px] font-extrabold flex items-center justify-center ring-2 ring-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
    </div>
  );
}
