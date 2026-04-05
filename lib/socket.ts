import { io, Socket } from 'socket.io-client';

// In PRODUCTION (Vercel): connect to '/' — Next.js rewrites forward /socket.io/* to the backend.
// Vercel's edge network handles WebSocket upgrades transparently.
// In DEVELOPMENT: connect directly to the backend to bypass Next.js dev-server proxy limitations.
const isProduction = process.env.NODE_ENV === 'production';

const SOCKET_URL = isProduction
  ? '/' // same-origin → Next.js rewrite → backend
  : (process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3900');

let socket: Socket | null = null;
let isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

// Track connection state
const connectionListeners: Array<(online: boolean) => void> = [];

export const onConnectionChange = (listener: (online: boolean) => void) => {
  connectionListeners.push(listener);
  return () => {
    const idx = connectionListeners.indexOf(listener);
    if (idx > -1) connectionListeners.splice(idx, 1);
  };
};

const notifyConnectionChange = (online: boolean) => {
  isOnline = online;
  connectionListeners.forEach((l) => l(online));
};

// Set up browser online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => notifyConnectionChange(true));
  window.addEventListener('offline', () => notifyConnectionChange(false));
}

export const isNetworkOnline = () => isOnline;

export const connectSocket = (token: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  // Disconnect any stale socket before creating a new one
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    // In production on Vercel, use polling only — serverless functions don't maintain
    // persistent WebSocket connections. Polling works as regular HTTP requests.
    // In dev, prefer WebSocket for real-time performance.
    transports: isProduction ? ['polling'] : ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
  });

  socket.on('connect', () => {
    console.log('🔌 Socket connected:', socket?.id);
    notifyConnectionChange(true);
  });

  socket.on('disconnect', (reason) => {
    console.log('🔌 Socket disconnected:', reason);
    if (reason !== 'io client disconnect') {
      notifyConnectionChange(false);
    }
  });

  socket.on('reconnect', () => {
    console.log('🔌 Socket reconnected');
    notifyConnectionChange(true);
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
    notifyConnectionChange(false);
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = (): void => {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
};
