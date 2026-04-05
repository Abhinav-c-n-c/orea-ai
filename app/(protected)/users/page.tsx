'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiUsers, FiSearch } from 'react-icons/fi';
import Header from '../../../components/Header';
import { useAuthStore } from '../../../store/authStore';
import { getInitials } from '../../../utils/formatters';
import api from '../../../lib/axios';
import { IUser } from '../../../types';

export default function UsersPage() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<IUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      setUsers(data.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user?.permissions.canManageUsers) {
    return (
      <main className="flex-1 flex items-center justify-center p-6 bg-surface-50 dark:bg-slate-950">
        <div className="bg-white dark:bg-slate-900 p-12 rounded-[4px] shadow-xl border border-red-100 dark:border-red-900/20 text-center max-w-md">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiUsers className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-2xl font-black text-surface-900 dark:text-white uppercase tracking-tight mb-2">Access Denied</h1>
          <p className="text-surface-500 dark:text-slate-400 font-medium lowercase">Your security clearance level does not permit access to the user management protocol.</p>
          <Link href="/" className="mt-8 inline-block px-6 py-2 bg-primary-600 text-white rounded-[4px] text-xs font-black uppercase tracking-widest hover:bg-primary-700 transition-colors">
            Return to Nexus
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-surface-50 dark:bg-slate-950 p-6 gap-6">
      <Header 
        title="User Management" 
        subtitle="Manage platform users and permissions" 
        icon={<FiUsers className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="bg-white dark:bg-slate-900 rounded-[4px] shadow-sm border border-primary-100 dark:border-slate-800 flex flex-col h-full">
          <div className="p-6 border-b border-primary-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-surface-900 dark:text-white uppercase tracking-tight">Active Team</h3>
              <p className="text-xs text-surface-500 font-medium lowercase tracking-tight">Viewing {filteredUsers.length} members across segments</p>
            </div>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search users..."
                className="pl-10 pr-4 py-2 bg-surface-50 dark:bg-slate-800 rounded-[4px] border border-primary-100 dark:border-slate-700 outline-none focus:ring-2 focus:ring-primary-500 w-full md:w-64 text-sm dark:text-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col gap-3 p-6">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-16 w-full bg-primary-50 dark:bg-slate-800/30 rounded-[4px] animate-pulse"></div>
                ))}
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-50/50 dark:bg-slate-800/50 border-b border-primary-50 dark:border-slate-800">
                    <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest text-center w-16">Profile</th>
                    <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Name & Bio</th>
                    <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">Workspace ID</th>
                    <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest text-center">Status</th>
                    <th className="px-6 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-50/30 dark:divide-slate-800/50">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-primary-50/20 dark:hover:bg-primary-900/5 transition-all group">
                      <td className="px-6 py-4 text-center">
                        <div className="w-10 h-10 rounded-[4px] bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white font-black text-xs shadow-md group-hover:scale-105 transition-transform mx-auto">
                          {getInitials(u.name)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-surface-900 dark:text-white uppercase tracking-tight">{u.name}</span>
                          <span className="text-[10px] text-surface-400 font-bold tracking-tight lowercase">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 bg-primary-50 dark:bg-slate-800 text-[10px] font-black text-primary-600 uppercase tracking-widest rounded-full">{u.role}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-full w-fit mx-auto border border-emerald-100 dark:border-emerald-500/20">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                          <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/users/${u._id}`} className="text-xs font-black text-primary-600 hover:text-primary-800 uppercase tracking-widest transition-colors">
                          Inspect Account
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {!isLoading && filteredUsers.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in px-6">
                <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/10 rounded-full flex items-center justify-center mb-6">
                  <FiUsers className="w-8 h-8 text-primary-300" />
                </div>
                <h4 className="text-base font-black text-surface-900 dark:text-white uppercase tracking-widest mb-2">No team members found</h4>
                <p className="text-xs text-surface-500 font-medium max-w-[240px] lowercase">Your organization doesn't have any users matching your current parameters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
