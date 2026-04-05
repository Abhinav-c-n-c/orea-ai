'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '../../../components/Sidebar';
import ProtectedLayout from '../../../components/ProtectedLayout';
import Switch from '../../../components/Switch';
import { useAuthStore } from '../../../store/authStore';
import { getInitials } from '../../../utils/formatters';
import api from '../../../lib/axios';
import { IUser, IPermissions } from '../../../types';

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
    <ProtectedLayout>
      <div className="flex min-h-screen bg-[#f8f9fc]">
        <Sidebar />
        <main className="flex-1 ml-[260px] p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <button
                onClick={() => router.back()}
                className="text-primary-600 text-sm font-medium hover:underline mb-2 flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Users
              </button>
              <h1 className="text-2xl font-bold text-surface-900">User Details</h1>
            </div>

            <div className="flex gap-3">
              {currentUser.role === 'super_admin' && !isSuperAdmin && (
                <button
                  onClick={() => handleRoleChange(isAdmin ? 'member' : 'admin')}
                  disabled={isSaving}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isAdmin
                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                      : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                  }`}
                >
                  {isAdmin ? 'Demote to Member' : 'Promote to Admin'}
                </button>
              )}
              {currentUser.role === 'admin' && isMember && (
                <button
                  onClick={() => handleRoleChange('admin')}
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary-50 text-primary-700 rounded-xl text-sm font-medium hover:bg-primary-100"
                >
                  Promote to Admin
                </button>
              )}
            </div>
          </div>

          {(message || error) && (
            <div
              className={`mb-6 p-4 rounded-xl text-sm ${
                message
                  ? 'bg-green-50 text-green-700 border border-green-100'
                  : 'bg-red-50 text-red-700 border border-red-100'
              }`}
            >
              {message || error}
            </div>
          )}

          <div className="grid grid-cols-3 gap-8">
            <div className="col-span-1 space-y-8">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-6 text-center">
                <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                  {getInitials(targetUser.name)}
                </div>
                <h3 className="font-bold text-surface-900 text-xl">{targetUser.name}</h3>
                <p className="text-sm text-surface-500 mb-4">{targetUser.email}</p>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    isSuperAdmin
                      ? 'bg-purple-100 text-purple-700'
                      : isAdmin
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-green-100 text-green-700'
                  }`}
                >
                  {targetUser.role.replace('_', ' ')}
                </span>
              </div>

              {/* Status Section */}
              <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-6">
                <h4 className="font-bold text-surface-900 mb-4 text-sm">Account Information</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-surface-500">Member Since</span>
                    <span className="text-xs font-medium text-surface-700">
                      {new Date(targetUser.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-surface-500">Account status</span>
                    <span className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-span-2">
              <div className="bg-white rounded-2xl border border-surface-100 shadow-card p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-bold text-surface-900">Manage Permissions</h3>
                  {!canChangePermissions && (
                    <span className="text-xs text-red-500 font-medium bg-red-50 px-2 py-1 rounded-lg">
                      Read-only access
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                  {Object.entries(targetUser.permissions).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between pb-4 border-b border-surface-50 group"
                    >
                      <div>
                        <span className="block text-sm font-semibold text-surface-800 capitalize group-hover:text-primary-600 transition-colors">
                          {key.replace(/can|([A-Z])/g, (m, g) => (g ? ` ${g}` : '')).trim()}
                        </span>
                        <span className="text-[11px] text-surface-400">
                          {value ? 'Currently enabled' : 'Currently disabled'}
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
      </div>
    </ProtectedLayout>
  );
}
