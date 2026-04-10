'use client';

import { useEffect, useCallback } from 'react';
import ws from '../lib/ws';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import api from '../lib/axios';

export const useSocket = () => {
  const { user } = useAuthStore();
  const {
    addMessage,
    setOnlineUsers,
    updateMessageStatus,
    addTypingUser,
    removeTypingUser,
    fetchUnreadCount,
  } = useChatStore();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token || !user) return;

    // Connect (no-op if already connected)
    ws.connect(token);

    // ── Event handlers ──────────────────────────────────────────────────────
    const offReceived = ws.on('message:received', (data) => {
      const msg = data as Parameters<typeof addMessage>[0];
      const state = useChatStore.getState();
      
      addMessage(msg);
      
      if (state.activeConversation === msg.conversationId) {
        // Automatically tell server we read it
        ws.send('messages:read:all', { 
          conversationId: msg.conversationId, 
          senderId: typeof msg.sender === 'string' ? msg.sender : msg.sender._id 
        });
        useChatStore.getState().markAllReadByConversation(msg.conversationId);
      } else {
        fetchUnreadCount();
      }
    });
    const offSent = ws.on('message:sent', (data) => {
      addMessage(data as Parameters<typeof addMessage>[0]);
    });
    const offDelivered = ws.on('message:delivered', (data: unknown) => {
      const { messageId } = data as { messageId: string };
      updateMessageStatus(messageId, 'delivered');
    });
    const offReadAck = ws.on('message:read:ack', (data: unknown) => {
      const { messageId } = data as { messageId: string };
      updateMessageStatus(messageId, 'read');
    });
    const offReadAllAck = ws.on('messages:read:all:ack', (data: unknown) => {
      const { conversationId } = data as { conversationId: string };
      useChatStore.getState().markAllReadByConversation(conversationId);
    });
    const offOnline = ws.on('user:online', (data: unknown) => {
      const { onlineUsers } = data as { onlineUsers: { userId: string }[] };
      setOnlineUsers(onlineUsers);
    });
    const offOffline = ws.on('user:offline', (data: unknown) => {
      const { onlineUsers } = data as { onlineUsers: { userId: string }[] };
      setOnlineUsers(onlineUsers);
    });
    const offTypingStart = ws.on('typing:start', (data: unknown) => {
      const { userId } = data as { userId: string };
      addTypingUser(userId);
    });
    const offTypingStop = ws.on('typing:stop', (data: unknown) => {
      const { userId } = data as { userId: string };
      removeTypingUser(userId);
    });

    return () => {
      offReceived();
      offSent();
      offDelivered();
      offReadAck();
      offReadAllAck();
      offOnline();
      offOffline();
      offTypingStart();
      offTypingStop();
      // Note: we do NOT call ws.disconnect() here — the socket should stay alive
      // while the user is logged in, even when navigating between pages.
    };
  }, [user]);

  // ── Actions ─────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async (
    receiverId: string,
    content: string,
    messageType = 'text',
    mediaUrl?: string,
    encrypted?: boolean
  ) => {
    if (ws.connected) {
      ws.send('message:send', { receiverId, content, messageType, mediaUrl, encrypted });
    } else {
      // HTTP fallback when WebSocket is not connected
      try {
        const { data } = await api.post('/chat/send', {
          receiverId, content, messageType, mediaUrl, encrypted,
        });
        if (data?.data) {
          useChatStore.getState().addMessage(data.data);
        }
      } catch (err) {
        console.error('Failed to send message:', err);
      }
    }
  }, []);

  const markAsRead = useCallback((messageId: string, senderId: string) => {
    ws.send('message:read', { messageId, senderId });
  }, []);

  const markAllAsRead = useCallback((conversationId: string, senderId: string) => {
    ws.send('messages:read:all', { conversationId, senderId });
  }, []);

  const startTyping = useCallback((receiverId: string) => {
    ws.send('typing:start', { receiverId });
  }, []);

  const stopTyping = useCallback((receiverId: string) => {
    ws.send('typing:stop', { receiverId });
  }, []);

  return { sendMessage, markAsRead, markAllAsRead, startTyping, stopTyping };
};
