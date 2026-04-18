'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { FiUsers, FiSearch, FiChevronLeft } from 'react-icons/fi';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { getInitials } from '@/utils/formatters';
import api from '@/lib/axios';
import { IUser } from '@/types';

export default function UsersPage() {
  const { user } = useAuthStore();
  const { setIsNavigating } = useUIStore();
  const router = useRouter();
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

  const handleInspect = (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    setIsNavigating(true);
    setTimeout(() => {
      router.push(`/users/${userId}`);
    }, 1200);
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
          <h1 className="text-2xl font-black text-surface-900 dark:text-white uppercase tracking-tight mb-2">
            Access Denied
          </h1>
          <p className="text-surface-500 dark:text-slate-400 font-medium lowercase">
            Your security clearance level does not permit access to the user management protocol.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block px-6 py-2 bg-primary-600 text-white rounded-[4px] text-xs font-black uppercase tracking-widest hover:bg-primary-700 transition-colors"
          >
            Return to Nexus
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-surface-50 dark:bg-slate-950 p-4 md:p-6">
      <div className="flex-1 overflow-hidden flex flex-col bg-white dark:bg-slate-900 rounded-[4px] shadow-sm border border-primary-100 dark:border-slate-800">
        <div className="p-6 border-b border-primary-50 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[4px] bg-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
              <FiUsers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black text-surface-900 dark:text-white uppercase tracking-tight">
                User Management
              </h3>
              <p className="text-[10px] text-surface-500 font-bold uppercase tracking-widest mt-0.5 opacity-70">
                User Count(s): {filteredUsers.length}
              </p>
            </div>
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

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 w-full bg-primary-50 dark:bg-slate-800/30 rounded-[4px] animate-pulse"
                ></div>
              ))}
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="w-full text-left border-collapse table-auto">
                  <thead>
                    <tr className="bg-surface-50/50 dark:bg-slate-800/50 border-b border-primary-50 dark:border-slate-800">
                      <th className="px-4 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest text-center w-16">
                        Profile
                      </th>
                      <th className="px-4 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">
                        Name & Bio
                      </th>
                      <th className="px-4 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest">
                        Workspace ID
                      </th>
                      <th className="px-4 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest text-center">
                        Status
                      </th>
                      <th className="px-4 py-4 text-[10px] font-black text-surface-400 uppercase tracking-widest text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {filteredUsers.map((u, idx) => (
                      <tr
                        key={u._id}
                        className={`
                            transition-all duration-200 group relative
                            ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-emerald-50/40 dark:bg-emerald-900/10'}
                            hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20
                            hover:scale-[1.01] hover:z-10 hover:shadow-md
                          `}
                      >
                        <td className="px-4 py-3 text-center">
                          <div className="w-8 h-8 rounded-[4px] bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-primary-600 font-black text-[10px] shadow-sm group-hover:bg-primary-600 group-hover:text-white transition-all mx-auto overflow-hidden">
                            {u.avatar ? (
                              <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                            ) : (
                              getInitials(u.name)
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tight group-hover:text-primary-600 transition-colors">
                              {u.name}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold tracking-tight lowercase">
                              {u.email}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-1 rounded-[2px] text-[9px] font-black uppercase tracking-widest border ${
                            u.role === 'super_admin' 
                              ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/30' 
                              : u.role === 'admin'
                                ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-900/30'
                                : 'bg-primary-50 text-primary-700 border-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:border-primary-900/30'
                          }`}>
                            {u.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1.5 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-[2px] w-fit mx-auto border border-emerald-100 dark:border-emerald-500/20">
                            <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[9px] font-black uppercase tracking-widest">
                              Active
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/users/${u._id}`}
                            onClick={(e) => handleInspect(e, u._id)}
                            className="inline-flex items-center px-3 py-1 bg-white dark:bg-slate-900 text-[9px] font-black text-slate-400 hover:text-primary-600 uppercase tracking-[0.1em] rounded-[2px] transition-all border border-slate-200 dark:border-slate-800 hover:border-primary-500/50 shadow-sm"
                          >
                            Inspect Account
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden flex flex-col p-4 gap-4">
                {filteredUsers.map((u) => (
                  <div 
                    key={u._id}
                    onClick={(e) => handleInspect(e, u._id)}
                    className="p-4 bg-white dark:bg-slate-800 border border-primary-100 dark:border-slate-700 rounded-[4px] shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[4px] overflow-hidden bg-primary-100 dark:bg-slate-700 flex items-center justify-center text-primary-600 font-black text-xs">
                        {u.avatar ? (
                          <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                        ) : (
                          getInitials(u.name)
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{u.name}</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-[2px] border ${
                            u.role === 'super_admin' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-primary-50 text-primary-600 border-primary-100'
                          }`}>
                            {u.role.split('_')[0]}
                          </span>
                          <span className="text-[8px] font-bold text-emerald-500 uppercase tracking-widest">Active</span>
                        </div>
                      </div>
                    </div>
                    <FiChevronLeft className="w-4 h-4 text-slate-300 rotate-180" />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {!isLoading && filteredUsers.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in px-6">
            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/10 rounded-full flex items-center justify-center mb-6">
              <FiUsers className="w-8 h-8 text-primary-300" />
            </div>
            <h4 className="text-base font-black text-surface-900 dark:text-white uppercase tracking-widest mb-2">
              No team members found
            </h4>
            <p className="text-xs text-surface-500 font-medium max-w-[240px] lowercase">
              Your organization doesn't have any users matching your current parameters.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
