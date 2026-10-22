'use client';

import { useEffect, useRef, useState } from 'react';

/** Sinyal dari server: `chat` (ada perubahan percakapan), `status` (jam operasional berubah), `resync` (baru tersambung/tersambung ulang). */
export interface ChatSignal {
  type: 'chat' | 'status' | 'resync';
  threadId?: string;
}

/** Jeda antar percobaan menyambung ulang naik bertahap sampai batas ini (live chat murni WebSocket: tidak ada polling cadangan). */
const MAX_RETRY_MS = 30000;

function socketUrl(): string {
  // Bawaan: alamat yang sama dengan halaman (jalur /ws diteruskan ke API). Untuk pengembangan lokal bisa diganti.
  const override = process.env.NEXT_PUBLIC_CHAT_WS_URL;
  if (override) return override;
  return `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws/chat`;
}

/**
 * Sambungan WebSocket live chat PMB. Server hanya mengirim sinyal kecil; data diambil klien lewat REST.
 * Live chat murni WebSocket: tidak ada polling cadangan. Bila terputus, klien terus mencoba menyambung ulang dengan jeda
 * bertahap (dan segera saat jaringan kembali atau tab dibuka lagi), lalu mengambil data yang terlewat lewat sinyal `resync`.
 * `connected` false berarti belum/tidak tersambung; pemanggil dapat menampilkan indikator.
 */
export function useChatSocket({
  token,
  enabled = true,
  onSignal,
}: {
  token: string | null;
  enabled?: boolean;
  onSignal: (signal: ChatSignal) => void;
}) {
  const [connected, setConnected] = useState(false);
  const callback = useRef(onSignal);
  callback.current = onSignal;

  useEffect(() => {
    if (!token || !enabled || typeof WebSocket === 'undefined') {
      setConnected(false);
      return;
    }
    let ws: WebSocket | null = null;
    let stopped = false;
    let failures = 0;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (stopped) return;
      const base = Math.min(MAX_RETRY_MS, 1000 * 2 ** failures);
      // acak agar ribuan klien tidak menyambung ulang serentak setelah server dihidupkan ulang
      timer = setTimeout(connect, base + Math.random() * 2000);
    };

    const connect = () => {
      if (stopped) return;
      let reached = false;
      try {
        ws = new WebSocket(socketUrl());
      } catch {
        failures++;
        schedule();
        return;
      }
      ws.onopen = () => ws?.send(JSON.stringify({ event: 'auth', data: { token } }));
      ws.onmessage = (ev) => {
        let msg: { type?: string; threadId?: string } | null = null;
        try {
          msg = JSON.parse(String(ev.data));
        } catch {
          return;
        }
        if (msg?.type === 'ready') {
          reached = true;
          failures = 0;
          setConnected(true);
          callback.current({ type: 'resync' }); // ambil yang terlewat selama terputus
        } else if (msg?.type === 'chat' || msg?.type === 'status') {
          callback.current({ type: msg.type, threadId: msg.threadId });
        }
      };
      ws.onerror = () => undefined;
      ws.onclose = (ev) => {
        setConnected(false);
        if (stopped) return;
        // 4003: token/peran tidak valid, 4008: terlalu banyak tab -- mencoba lagi tidak akan membantu
        if (ev.code === 4003 || ev.code === 4008) return;
        if (!reached) failures++;
        schedule();
      };
    };

    // Jaringan kembali / tab dibuka lagi: jangan menunggu jeda percobaan berikutnya
    const retryNow = () => {
      if (stopped || (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING))) return;
      if (timer) clearTimeout(timer);
      failures = 0;
      connect();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') retryNow();
    };
    window.addEventListener('online', retryNow);
    document.addEventListener('visibilitychange', onVisible);

    connect();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
      window.removeEventListener('online', retryNow);
      document.removeEventListener('visibilitychange', onVisible);
      ws?.close();
      setConnected(false);
    };
  }, [token, enabled]);

  return { connected };
}
