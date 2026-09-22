'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PortalLayout } from '@/components/layout/PortalLayout';
import { getApiBaseUrl } from '@/lib/api';
import {
  Activity,
  Server,
  Cpu,
  MemoryStick,
  HardDrive,
  Database,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Clock,
} from 'lucide-react';

interface ServerHealth {
  generatedAt: string;
  server: {
    hostname: string;
    platform: string;
    nodeVersion: string;
    pid: number;
    processUptimeSeconds: number;
    osUptimeSeconds: number;
  };
  cpu: {
    cores: number;
    model: string;
    usagePercent: number;
  };
  memory: {
    totalMB: number;
    freeMB: number;
    usedMB: number;
    usagePercent: number;
    processHeapUsedMB: number;
    processRssMB: number;
  };
  disk: {
    totalGB: number;
    freeGB: number;
    usedGB: number;
    usagePercent: number;
  };
  database: {
    isOnline: boolean;
    latencyMs: number;
  };
  services: { name: string; desc: string; isOnline: boolean; responseTime: string }[];
  summary: { onlineCount: number; totalCount: number; isAllNormal: boolean };
}

interface HistoryPoint {
  timestamp: string;
  cpuPercent: number;
  memoryPercent: number;
  diskPercent: number;
}

function formatUptime(totalSeconds: number): string {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}h`);
  if (hours > 0) parts.push(`${hours}j`);
  parts.push(`${minutes}m`);
  return parts.join(' ');
}

const CHART_WIDTH = 300;
const CHART_HEIGHT = 70;

function buildLinePath(values: number[]): { line: string; area: string } {
  if (values.length === 0) return { line: '', area: '' };
  if (values.length === 1) {
    const y = CHART_HEIGHT - (values[0] / 100) * CHART_HEIGHT;
    return {
      line: `M0,${y} L${CHART_WIDTH},${y}`,
      area: `M0,${y} L${CHART_WIDTH},${y} L${CHART_WIDTH},${CHART_HEIGHT} L0,${CHART_HEIGHT} Z`,
    };
  }
  const step = CHART_WIDTH / (values.length - 1);
  const coords = values.map((v, i) => {
    const x = i * step;
    const y = CHART_HEIGHT - (Math.max(0, Math.min(100, v)) / 100) * CHART_HEIGHT;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const line = `M${coords.join(' L')}`;
  const area = `M0,${CHART_HEIGHT} L${coords.join(' L')} L${CHART_WIDTH},${CHART_HEIGHT} Z`;
  return { line, area };
}

function UsageChart({
  title,
  icon,
  colorClass,
  strokeColor,
  fillId,
  values,
  currentLabel,
}: {
  title: string;
  icon: React.ReactNode;
  colorClass: string;
  strokeColor: string;
  fillId: string;
  values: number[];
  currentLabel: string;
}) {
  const { line, area } = useMemo(() => buildLinePath(values), [values]);
  const current = values.length > 0 ? values[values.length - 1] : 0;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl ${colorClass} flex items-center justify-center`}>{icon}</div>
          <div>
            <h2 className="font-bold text-slate-800 text-sm">{title}</h2>
            <p className="text-xs text-slate-500">{currentLabel}</p>
          </div>
        </div>
        <p className="text-xl font-black text-slate-800">{current}%</p>
      </div>
      <div className="px-5 pb-5">
        {values.length > 1 ? (
          <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-20" preserveAspectRatio="none">
            <defs>
              <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={strokeColor} stopOpacity="0.35" />
                <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={area} fill={`url(#${fillId})`} />
            <path d={line} fill="none" stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        ) : (
          <div className="h-20 flex items-center justify-center text-xs text-slate-400">
            Mengumpulkan data riwayat...
          </div>
        )}
      </div>
    </div>
  );
}

