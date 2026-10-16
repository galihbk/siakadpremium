'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCheck, Megaphone, Server } from 'lucide-react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { UPDATES, type UpdateType } from '@/lib/updates/changelog';
import { useUnreadUpdates } from '@/lib/updates/useUnreadUpdates';

const TYPE_STYLE: Record<UpdateType, string> = {
  'Menu Baru': 'bg-violet-50 text-violet-700 border-violet-200',
  'Fitur Baru': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Peningkatan: 'bg-sky-50 text-sky-700 border-sky-200',
  Perbaikan: 'bg-amber-50 text-amber-700 border-amber-200',
  Keamanan: 'bg-rose-50 text-rose-700 border-rose-200',
  Infrastruktur: 'bg-slate-100 text-slate-700 border-slate-300',
};

const TYPES = Object.keys(TYPE_STYLE) as UpdateType[];

export default function SuperAdminUpdatesPage() {
  const { unreadIds, unreadCount, markRead, markAllRead } = useUnreadUpdates();
  const [filter, setFilter] = useState<UpdateType | 'Semua'>('Semua');

  const list = useMemo(() => (filter === 'Semua' ? UPDATES : UPDATES.filter((u) => u.type === filter)), [filter]);

  return (
    <PortalLayout role="superadmin" userName="Super Administrator" userIdText="Sistem Informasi Akademik Terpadu">
      <div className="space-y-6 pb-12">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#172554] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">Updates</h1>
                <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-xl leading-relaxed">
                  Pembaruan sistem dan menu baru. Periksa halaman ini setelah setiap deploy untuk mengetahui apa yang berubah dan apakah ada tindakan yang perlu dilakukan.
                </p>
              </div>
            </div>
            <button
              onClick={markAllRead}
              disabled={unreadCount === 0}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" /> Tandai semua dibaca
            </button>
          </div>
          <p className="mt-4 text-xs text-blue-200">
            {unreadCount > 0 ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#D4A017] animate-pulse" />
                {unreadCount} pembaruan belum dibaca
              </span>
            ) : (
              'Semua pembaruan sudah dibaca.'
            )}
          </p>
        </div>

        {UPDATES.length === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h2 className="text-base font-bold text-slate-700">Belum ada pembaruan</h2>
            <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              Pembaruan sistem dan menu baru akan muncul di sini setelah ada rilis. Lencana jumlah baru akan tampil di menu Updates.
            </p>
          </div>
        )}

        <div className={`flex flex-wrap gap-2 ${UPDATES.length === 0 ? 'hidden' : ''}`}>
          {(['Semua', ...TYPES] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                filter === t ? 'bg-[#1E3A8A] text-white border-[#1E3A8A]' : 'bg-white text-slate-600 border-slate-200 hover:border-[#1E3A8A]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <ol className={`relative space-y-5 before:absolute before:left-[15px] before:top-3 before:bottom-3 before:w-px before:bg-slate-200 ${UPDATES.length === 0 ? 'hidden' : ''}`}>
          {UPDATES.length > 0 && list.length === 0 && <li className="text-sm text-slate-400 pl-10">Tidak ada pembaruan untuk jenis ini.</li>}
          {list.map((u) => {
            const unread = unreadIds.includes(u.id);
            return (
              <li key={u.id} className="relative pl-10">
                <span
                  className={`absolute left-[7px] top-6 w-4 h-4 rounded-full border-4 border-slate-50 ${unread ? 'bg-[#D4A017]' : 'bg-slate-300'}`}
                  aria-hidden
                />
                <article
                  className={`bg-white rounded-2xl border shadow-sm p-5 sm:p-6 ${unread ? 'border-[#D4A017]/60 ring-1 ring-[#D4A017]/20' : 'border-slate-200'}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${TYPE_STYLE[u.type]}`}>{u.type}</span>
                    {unread && <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#D4A017] text-slate-950">BARU</span>}
                    <span className="text-[11px] text-slate-400">
                      v{u.version} · {u.period}
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-extrabold text-slate-900 mt-2">{u.title}</h2>
                  <p className="text-sm text-slate-600 mt-1 leading-relaxed">{u.summary}</p>

                  <ul className="mt-3 space-y-1.5 text-sm text-slate-700 leading-relaxed">
                    {u.items.map((it, i) => (
                      <li key={i} className="flex gap-2.5">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#D4A017] shrink-0" />
                        <span>{it}</span>
                      </li>
                    ))}
                  </ul>

                  {u.action && (
                    <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900">
                      <Server className="w-4 h-4 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        <span className="font-bold">Tindakan: </span>
                        {u.action}
                      </p>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    {u.link && (
                      <Link
                        href={u.link.href}
                        onClick={() => markRead(u.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-[#1E3A8A] hover:bg-blue-900 rounded-lg"
                      >
                        {u.link.label} <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                    {unread && (
                      <button
                        onClick={() => markRead(u.id)}
                        className="text-xs font-semibold text-slate-500 hover:text-[#1E3A8A] cursor-pointer"
                      >
                        Tandai dibaca
                      </button>
                    )}
                  </div>
                </article>
              </li>
            );
          })}
        </ol>

        <p className="text-[11px] text-slate-400">
          Status &ldquo;dibaca&rdquo; disimpan di browser ini. Pembaruan baru ditambahkan pengembang pada berkas{' '}
          <span className="font-mono">apps/portal/src/lib/updates/changelog.ts</span> bersama setiap rilis.
        </p>
      </div>
    </PortalLayout>
  );
}
