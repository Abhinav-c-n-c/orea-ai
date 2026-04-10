'use client';

// ── Determine WebSocket URL ────────────────────────────────────────────────────
// Dev:  ws://localhost:3900/ws  (direct to backend, bypasses Next.js which can't proxy WS)
// Prod: Set NEXT_PUBLIC_WS_URL=wss://your-backend.vercel.app/ws in Vercel frontend env vars
//       Falls back to same-origin /ws which works if frontend + backend are on same domain.
const getWsUrl = (): string => {
  if (typeof window === 'undefined') return '';

  // 1. If explicit WS URL is provided, use it
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }

  // 2. Derive from API URL if available
  // If API is https://api.example.com/api, WS should be wss://api.example.com/ws
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.startsWith('http')) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const wsUrl = apiUrl.replace(/^http/, 'ws').replace(/\/api$/, '') + '/ws';
    return wsUrl;
  }

  // 3. Auto-detect protocol (wss for https, ws for http)
  const isHttps = window.location.protocol === 'https:';
  const protocol = isHttps ? 'wss:' : 'ws:';
  const host = window.location.host;

  // 4. Local development fallback (if no env vars)
  if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
    return 'ws://localhost:3900/ws';
  }

  // 5. Last resort: use current host (works for unified deployments/proxies)
  return `${protocol}//${host}/ws`;
};

// ── Types ─────────────────────────────────────────────────────────────────────
type MessageHandler = (data: unknown) => void;
type ConnectionHandler = (online: boolean) => void;

// ── Singleton WS Manager ──────────────────────────────────────────────────────
class WSManager {
  private ws: WebSocket | null = null;
  private token: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectAttempts = 0;
  private destroyed = false;

  private listeners = new Map<string, Set<MessageHandler>>();
  private connectionListeners = new Set<ConnectionHandler>();
  private isConnected = false;

  // ── Connect ────────────────────────────────────────────────────────────────
  connect(token: string): void {
    if (this.token === token && this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      return; // Already connected or connecting with the same token
    }
    this.token = token;
    this.destroyed = false;
    this._openSocket();
  }

  private _openSocket(): void {
    if (this.destroyed) return;

    const url = getWsUrl();
    if (!url) return;

    try {
      this.ws = new WebSocket(url);
    } catch (err) {
      console.error('WS open error:', err);
      this._scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log('🔌 WS connected');
      this.reconnectAttempts = 0;
      // Authenticate immediately
      this._rawSend({ type: 'auth', data: { token: this.token } });
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const { type, data } = msg;

        if (type === 'auth:success') {
          this.isConnected = true;
          this._notifyConnection(true);
          this._startPing();
          return;
        }

        if (type === 'auth:error' || type === 'auth:replaced') {
          console.error('WS auth issue. Halting connection:', type);
          this.disconnect(); // prevent endless reconnect loops
          return;
        }

        if (type === 'pong') {
          return; // heartbeat acknowledged
        }

        // Dispatch to all registered listeners for this type
        const handlers = this.listeners.get(type);
        if (handlers) {
          handlers.forEach((h) => h(data));
        }
      } catch {
        // invalid JSON, ignore
      }
    };

    this.ws.onclose = () => {
      this._stopPing();
      if (this.isConnected) {
        this.isConnected = false;
        this._notifyConnection(false);
      }
      if (!this.destroyed) {
        this._scheduleReconnect();
      }
    };

    this.ws.onerror = (err) => {
      console.error('WS error:', err);
    };
  }

  // ── Send a message ─────────────────────────────────────────────────────────
  send(type: string, data?: unknown): void {
    this._rawSend({ type, data });
  }

  private _rawSend(payload: unknown): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  // ── Listen for events ──────────────────────────────────────────────────────
  on(type: string, handler: MessageHandler): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
    return () => this.off(type, handler);
  }

  off(type: string, handler: MessageHandler): void {
    this.listeners.get(type)?.delete(handler);
  }

  // ── Connection state ───────────────────────────────────────────────────────
  onConnectionChange(handler: ConnectionHandler): () => void {
    this.connectionListeners.add(handler);
    return () => this.connectionListeners.delete(handler);
  }

  isOnline(): boolean {
    return this.isConnected;
  }

  // ── Disconnect ─────────────────────────────────────────────────────────────
  disconnect(): void {
    this.destroyed = true;
    this._stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.onclose = null; // prevent reconnect on explicit disconnect
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }

  // ── Heartbeat ─────────────────────────────────────────────────────────────
  private _startPing(): void {
    this._stopPing();
    this.pingTimer = setInterval(() => {
      this._rawSend({ type: 'ping' });
    }, 25000);
  }

  private _stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  // ── Auto-reconnect with exponential backoff ────────────────────────────────
  private _scheduleReconnect(): void {
    if (this.destroyed) return;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
    this.reconnectAttempts++;
    console.log(`🔌 WS reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    this.reconnectTimer = setTimeout(() => {
      this._openSocket();
    }, delay);
  }

  private _notifyConnection(online: boolean): void {
    this.connectionListeners.forEach((h) => h(online));
  }

  get connected(): boolean {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }
}

// ── Singleton export ───────────────────────────────────────────────────────────
const wsManager = new WSManager();
export default wsManager;