export default function MonitoringServerPage() {
  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);

  const apiBase = getApiBaseUrl();

  const loadData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    try {
      const [healthRes, historyRes] = await Promise.all([
        fetch(`${apiBase}/monitoring/server`, { cache: 'no-store' }),
        fetch(`${apiBase}/monitoring/history`, { cache: 'no-store' }),
      ]);
      if (!healthRes.ok || !historyRes.ok) throw new Error('Gagal memuat data');

      const healthJson = await healthRes.json();
      const historyJson = await historyRes.json();

      setHealth(healthJson?.data || healthJson);
      setHistory((historyJson?.data || historyJson)?.points || []);
      setError(null);
      setLastFetchedAt(new Date());
    } catch {
      setError('Gagal memuat data monitoring server. Periksa koneksi ke server API.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [apiBase]);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const memoryBarColor = (percent: number) => {
    if (percent >= 90) return 'bg-rose-500';
    if (percent >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  const cpuValues = history.map((p) => p.cpuPercent);
  const memoryValues = history.map((p) => p.memoryPercent);
  const diskValues = history.map((p) => p.diskPercent);

  return (
    <PortalLayout role="superadmin" userName="Super Administrator" userIdText="Sistem Informasi Akademik Terpadu">
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#1e40af] rounded-2xl p-6 sm:p-8 text-white shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-white/10 text-[#D4A017] mb-2">
                Kesehatan Sistem
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
                <Activity className="w-6 h-6 text-[#D4A017]" />
                Monitoring Server
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-1">
                Status resource server, latensi database, dan konektivitas layanan secara real-time.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {health && (
                <div
                  className={`flex items-center gap-2 border rounded-xl px-4 py-2 ${
                    health.summary.isAllNormal ? 'bg-emerald-400/15 border-emerald-400/40' : 'bg-amber-400/15 border-amber-400/40'
                  }`}
                >
                  {health.summary.isAllNormal ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-amber-300 shrink-0" />
                  )}
                  <span className={`text-xs font-semibold ${health.summary.isAllNormal ? 'text-emerald-200' : 'text-amber-200'}`}>
                    {health.summary.onlineCount}/{health.summary.totalCount} Layanan Online
                  </span>
                </div>
              )}
              <button
                onClick={() => loadData(true)}
                disabled={isRefreshing}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-60"
                title="Segarkan"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 flex items-center justify-center gap-2 text-slate-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Memuat data monitoring...
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-sm text-rose-700 flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        ) : health ? (
          <>
            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Server className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Server</p>
                </div>
                <p className="text-sm font-bold text-slate-800 truncate" title={health.server.hostname}>{health.server.hostname}</p>
                <p className="text-xs text-slate-500 mt-0.5">{health.server.platform}</p>
                <p className="text-xs text-slate-500">Node.js {health.server.nodeVersion} &bull; PID {health.server.pid}</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Uptime</p>
                </div>
                <p className="text-sm font-bold text-slate-800">Proses API: {formatUptime(health.server.processUptimeSeconds)}</p>
                <p className="text-xs text-slate-500 mt-0.5">Server OS: {formatUptime(health.server.osUptimeSeconds)}</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">CPU</p>
                </div>
                <p className="text-sm font-bold text-slate-800">{health.cpu.cores} Core</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate" title={health.cpu.model}>{health.cpu.model}</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Database</p>
                </div>
                <p className={`text-sm font-bold ${health.database.isOnline ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {health.database.isOnline ? 'Terhubung' : 'Terputus'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Latensi: {health.database.latencyMs}ms</p>
              </div>
            </div>

            {/* Real-time Usage Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <UsageChart
                title="Penggunaan CPU"
                icon={<Cpu className="w-5 h-5 text-white" />}
                colorClass="bg-orange-500"
                strokeColor="#f97316"
                fillId="cpuGradient"
                values={cpuValues}
                currentLabel={`${health.cpu.cores} core aktif`}
              />
              <UsageChart
                title="Penggunaan RAM"
                icon={<MemoryStick className="w-5 h-5 text-white" />}
                colorClass="bg-indigo-600"
                strokeColor="#4f46e5"
                fillId="ramGradient"
                values={memoryValues}
                currentLabel={`${health.memory.usedMB.toLocaleString('id-ID')} / ${health.memory.totalMB.toLocaleString('id-ID')} MB`}
              />
              <UsageChart
                title="Penggunaan Storage"
                icon={<HardDrive className="w-5 h-5 text-white" />}
                colorClass="bg-emerald-600"
                strokeColor="#059669"
                fillId="diskGradient"
                values={diskValues}
                currentLabel={`${health.disk.usedGB.toLocaleString('id-ID')} / ${health.disk.totalGB.toLocaleString('id-ID')} GB`}
              />
            </div>

            {/* Memory Detail */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-slate-50">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <MemoryStick className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Detail Penggunaan Memori & Storage</h2>
                  <p className="text-xs text-slate-500">Memori fisik server, proses API, dan kapasitas disk</p>
                </div>
              </div>
              <div className="p-5 space-y-5">
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span>RAM: {health.memory.usedMB.toLocaleString('id-ID')} MB terpakai dari {health.memory.totalMB.toLocaleString('id-ID')} MB</span>
                    <span>{health.memory.usagePercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${memoryBarColor(health.memory.usagePercent)}`}
                      style={{ width: `${Math.min(health.memory.usagePercent, 100)}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                    <span>Storage: {health.disk.usedGB.toLocaleString('id-ID')} GB terpakai dari {health.disk.totalGB.toLocaleString('id-ID')} GB</span>
                    <span>{health.disk.usagePercent}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${memoryBarColor(health.disk.usagePercent)}`}
                      style={{ width: `${Math.min(health.disk.usagePercent, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <p className="text-slate-500">RAM Bebas</p>
                    <p className="font-bold text-slate-800">{health.memory.freeMB.toLocaleString('id-ID')} MB</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Storage Bebas</p>
                    <p className="font-bold text-slate-800">{health.disk.freeGB.toLocaleString('id-ID')} GB</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Heap Proses API</p>
                    <p className="font-bold text-slate-800">{health.memory.processHeapUsedMB} MB</p>
                  </div>
                  <div>
                    <p className="text-slate-500">RSS Proses API</p>
                    <p className="font-bold text-slate-800">{health.memory.processRssMB} MB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Status */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 p-5 border-b border-slate-100 bg-slate-50">
                <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800">Status Layanan</h2>
                  <p className="text-xs text-slate-500">Konektivitas layanan inti yang digunakan sistem SIAKAD</p>
                </div>
              </div>
              <div className="divide-y divide-slate-50">
                {health.services.map((s) => (
                  <div key={s.name} className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{s.name}</p>
                        <p className="text-xs text-slate-500">{s.desc}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${s.isOnline ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {s.isOnline ? 'Online' : 'Offline'}
                      </p>
                      <p className="text-[11px] text-slate-400">{s.responseTime}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {lastFetchedAt && (
              <p className="text-xs text-slate-400 text-center">
                Terakhir diperbarui: {lastFetchedAt.toLocaleTimeString('id-ID')} &bull; Menyegarkan otomatis setiap 5 detik &bull; Riwayat grafik hingga 15 menit terakhir
              </p>
            )}
          </>
        ) : null}
      </div>
    </PortalLayout>
  );
}
