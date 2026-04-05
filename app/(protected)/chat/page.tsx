'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  FiSend,
  FiPaperclip,
  FiMic,
  FiVideo,
  FiX,
  FiSearch,
  FiEdit3,
  FiPhone,
  FiMoreVertical,
  FiFile,
  FiChevronLeft,
  FiCheck,
  FiShield,
  FiMessageSquare,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Header from '../../../components/Header';
import { useChatStore } from '../../../store/chatStore';
import { useAuthStore } from '../../../store/authStore';
import { useSocket } from '../../../hooks/useSocket';
import { getInitials, timeAgo, formatChatDate } from '../../../utils/formatters';
import api from '../../../lib/axios';
import { IUser, IMessage } from '../../../types';
import { uploadToCloudinary } from '../../../lib/cloudinary';
import { encryptMessage, decryptMessage } from '../../../lib/crypto';
import { addPendingMessage, getPendingCount } from '../../../lib/offlineDb';
import { isNetworkOnline, onConnectionChange } from '../../../lib/socket';

export default function ChatPage() {
  const {
    conversations,
    messages,
    onlineUsers,
    typingUsers,
    fetchConversations,
    fetchMessages,
    setActiveConversation,
    activeConversation,
    fetchUnreadCount,
    markAllRead,
  } = useChatStore();
  const { user } = useAuthStore();
  const { sendMessage, startTyping, stopTyping, markAllAsRead } = useSocket();
  const [messageText, setMessageText] = useState('');
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [users, setUsers] = useState<IUser[]>([]);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [showMobileChat, setShowMobileChat] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingType, setRecordingType] = useState<'audio' | 'video' | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploading, setUploading] = useState(false);

  // Decrypted messages and sidebar previews
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({});
  const [decryptedPreviews, setDecryptedPreviews] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchConversations();
    fetchUnreadCount();

    // Track online/offline
    setIsOnline(isNetworkOnline());
    const unsubscribe = onConnectionChange((online) => {
      setIsOnline(online);
    });

    // Check pending count
    getPendingCount().then(setPendingCount);

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Decrypt conversion previews
  useEffect(() => {
    if (!user || conversations.length === 0) return;

    const decryptPreviews = async () => {
      const newPreviews: Record<string, string> = { ...decryptedPreviews };
      let changed = false;

      for (const conv of conversations) {
        if (!newPreviews[conv.conversationId]) {
          const senderId = conv.lastMessage.sender;
          const receiverId = user?._id === senderId ? conv.otherUser._id : user?._id;
          if (receiverId) {
            newPreviews[conv.conversationId] = await decryptMessage(conv.lastMessage.content, senderId, receiverId);
            changed = true;
          }
        }
      }
      if (changed) setDecryptedPreviews(newPreviews);
    };

    decryptPreviews();
  }, [conversations, user]);

  // Decrypt messages on load
  useEffect(() => {
    if (!user || messages.length === 0) return;

    const decryptAll = async () => {
      const newDecrypted: Record<string, string> = { ...decryptedMessages };
      let changed = false;

      for (const msg of messages) {
        if (!newDecrypted[msg._id]) {
          if (msg.encrypted) {
            const senderId = typeof msg.sender === 'string' ? msg.sender : msg.sender._id;
            const receiverId = typeof msg.receiver === 'string' ? msg.receiver : msg.receiver._id;
            newDecrypted[msg._id] = await decryptMessage(msg.content, senderId, receiverId);
          } else {
            newDecrypted[msg._id] = msg.content;
          }
          changed = true;
        }
      }
      if (changed) setDecryptedMessages(newDecrypted);
    };

    decryptAll();
  }, [messages, user]);

  const loadUsers = async () => {
    try {
      const { data } = await api.get('/users/chat');
      setUsers(data.data);
    } catch { /* */ }
  };

  const handleSelectConversation = async (conv: (typeof conversations)[0]) => {
    const otherId = conv.otherUser._id;
    setSelectedUser(conv.otherUser);
    setActiveConversation(conv.conversationId);
    setShowMobileChat(true);
    await fetchMessages(otherId);
    markAllRead(conv.conversationId);
    markAllAsRead(conv.conversationId, otherId);
  };

  const handleNewChat = async (u: IUser) => {
    setSelectedUser(u);
    setShowMobileChat(true);
    await fetchMessages(u._id);
    setShowNewChat(false);
    fetchConversations();
  };

  const handleSend = async () => {
    if (!messageText.trim() || !selectedUser || !user) return;

    const encrypted = await encryptMessage(messageText.trim(), user._id, selectedUser._id);

    if (isOnline) {
      sendMessage(selectedUser._id, encrypted, 'text', undefined, true);
    } else {
      await addPendingMessage({
        receiverId: selectedUser._id,
        content: encrypted,
        messageType: 'text',
        encrypted: true,
      });
      const count = await getPendingCount();
      setPendingCount(count);
    }

    setMessageText('');
    if (selectedUser) stopTyping(selectedUser._id);
  };

  const handleTyping = () => {
    if (!selectedUser) return;
    startTyping(selectedUser._id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedUser._id);
    }, 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !selectedUser || !user) return;
    setUploading(true);
    try {
      const file = e.target.files[0];
      let type: 'image' | 'video' | 'audio' | 'raw' = 'image';
      let messageType: 'image' | 'video' | 'audio' | 'file' = 'image';

      if (file.type.startsWith('video/')) {
        type = 'video';
        messageType = 'video';
      } else if (file.type.startsWith('audio/')) {
        type = 'audio';
        messageType = 'audio';
      } else if (!file.type.startsWith('image/')) {
        type = 'raw';
        messageType = 'file';
      }

      const result = await uploadToCloudinary(file, type);
      sendMessage(selectedUser._id, file.name, messageType, result.url, false);
    } catch (error) {
      console.error('File upload failed:', error);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Recording functions
  const startRecording = async (type: 'audio' | 'video') => {
    try {
      const constraints = type === 'audio' ? { audio: true } : { audio: true, video: true };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(recordedChunksRef.current, { type: type === 'audio' ? 'audio/webm' : 'video/webm' });
        
        if (selectedUser && user) {
          setUploading(true);
          try {
            const result = await uploadToCloudinary(blob, type);
            sendMessage(selectedUser._id, `${type} message`, type, result.url, false);
          } catch (error) {
            console.error('Upload failed:', error);
          }
          setUploading(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingType(type);
      setRecordingTime(0);

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((t: number) => t + 1);
      }, 1000);
    } catch (error) {
      console.error('Could not start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingType(null);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setRecordingTime(0);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      if (mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current.stream?.getTracks().forEach(t => t.stop());
    }
    recordedChunksRef.current = [];
    setIsRecording(false);
    setRecordingType(null);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setRecordingTime(0);
  };

  const formatRecordingTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const isUserOnline = (userId: string) => onlineUsers.some(u => u.userId === userId);
  const isTyping = selectedUser ? typingUsers.has(selectedUser._id) : false;
  
  const getMessageContent = (msg: IMessage) => decryptedMessages[msg._id] || msg.content;

  const renderTicks = (msg: IMessage, isMine: boolean) => {
    if (!isMine) return null;
    if (msg.read) return <><FiCheck className="inline w-3 h-3 text-primary-400 group-hover:text-primary-300" /><FiCheck className="inline w-3 h-3 -ml-1 text-primary-400" /></>;
    return <FiCheck className="inline w-3 h-3 text-primary-300 opacity-50" />;
  };

  const renderMedia = (msg: IMessage) => {
    if (!msg.mediaUrl) return null;
    switch (msg.messageType) {
      case 'image': return <img src={msg.mediaUrl} alt="" className="max-w-full rounded-[4px] mt-2 border border-primary-100 dark:border-slate-700" />;
      case 'video': return <video src={msg.mediaUrl} controls className="max-w-full rounded-[4px] mt-2" />;
      case 'audio': return <audio src={msg.mediaUrl} controls className="mt-2 w-full" />;
      default: return (
        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-2 p-3 bg-primary-50 dark:bg-slate-700 rounded-[4px] text-xs font-bold uppercase tracking-wider">
          <FiFile className="w-4 h-4" /> Download File
        </a>
      );
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-surface-50 dark:bg-slate-950 p-6 gap-6">
      <Header 
        title="Team Chat" 
        subtitle="Secure end-to-end encrypted messaging"
        icon={<FiMessageSquare className="w-5 h-5" />}
      >
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-[4px] text-xs font-bold uppercase tracking-widest ${isOnline ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}`}>
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></div>
          {isOnline ? 'Network Online' : 'Network Offline'}
          {!isOnline && pendingCount > 0 && <span className="ml-1 opacity-70">({pendingCount} Pending)</span>}
        </div>
      </Header>

      <div className="flex-1 flex min-h-0 gap-6">
        {/* Conversation List */}
        <div className={`w-full md:w-[320px] bg-white dark:bg-slate-900 rounded-[4px] shadow-xl border border-primary-100 dark:border-slate-800 flex flex-col h-full transition-all ${showMobileChat ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-primary-50 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black text-surface-900 dark:text-white uppercase tracking-widest">Conversations</h2>
              <button onClick={() => { setShowNewChat(true); loadUsers(); }} className="p-2 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-[4px] text-primary-600 transition-colors">
                <FiEdit3 className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface-50 dark:bg-slate-800 rounded-[4px] text-xs border border-transparent focus:border-primary-500 outline-none transition-all dark:text-white"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {conversations
              .filter(c => c.otherUser.name.toLowerCase().includes(searchTerm.toLowerCase()))
              .map(conv => (
                <div
                  key={conv.conversationId}
                  onClick={() => handleSelectConversation(conv)}
                  className={`flex items-center gap-3 p-4 cursor-pointer transition-all border-b border-primary-50/30 dark:border-slate-800/50 hover:bg-primary-50/50 dark:hover:bg-slate-800/50 ${activeConversation === conv.conversationId ? 'bg-primary-50 dark:bg-slate-800 border-r-4 border-r-primary-500' : ''}`}
                >
                  <div className="relative flex-shrink-0">
                    <div className="w-10 h-10 rounded-[4px] bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm">
                      {getInitials(conv.otherUser.name)}
                    </div>
                    {isUserOnline(conv.otherUser._id) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="text-sm font-bold text-surface-900 dark:text-white truncate">{conv.otherUser.name}</span>
                      <span className="text-[10px] text-surface-400 font-medium">{timeAgo(conv.lastMessage.createdAt)}</span>
                    </div>
                    <p className="text-xs text-surface-500 dark:text-slate-400 truncate font-medium">
                      {decryptedPreviews[conv.conversationId] || conv.lastMessage.content}
                    </p>
                  </div>
                  {conv.unreadCount > 0 && (
                    <div className="bg-primary-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                      {conv.unreadCount}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Chat Box */}
        <div className={`flex-1 bg-white dark:bg-slate-900 rounded-[4px] shadow-2xl border border-primary-100 dark:border-slate-800 flex flex-col overflow-hidden transition-all ${showMobileChat ? 'flex' : 'hidden md:flex'}`}>
          {selectedUser ? (
            <>
              <div className="px-6 py-4 border-b border-primary-50 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <button onClick={() => setShowMobileChat(false)} className="md:hidden p-2 hover:bg-surface-100 dark:hover:bg-slate-800 rounded-lg">
                    <FiChevronLeft className="w-5 h-5 text-surface-500" />
                  </button>
                  <div className="relative">
                    <div className="w-10 h-10 rounded-[4px] bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {getInitials(selectedUser.name)}
                    </div>
                    {isUserOnline(selectedUser._id) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-surface-900 dark:text-white tracking-tight">{selectedUser.name}</h3>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                      {isTyping ? 'Typing...' : isUserOnline(selectedUser._id) ? 'Active Now' : 'Offline'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2.5 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-[4px] text-surface-400 transition-colors">
                    <FiPhone className="w-4 h-4" />
                  </button>
                  <button className="p-2.5 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-[4px] text-surface-400 transition-colors">
                    <FiVideo className="w-4 h-4" />
                  </button>
                  <button onClick={() => setShowUserDetail(!showUserDetail)} className={`p-2.5 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-[4px] text-surface-400 transition-colors ${showUserDetail ? 'bg-primary-50 text-primary-600' : ''}`}>
                    <FiMoreVertical className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar bg-primary-50/10 dark:bg-slate-950/20">
                <div className="flex justify-center mb-8">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary-600/10 dark:bg-primary-500/10 rounded-[4px] border border-primary-200/50 dark:border-primary-500/20">
                    <FiShield className="w-3 h-3 text-primary-600" />
                    <span className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">End-to-End Encrypted Tunnel</span>
                  </div>
                </div>

                {messages.map((msg, idx) => {
                  const isMine = (typeof msg.sender === 'string' ? msg.sender : msg.sender._id) === user?._id;
                  const showDate = idx === 0 || formatChatDate(messages[idx-1].createdAt) !== formatChatDate(msg.createdAt);

                  return (
                    <div key={msg._id}>
                      {showDate && (
                        <div className="flex justify-center my-6">
                          <span className="text-[10px] font-black text-surface-400 uppercase tracking-[0.2em]">{formatChatDate(msg.createdAt)}</span>
                        </div>
                      )}
                      <div className={`flex ${isMine ? 'justify-end' : 'justify-start'} group mb-2`}>
                        <div className={`max-w-[70%] ${isMine ? 'bg-primary-600 text-white rounded-[20px] rounded-br-none shadow-lg shadow-primary-600/20' : 'bg-white dark:bg-slate-800 text-surface-900 dark:text-white rounded-[20px] rounded-bl-none shadow-sm border border-primary-50 dark:border-slate-700'} px-5 py-3 text-sm`}>
                          {renderMedia(msg)}
                          {msg.messageType !== 'file' && <p className="leading-relaxed font-medium">{getMessageContent(msg)}</p>}
                          <div className={`flex justify-end items-center gap-1.5 mt-1.5 opacity-70`}>
                            <span className="text-[9px] font-bold uppercase">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {renderTicks(msg, isMine)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 md:p-6 bg-white dark:bg-slate-900 border-t border-primary-50 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  {isRecording ? (
                    <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-500/10 rounded-[4px] border border-red-100 dark:border-red-900/50 flex-1">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full recording-pulse"></div>
                      <span className="text-sm font-bold text-red-600 dark:text-red-400 flex-1">
                        Recording {recordingType}... {formatRecordingTime(recordingTime)}
                      </span>
                      <button onClick={cancelRecording} className="p-2 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg text-red-500 transition-colors">
                        <FiX className="w-5 h-5" />
                      </button>
                      <button onClick={stopRecording} className="p-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-sm">
                        <FiCheck className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => fileInputRef.current?.click()} className="p-3 hover:bg-primary-50 dark:hover:bg-slate-800 rounded-[4px] text-surface-400 transition-colors">
                        <FiPaperclip className="w-5 h-5" />
                      </button>
                      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                      
                      <div className="flex-1 relative">
                        <input
                          type="text"
                          value={messageText}
                          onChange={(e) => { setMessageText(e.target.value); handleTyping(); }}
                          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                          placeholder="Compose message..."
                          className="w-full px-5 py-3 bg-surface-50 dark:bg-slate-800 rounded-[4px] text-sm border-2 border-transparent focus:border-primary-500 outline-none transition-all dark:text-white font-medium"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                          <button onClick={() => startRecording('audio')} className="text-surface-400 hover:text-primary-500 transition-colors">
                            <FiMic className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleSend}
                        disabled={!messageText.trim() || uploading}
                        className="p-3 bg-primary-600 hover:bg-primary-700 text-white rounded-[4px] shadow-lg shadow-primary-600/30 transition-all active:scale-95 disabled:opacity-50"
                      >
                        <FiSend className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-24 h-24 bg-primary-50 dark:bg-primary-900/20 rounded-[4px] flex items-center justify-center mb-6">
                <FiSend className="w-8 h-8 text-primary-400" />
              </div>
              <h3 className="text-lg font-black text-surface-900 dark:text-white uppercase tracking-widest mb-2">Secure Comms</h3>
              <p className="text-sm text-surface-500 dark:text-slate-400 max-w-xs font-medium">Select a team member to initiate an end-to-end encrypted session.</p>
            </div>
          )}
        </div>

        {/* User Detail Sidebar */}
        {selectedUser && showUserDetail && (
          <div className="hidden lg:flex w-[280px] flex-col bg-white dark:bg-slate-900 rounded-[4px] shadow-xl border border-primary-100 dark:border-slate-800 animate-slide-in-right overflow-hidden">
            <div className="p-6 border-b border-primary-50 dark:border-slate-800">
              <div className="flex items-center justify-between mb-8 text-xs font-black text-surface-400 uppercase tracking-widest">
                <span>Profile Detail</span>
                <button onClick={() => setShowUserDetail(false)} className="hover:text-surface-600 transition-colors"><FiX /></button>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 rounded-[4px] bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-2xl shadow-primary-600/30">
                  {getInitials(selectedUser.name)}
                </div>
                <h4 className="text-base font-black text-surface-900 dark:text-white uppercase tracking-tight">{selectedUser.name}</h4>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-[0.2em]">{isUserOnline(selectedUser._id) ? 'Online' : 'Sleep'}</span>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest block mb-1">Contact</span>
                <p className="text-xs font-bold text-surface-700 dark:text-slate-300 break-all">{selectedUser.email}</p>
              </div>
              <div>
                <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest block mb-1">Workspace Role</span>
                <span className="inline-block px-3 py-1 bg-primary-50 dark:bg-slate-800 text-[10px] font-bold text-primary-600 uppercase tracking-widest rounded-full">{selectedUser.role}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showNewChat && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6" onClick={() => setShowNewChat(false)}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-[4px] w-full max-w-md shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-primary-100 dark:border-slate-800 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-primary-50 dark:border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-black text-surface-900 dark:text-white uppercase tracking-[0.2em]">Initiate Session</h3>
                <button onClick={() => setShowNewChat(false)} className="text-surface-400 hover:text-surface-600 transition-colors"><FiX className="w-5 h-5" /></button>
              </div>
              <div className="p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {users.map(u => (
                  <button
                    key={u._id}
                    onClick={() => handleNewChat(u)}
                    className="flex items-center gap-4 w-full p-4 rounded-[4px] hover:bg-primary-50 dark:hover:bg-slate-800 transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-[4px] bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-black group-hover:scale-105 transition-transform">
                      {getInitials(u.name)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-surface-900 dark:text-white tracking-tight">{u.name}</p>
                      <p className="text-xs text-surface-400 font-medium">{u.email}</p>
                    </div>
                    <div className={`w-2.5 h-2.5 rounded-full ${isUserOnline(u._id) ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' : 'bg-surface-200'}`}></div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
