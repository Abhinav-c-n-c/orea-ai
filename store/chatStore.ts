import { create } from 'zustand';
import api from '../lib/axios';
import { IMessage, IConversation } from '../types';

interface ChatState {
  conversations: IConversation[];
  activeConversation: string | null;
  messages: IMessage[];
  onlineUsers: Array<{ userId: string; email: string }>;
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  typingUsers: Set<string>;
  isOffline: boolean;
  fetchConversations: () => Promise<void>;
  fetchMessages: (receiverId: string) => Promise<void>;
  addMessage: (message: IMessage) => void;
  setActiveConversation: (id: string | null) => void;
  setOnlineUsers: (users: Array<{ userId: string; email: string }>) => void;
  updateMessageStatus: (messageId: string, status: 'delivered' | 'read') => void;
  markAllRead: (conversationId: string) => void;
  markAllReadByConversation: (conversationId: string) => void;
  fetchUnreadCount: () => Promise<void>;
  addTypingUser: (userId: string) => void;
  removeTypingUser: (userId: string) => void;
  setOffline: (offline: boolean) => void;
  clearError: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  onlineUsers: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  typingUsers: new Set(),
  isOffline: false,

  fetchConversations: async () => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.get('/chat/conversations');
      set({ conversations: data.data, isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({
        error: err.response?.data?.message || 'Failed to fetch conversations',
        isLoading: false,
      });
    }
  },

  fetchMessages: async (receiverId) => {
    try {
      set({ isLoading: true, error: null });
      const { data } = await api.get(`/chat/messages/${receiverId}`);
      set({ messages: data.data, isLoading: false });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      set({ error: err.response?.data?.message || 'Failed to fetch messages', isLoading: false });
    }
  },

  addMessage: (message) => {
    set((state) => ({
      messages: [...state.messages, message],
      conversations: state.conversations.map((c) =>
        c.conversationId === message.conversationId
          ? {
              ...c,
              lastMessage: {
                content: message.content,
                createdAt: message.createdAt,
                sender: typeof message.sender === 'string' ? message.sender : message.sender._id,
                read: message.read,
              },
            }
          : c
      ),
    }));
  },

  setActiveConversation: (id) => set({ activeConversation: id }),

  setOnlineUsers: (users) => set({ onlineUsers: users }),

  updateMessageStatus: (messageId, status) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m._id === messageId
          ? { ...m, [status]: true, [`${status}At`]: new Date().toISOString() }
          : m
      ),
    }));
  },

  markAllRead: (conversationId) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.conversationId === conversationId ? { ...m, read: true } : m
      ),
      conversations: state.conversations.map((c) =>
        c.conversationId === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    }));
  },

  markAllReadByConversation: (conversationId) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.conversationId === conversationId ? { ...m, read: true } : m
      ),
    }));
  },

  fetchUnreadCount: async () => {
    try {
      const { data } = await api.get('/chat/unread');
      set({ unreadCount: data.data.unreadCount });
    } catch {
      // silent fail
    }
  },

  addTypingUser: (userId) => {
    set((state) => {
      const newSet = new Set(state.typingUsers);
      newSet.add(userId);
      return { typingUsers: newSet };
    });
  },

  removeTypingUser: (userId) => {
    set((state) => {
      const newSet = new Set(state.typingUsers);
      newSet.delete(userId);
      return { typingUsers: newSet };
    });
  },

  setOffline: (offline) => set({ isOffline: offline }),

  clearError: () => set({ error: null }),
}));
