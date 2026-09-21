'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getAuthSession } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api';
import { ClipboardCheck, Users, DoorOpen, RefreshCw, ChevronRight } from 'lucide-react';

function authHeaders(): Record<string, string> {
  const { token, user } = getAuthSession();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  else if ((user as any)?.lecturerId) headers['x-lecturer-id'] = (user as any).lecturerId;
  return headers;
}

interface TeachingClassItem {
  id: string;
  courseCode: string;
  courseName: string;
  className: string;
  sks: number;
  day: string;
  timeSlot: string;
  roomName: string;
  enrolledCount: number;
  quota: number;
}

export default function LecturerAbsensiPage() {
  const [classes, setClasses] = useState<TeachingClassItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const apiBase = getApiBaseUrl();

  useEffect(() => {
    async function fetchClasses() {
      setIsLoading(true);
      try {
        const res = await fetch(`${apiBase}/lecturers/schedules`, { headers: authHeaders() });
        if (res.ok) {
          const json = await res.json();
          setClasses(json.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchClasses();
  }, []);

  return (
    <PortalLayout role="lecturer" userName="" userIdText="">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1E40AF] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6" />
            Absensi Perkuliahan
          </h1>
          <p className="text-xs sm:text-sm text-blue-200 mt-1">
            Pilih kelas untuk mencatat kehadiran mahasiswa per pertemuan.
          </p>
        </div>

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-[#1E3A8A] mb-2" />
            <p className="text-sm">Memuat kelas yang Anda ajar...</p>
          </div>
        ) : classes.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center rounded-2xl bg-white border border-slate-200 text-center">
            <ClipboardCheck className="w-10 h-10 text-slate-300 mb-3" />
            <h4 className="text-base font-bold text-slate-800">Belum ada kelas yang diampu semester ini</h4>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map((c) => (
              <Link
                key={c.id}
                href={`/lecturer/absensi/${c.id}`}
                className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-[#1E3A8A]/50 hover:shadow-md transition-all flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-[#1E3A8A] border border-blue-200">
                      {c.className}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{c.courseCode}</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 truncate">{c.courseName}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <DoorOpen className="w-3.5 h-3.5" /> {c.roomName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> {c.enrolledCount}/{c.quota}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{c.day} &bull; {c.timeSlot}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
