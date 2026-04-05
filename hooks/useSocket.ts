'use client';

import { useEffect, useRef, useCallback } from 'react';
import { connectSocket, disconnectSocket, getSocket, onConnectionChange, isNetworkOnline } from '../lib/socket';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { getPendingMessages, removePendingMessage } from '../lib/offlineDb';

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
  const initialized = useRef(false);

  // Flush pending messages when back online
  const flushPendingMessages = useCallback(async () => {
    const socket = getSocket();
    if (!socket?.connected) return;

    try {
      const pending = await getPendingMessages();
      for (const msg of pending) {
        socket.emit('message:send', {
          receiverId: msg.receiverId,
          content: msg.content,
          messageType: msg.messageType,
          mediaUrl: msg.mediaUrl,
          encrypted: msg.encrypted,
        });
        await removePendingMessage(msg.id);
      }
    } catch (error) {
      console.error('Failed to flush pending messages:', error);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token || !user || initialized.current) return;

    initialized.current = true;
    const socket = connectSocket(token);

    socket.on('message:received', (message) => {
      addMessage(message);
      fetchUnreadCount();
    });

    socket.on('message:sent', (message) => {
      addMessage(message);
    });

    socket.on('message:delivered', ({ messageId }) => {
      updateMessageStatus(messageId, 'delivered');
    });

    socket.on('message:read:ack', ({ messageId }) => {
      updateMessageStatus(messageId, 'read');
    });

    socket.on('messages:read:all:ack', ({ conversationId }) => {
      useChatStore.getState().markAllReadByConversation(conversationId);
    });

    socket.on('user:online', ({ onlineUsers }) => {
      setOnlineUsers(onlineUsers);
    });

    socket.on('user:offline', ({ onlineUsers }) => {
      setOnlineUsers(onlineUsers);
    });

    socket.on('typing:start', ({ userId }) => {
      addTypingUser(userId);
    });

    socket.on('typing:stop', ({ userId }) => {
      removeTypingUser(userId);
    });

    // Flush pending messages on connect
    socket.on('connect', () => {
      flushPendingMessages();
    });

    // Also listen for online/offline changes
    const unsubscribe = onConnectionChange((online) => {
      if (online) {
        flushPendingMessages();
      }
    });

    // Flush any existing pending messages on init
    if (isNetworkOnline()) {
      flushPendingMessages();
    }

    return () => {
      initialized.current = false;
      unsubscribe();
      disconnectSocket();
    };
  }, [user]);

  const sendMessage = (receiverId: string, content: string, messageType = 'text', mediaUrl?: string, encrypted?: boolean) => {
    const socket = getSocket();
    if (socket?.connected) {
      socket.emit('message:send', { receiverId, content, messageType, mediaUrl, encrypted });
    }
  };

  const markAsRead = (messageId: string, senderId: string) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('message:read', { messageId, senderId });
    }
  };

  const markAllAsRead = (conversationId: string, senderId: string) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('messages:read:all', { conversationId, senderId });
    }
  };

  const startTyping = (receiverId: string) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('typing:start', { receiverId });
    }
  };

  const stopTyping = (receiverId: string) => {
    const socket = getSocket();
    if (socket) {
      socket.emit('typing:stop', { receiverId });
    }
  };

  return { sendMessage, markAsRead, markAllAsRead, startTyping, stopTyping, flushPendingMessages };
};
