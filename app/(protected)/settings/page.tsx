'use client';

import React, { useState, useRef } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { getInitials } from '../../../utils/formatters';
import api from '../../../lib/axios';
import Switch from '../../../components/Switch';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FiCamera, FiCheckCircle, FiAlertCircle, FiActivity } from 'react-icons/fi';
import { uploadToCloudinary } from '../../../lib/cloudinary';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateProfile = async (avatarUrl?: string) => {
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const payload = avatarUrl ? { name, email, avatar: avatarUrl } : { name, email };
      const { data } = await api.patch('/users/profile', payload);
      setUser(data.data);
      setMessage('Profile Updated Successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setError('Error: Profile update failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsUploading(true);
    try {
      const file = e.target.files[0];
      const result = await uploadToCloudinary(file, 'image');
      await handleUpdateProfile(result.url);
    } catch (err) {
      setError('Error: Image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      await api.patch('/users/profile', { currentPassword, newPassword });
      setMessage('Password Updated Successfully');
      setCurrentPassword('');
      setNewPassword('');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setError('Error: Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.4, ease: 'easeOut' },
    }),
  };

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto custom-scrollbar">
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-3 max-w-[1400px] mx-auto">
          {/* TopRow: Feedback Messages */}
          <AnimatePresence>
            {(message || error) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`p-3 rounded-[2px] flex items-center gap-3 border shadow-md mb-2 ${
                  message
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:border-emerald-500/20'
                    : 'bg-red-50 border-red-100 text-red-700 dark:bg-red-500/10 dark:border-red-500/20'
                }`}
              >
                {message ? (
                  <FiCheckCircle className="shrink-0 w-3.5 h-3.5" />
                ) : (
                  <FiAlertCircle className="shrink-0 w-3.5 h-3.5" />
                )}
                <span className="text-[9px] font-black uppercase tracking-widest leading-tight">
                  {message || error}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Card 1: Profile Settings */}
            <motion.div
              custom={1}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2px] p-3 lg:p-4 space-y-4 shadow-sm flex flex-col"
            >
              <header className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5">
                    Profile Settings
                  </h2>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    Manage your public information
                  </p>
                </div>
              </header>

              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 flex-1">
                <div className="relative group shrink-0 mb-4 sm:mb-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-[4px] bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-black shadow-lg border border-white dark:border-slate-800 overflow-hidden transition-all">
                    {user.avatar ? (
                      <img src={user.avatar} className="w-full h-full object-cover" alt="" />
                    ) : (
                      getInitials(user.name)
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                        <FiActivity className="animate-spin text-white w-6 h-6" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-[-8px] right-[-8px] p-2.5 bg-primary-600 text-white rounded-[2px] shadow-xl hover:scale-110 transition-transform hover:bg-primary-700"
                  >
                    <FiCamera className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </div>
                <div className="space-y-4 flex-1 w-full">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b border-transparent focus:border-primary-500 outline-none transition-all dark:text-white text-[11px] font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border-b border-transparent focus:border-primary-500 outline-none transition-all dark:text-white text-[11px] font-bold"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleUpdateProfile()}
                disabled={isLoading}
                className="w-full py-3 bg-primary-600 text-white rounded-[2px] text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary-500/20 hover:bg-primary-700 disabled:opacity-50 transition-all active:scale-95"
              >
                Update Profile
              </button>
            </motion.div>

            {/* Card 2: Password Settings */}
            <motion.div
              custom={2}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2px] p-3 lg:p-4 space-y-4 shadow-sm flex flex-col"
            >
              <header>
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5">
                  Password Settings
                </h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Update your account password
                </p>
              </header>

              <form onSubmit={handleChangePassword} className="space-y-4 flex-1">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-transparent focus:border-primary-500 outline-none transition-all dark:text-white text-xs font-bold"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-transparent focus:border-primary-500 outline-none transition-all dark:text-white text-xs font-bold"
                    required
                    minLength={6}
                  />
                </div>
                <div className="mt-auto pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-primary-600 text-white rounded-[2px] text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-primary-600/30 disabled:opacity-50 transition-all active:scale-95"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </motion.div>

            {/* Bottom Row: Permissions - Full Width */}
            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2px] p-3 lg:p-4 space-y-3 shadow-sm lg:col-span-2"
            >
              <header>
                <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight mb-0.5">
                  User Permissions
                </h2>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  Currently active authorizations
                </p>
              </header>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                {Object.entries(user.permissions).map(([key, value]) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 border-l-2 border-primary-500 bg-slate-50 dark:bg-slate-800/50 rounded-[2px] shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    <span className="text-[9px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {key.replace(/can|([A-Z])/g, (m, g) => (g ? ` ${g}` : '')).trim()}
                    </span>
                    <Switch checked={!!value} disabled={true} className="scale-75" />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
