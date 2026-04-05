'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Switch from '@/components/Switch';
import { FiUsers, FiArrowLeft } from 'react-icons/fi';
import { useAuthStore } from '@/store/authStore';
import { getInitials } from '@/utils/formatters';
import api from '@/lib/axios';
import { IUser, IPermissions } from '@/types';

export default function UserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();
  const [targetUser, setTargetUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const { data } = await api.get(`/users/${id}`);
      setTargetUser(data.data);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setError('User not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTogglePermission = async (key: string, value: boolean) => {
    if (!targetUser) return;

    // Check hierarchy: Admin can only modify Member
    if (currentUser?.role === 'admin' && targetUser.role !== 'member') {
      setError('Admins can only manage members');
      return;
    }

    try {
      setIsSaving(true);
      const updatedPermissions = { ...targetUser.permissions, [key]: value };
      await api.patch(`/users/${id}/permissions`, { permissions: { [key]: value } });
      setTargetUser({ ...targetUser, permissions: updatedPermissions });
      setMessage('Permission updated');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update permission');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (newRole: string) => {
    if (!targetUser) return;

    try {
      setIsSaving(true);
      const { data } = await api.patch(`/users/${id}/role`, { role: newRole });
      setTargetUser(data.data);
      setMessage(`User ${newRole === 'admin' ? 'promoted' : 'demoted'} successfully`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update role');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading user details...</div>;
  if (!targetUser || !currentUser) return <div className="p-8 text-center">User not found</div>;

  // Hierarchy Checks
  const isSelf = currentUser._id === targetUser._id;
  const canModify =
    currentUser.role === 'super_admin' ||
    (currentUser.role === 'admin' && targetUser.role === 'member');
  const canChangePermissions = currentUser.permissions.canManagePermissions && canModify;

  const isSuperAdmin = targetUser.role === 'super_admin';
  const isAdmin = targetUser.role === 'admin';
  const isMember = targetUser.role === 'member';

  return (
    <main className="flex-1 p-6 overflow-y-auto bg-surface-50 dark:bg-slate-950 flex flex-col gap-6">
      <Header 
        title="User Details" 
        subtitle={<span className="font-medium lowercase">Managing security clearance for <span className="text-primary-600 font-black uppercase text-xs">{targetUser.name}</span></span>}
        icon={<FiUsers className="w-5 h-5" />}
      >
        <button
          onClick={() => router.back()}
          className="mr-2 px-4 py-2 border border-primary-100 dark:border-slate-700 rounded-xl text-sm font-black uppercase tracking-widest text-surface-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back
        </button>

        {currentUser.role === 'super_admin' && !isSuperAdmin && (
          <button
            onClick={() => handleRoleChange(isAdmin ? 'member' : 'admin')}
            disabled={isSaving}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              isAdmin
                ? 'bg-red-50 text-red-700 border border-red-100 hover:bg-red-100'
                : 'bg-primary-50 text-primary-700 border border-primary-100 hover:bg-primary-100'
            }`}
          >
            {isAdmin ? 'Demote to Member' : 'Promote to Admin'}
          </button>
        )}
        {currentUser.role === 'admin' && isMember && (
          <button
            onClick={() => handleRoleChange('admin')}
            disabled={isSaving}
            className="px-4 py-2 bg-primary-50 text-primary-700 border border-primary-100 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-primary-100 transition-all"
          >
            Promote to Admin
          </button>
        )}
      </Header>

      {(message || error) && (
        <div
          className={`px-4 py-3 rounded-[4px] text-xs font-bold uppercase tracking-widest ${
            message
              ? 'bg-green-50 text-green-700 border border-green-100'
              : 'bg-red-50 text-red-700 border border-red-100'
          }`}
        >
          {message || error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile & Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[4px] border border-primary-100 dark:border-slate-800 shadow-xl p-8 text-center transition-all duration-300">
            <div className="w-24 h-24 mx-auto mb-6 rounded-[4px] bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-primary-500/20 transform hover:scale-105 transition-transform duration-300">
              {getInitials(targetUser.name)}
            </div>
            <h3 className="font-black text-surface-900 dark:text-white text-xl uppercase tracking-tight">{targetUser.name}</h3>
            <p className="text-xs font-bold text-surface-400 mb-6 lowercase tracking-tight">{targetUser.email}</p>
            <span
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                isSuperAdmin
                  ? 'bg-purple-50 text-purple-700 border-purple-100'
                  : isAdmin
                    ? 'bg-blue-50 text-blue-700 border-blue-100'
                    : 'bg-green-50 text-green-700 border-green-100'
              }`}
            >
              {targetUser.role.replace('_', ' ')}
            </span>
          </div>

          {/* Status Section */}
          <div className="bg-white dark:bg-slate-900 rounded-[4px] border border-primary-100 dark:border-slate-800 shadow-xl p-8">
            <h4 className="font-black text-surface-900 dark:text-white mb-6 text-[10px] uppercase tracking-widest border-b border-primary-50 dark:border-slate-800 pb-2">Account Registry</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Enrolled on</span>
                <span className="text-xs font-bold text-surface-900 dark:text-slate-300">
                  {new Date(targetUser.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest">Operational Status</span>
                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  Active
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Permissions */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-[4px] border border-primary-100 dark:border-slate-800 shadow-xl p-8 h-full">
            <div className="flex items-center justify-between mb-8 border-b border-primary-50 dark:border-slate-800 pb-4">
              <h3 className="font-black text-surface-900 dark:text-white uppercase tracking-tight text-lg">Access Protocols</h3>
              {!canChangePermissions && (
                <span className="text-[10px] font-black text-red-500 bg-red-50 border border-red-100 px-3 py-1 rounded-full uppercase tracking-widest">
                  Read-Only Mode
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
              {Object.entries(targetUser.permissions).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between group"
                >
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-surface-900 dark:text-white uppercase tracking-widest group-hover:text-primary-600 transition-colors">
                      {key.replace(/can|([A-Z])/g, (m, g) => (g ? ` ${g}` : '')).trim()}
                    </span>
                    <span className="text-[10px] text-surface-400 font-medium lowercase">
                      {value ? 'Status: active' : 'Status: inactive'}
                    </span>
                  </div>
                  <Switch
                    checked={value}
                    onChange={(e) => handleTogglePermission(key, e.target.checked)}
                    disabled={!canChangePermissions || isSaving}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
