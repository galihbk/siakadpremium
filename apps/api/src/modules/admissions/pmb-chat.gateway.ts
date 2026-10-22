import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway } from '@nestjs/websockets';
import type { WebSocket } from 'ws';

/** Peran panitia yang boleh menerima sinyal chat (sama dengan hak akses /admissions/admin/pmb/chat). */
const STAFF_ROLES = new Set(['ADMIN_PMB', 'ADMIN_BAAK', 'STAFF', 'SUPER_ADMIN']);

/** Batas pengaman memori: satu akun paling banyak 5 tab, seluruh server paling banyak 5000 koneksi. */
const MAX_PER_CHANNEL = 5;
const MAX_TOTAL = 5000;
const AUTH_TIMEOUT_MS = 5000;
const HEARTBEAT_MS = 30000;

interface Conn {
  ws: WebSocket;
  channel: string | null;
  alive: boolean;
  authTimer: NodeJS.Timeout | null;
}

/**
 * Sinyal real-time live chat PMB lewat WebSocket (`/ws/chat`).
 *
 * Sengaja sangat ringan: server HANYA mengirim sinyal kecil ("ada yang berubah"), lalu klien mengambil datanya lewat
 * REST yang sudah ada. Dengan begitu hak akses dan bentuk data tetap satu sumber, dan tiap koneksi hanya menyimpan
 * satu objek kecil di memori (tanpa timer per koneksi; satu detak jantung bersama untuk semuanya).
 *
 * Protokol:
 *  - klien -> server: {"event":"auth","data":{"token":"<JWT>"}} dalam 5 detik setelah tersambung
 *  - server -> klien: {"type":"ready"}, lalu {"type":"chat"} / {"type":"status"} bila ada perubahan
 */
@WebSocketGateway({ path: '/ws/chat', maxPayload: 4096 })
export class PmbChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly log = new Logger('ChatWS');
  private readonly conns = new Map<WebSocket, Conn>();
  private readonly channels = new Map<string, Set<WebSocket>>();
  private heartbeat: NodeJS.Timeout | null = null;

  constructor(private readonly jwt: JwtService) {}

  handleConnection(ws: WebSocket) {
    if (this.conns.size >= MAX_TOTAL) {
      ws.close(1013, 'server penuh');
      return;
    }
    const conn: Conn = { ws, channel: null, alive: true, authTimer: null };
    conn.authTimer = setTimeout(() => ws.close(4001, 'auth timeout'), AUTH_TIMEOUT_MS);
    this.conns.set(ws, conn);
    ws.on('pong', () => {
      conn.alive = true;
    });
    ws.on('message', (raw: Buffer) => this.onMessage(conn, raw));
    ws.on('error', () => ws.terminate());
    this.ensureHeartbeat();
  }

  handleDisconnect(ws: WebSocket) {
    const conn = this.conns.get(ws);
    if (!conn) return;
    if (conn.authTimer) clearTimeout(conn.authTimer);
    if (conn.channel) {
      const set = this.channels.get(conn.channel);
      set?.delete(ws);
      if (set && set.size === 0) this.channels.delete(conn.channel);
    }
    this.conns.delete(ws);
    if (this.conns.size === 0 && this.heartbeat) {
      clearInterval(this.heartbeat);
      this.heartbeat = null;
    }
  }

  private onMessage(conn: Conn, raw: Buffer) {
    if (conn.channel) return; // setelah terautentikasi klien tidak perlu mengirim apa pun
    let msg: any;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return conn.ws.close(4000, 'format salah');
    }
    if (msg?.event !== 'auth' || typeof msg?.data?.token !== 'string') return conn.ws.close(4000, 'auth diperlukan');

    let payload: any;
    try {
      payload = this.jwt.verify(msg.data.token);
    } catch {
      return conn.ws.close(4003, 'token tidak valid');
    }
    let channel: string | null = null;
    if (payload?.role === 'PMB_APPLICANT') channel = `applicant:${payload.sub}`;
    else if (payload?.role === 'PMB_VISITOR') channel = `visitor:${payload.sub}`;
    else if (STAFF_ROLES.has(payload?.role)) channel = 'staff';
    if (!channel) return conn.ws.close(4003, 'peran tidak diizinkan');

    const set = this.channels.get(channel) ?? new Set<WebSocket>();
    if (channel !== 'staff' && set.size >= MAX_PER_CHANNEL) return conn.ws.close(4008, 'terlalu banyak sambungan');
    set.add(conn.ws);
    this.channels.set(channel, set);
    conn.channel = channel;
    if (conn.authTimer) {
      clearTimeout(conn.authTimer);
      conn.authTimer = null;
    }
    this.send(conn.ws, { type: 'ready' });
  }

  private send(ws: WebSocket, payload: Record<string, unknown>) {
    if (ws.readyState === 1) ws.send(JSON.stringify(payload));
  }

  private emit(channel: string, payload: Record<string, unknown>) {
    const set = this.channels.get(channel);
    if (!set) return;
    for (const ws of set) this.send(ws, payload);
  }

  /** Satu detak jantung bersama: memutus koneksi mati dan menjaga koneksi hidup di balik proxy/tunnel. */
  private ensureHeartbeat() {
    if (this.heartbeat) return;
    this.heartbeat = setInterval(() => {
      for (const conn of this.conns.values()) {
        if (!conn.alive) {
          conn.ws.terminate();
          continue;
        }
        conn.alive = false;
        try {
          conn.ws.ping();
        } catch {
          conn.ws.terminate();
        }
      }
    }, HEARTBEAT_MS);
    this.heartbeat.unref?.();
  }

  // ---------------------------------------------------------------- dipanggil PmbChatService

  /** Ada pesan/perubahan percakapan: beri tahu peserta pemilik percakapan. */
  notifyOwner(owner: { accountId?: string | null; visitorKey?: string | null }) {
    if (owner.accountId) this.emit(`applicant:${owner.accountId}`, { type: 'chat' });
    if (owner.visitorKey) this.emit(`visitor:${owner.visitorKey}`, { type: 'chat' });
  }

  /** Ada pesan/perubahan percakapan: beri tahu semua panitia yang sedang membuka portal. */
  notifyStaff(threadId?: string) {
    this.emit('staff', { type: 'chat', threadId });
  }

  /** Pengaturan jam operasional berubah: semua koneksi mengambil ulang status. */
  notifyStatus() {
    for (const ws of this.conns.keys()) this.send(ws, { type: 'status' });
  }
}
