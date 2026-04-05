// This file is kept for backward compatibility.
// All functionality has been migrated to lib/ws.ts (raw WebSocket).
export { default as wsManager } from './ws';
export const connectSocket = (token: string) => {
  const { default: ws } = require('./ws');
  ws.connect(token);
  return ws;
};
export const disconnectSocket = () => {
  const { default: ws } = require('./ws');
  ws.disconnect();
};
export const getSocket = () => {
  const { default: ws } = require('./ws');
  return ws.connected ? ws : null;
};
export const onConnectionChange = (handler: (online: boolean) => void) => {
  const { default: ws } = require('./ws');
  return ws.onConnectionChange(handler);
};
export const isNetworkOnline = () => {
  const { default: ws } = require('./ws');
  return ws.isOnline();
};
