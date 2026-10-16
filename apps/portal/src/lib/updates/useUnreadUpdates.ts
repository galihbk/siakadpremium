'use client';

import { useCallback, useEffect, useState } from 'react';
import { UPDATES } from './changelog';

const KEY = 'siakad.updates.read';
const EVENT = 'siakad-updates-read';

function readIds(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {
    /* penyimpanan tidak tersedia -- lencana akan muncul lagi, tidak fatal */
  }
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Status "sudah dibaca" pembaruan sistem. Disimpan per browser (localStorage) -- hanya kemudahan
 * tampilan, bukan data penting. Semua komponen yang memakai hook ini ikut diperbarui lewat event.
 */
export function useUnreadUpdates() {
  const [readIdsState, setReadIdsState] = useState<string[] | null>(null);

  useEffect(() => {
    const sync = () => setReadIdsState(readIds());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const unreadIds = readIdsState === null ? [] : UPDATES.filter((u) => !readIdsState.includes(u.id)).map((u) => u.id);

  const markRead = useCallback((id: string) => {
    const current = readIds();
    if (!current.includes(id)) writeIds([...current, id]);
  }, []);

  const markAllRead = useCallback(() => {
    writeIds(UPDATES.map((u) => u.id));
  }, []);

  return { unreadIds, unreadCount: unreadIds.length, ready: readIdsState !== null, markRead, markAllRead };
}
