'use client';

import React, { useState } from 'react';
import Header from '../../../components/Header';
import { useAuthStore } from '../../../store/authStore';
import { getInitials } from '../../../utils/formatters';
import api from '../../../lib/axios';
import Switch from '../../../components/Switch';

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      const { data } = await api.put('/users/profile', { name, email });
      setUser(data.data);
      setMessage('Profile updated successfully');
    } catch {
      setError('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');
    try {
      await api.put('/users/profile', { currentPassword, newPassword });
      setMessage('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      setError('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <main className="flex-1 flex flex-col overflow-y-auto">
      <Header title="Settings" subtitle="Manage your account settings" />
      <div className="max-w-2xl space-y-8 p-6">
        {(message || error) && (
          <div className={`p-4 rounded-xl text-sm ${message ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            {message || error}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-white dark:bg-slate-800 rounded-[4px] border border-surface-100 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="h-24 bg-gradient-to-r from-primary-500 to-primary-700"></div>
          <div className="px-8 pb-8">
            <div className="-mt-10 mb-6 flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white dark:border-slate-800 shadow-lg">
                {getInitials(user.name)}
              </div>
              <div className="pb-1">
                <h3 className="font-bold text-surface-900 dark:text-white text-lg">{user.name}</h3>
                <p className="text-sm text-surface-500 dark:text-slate-400">{user.email}</p>
              </div>
              <span className="ml-auto px-3 py-1 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-semibold capitalize">
                {user.role.replace('_', ' ')}
              </span>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-slate-300 mb-1.5">Full Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-slate-600 bg-surface-50 dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:text-white" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-slate-300 mb-1.5">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-slate-600 bg-surface-50 dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:text-white" />
                </div>
              </div>
              <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50">
                Save Changes
              </button>
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white dark:bg-slate-800 rounded-[4px] p-8 border border-surface-100 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-surface-900 dark:text-white mb-6">Change Password</h3>
          <form onSubmit={handleChangePassword} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-slate-300 mb-1.5">Current Password</label>
              <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-slate-600 bg-surface-50 dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:text-white" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-slate-300 mb-1.5">New Password</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-slate-600 bg-surface-50 dark:bg-slate-700 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:text-white" required minLength={6} />
            </div>
            <button type="submit" disabled={isLoading} className="px-6 py-2.5 bg-surface-800 dark:bg-slate-600 text-white rounded-xl text-sm font-medium hover:bg-surface-900 transition-colors disabled:opacity-50">
              Update Password
            </button>
          </form>
        </div>

        {/* Permissions */}
        <div className="bg-white dark:bg-slate-800 rounded-[4px] p-8 border border-surface-100 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-surface-900 dark:text-white mb-6">Your Permissions</h3>
          <div className="grid grid-cols-2 gap-6">
            {Object.entries(user.permissions).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-1">
                <span className="text-sm text-surface-700 dark:text-slate-300 capitalize">
                  {key.replace(/can|([A-Z])/g, (m, g) => (g ? ` ${g}` : '')).trim()}
                </span>
                <Switch checked={!!value} disabled={true} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
