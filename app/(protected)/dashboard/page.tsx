'use client';

import React, { useEffect, useState } from 'react';
import {
  FiUsers,
  FiCheckSquare,
  FiFileText,
  FiMessageCircle,
  FiZap,
  FiTrendingUp,
} from 'react-icons/fi';
import Header from '../../../components/Header';
import { useSocket } from '../../../hooks/useSocket';
import api from '../../../lib/axios';
import { IDashboardStats } from '../../../types';

const iconMap = [
  { Icon: FiUsers, gradient: 'from-blue-500 to-cyan-500', glow: 'shadow-blue-200' },
  { Icon: FiCheckSquare, gradient: 'from-violet-500 to-purple-600', glow: 'shadow-violet-200' },
  { Icon: FiFileText, gradient: 'from-amber-500 to-orange-500', glow: 'shadow-amber-200' },
  { Icon: FiMessageCircle, gradient: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-200' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<IDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useSocket();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard/stats');
        setStats(data.data);
      } catch {
        /* */
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = stats
    ? [
        {
          label: 'Total Users',
          value: stats.users.total,
          color: 'from-blue-500 to-cyan-500',
          change: `${stats.users.active} active`,
          trend: '+12%',
        },
        {
          label: 'Total Tasks',
          value: stats.tasks.total,
          color: 'from-violet-500 to-purple-600',
          change: `${stats.tasks.byStatus?.done || 0} completed`,
          trend: '+5%',
        },
        {
          label: 'Total Notes',
          value: stats.notes.total,
          color: 'from-amber-500 to-orange-500',
          change: 'All time',
          trend: '+8%',
        },
        {
          label: 'Messages',
          value: stats.messages.total,
          color: 'from-emerald-500 to-teal-600',
          change: 'All time',
          trend: '+23%',
        },
      ]
    : [];

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-surface-50 dark:bg-slate-950 p-6 gap-6">
      <Header 
        title="Dashboard" 
        subtitle="Overview of your workspace" 
        icon={<FiZap className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-36 skeleton rounded-[4px]"></div>
            ))}
          </div>
        ) : (
          stats && (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {statCards.map((card, i) => {
                  const { Icon, gradient, glow } = iconMap[i];
                  return (
                    <div
                      key={i}
                      className="group bg-white dark:bg-slate-800 rounded-[4px] p-6 border border-surface-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300 cursor-default"
                    >
                      <div className="flex items-center justify-between mb-5">
                        <div
                          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg ${glow} group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
                        >
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10">
                          <FiTrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{card.trend}</span>
                        </div>
                      </div>
                      <p className="text-3xl font-extrabold text-surface-900 dark:text-white mb-1 tabular-nums">
                        {card.value.toLocaleString()}
                      </p>
                      <p className="text-sm font-semibold text-surface-700 dark:text-slate-300">{card.label}</p>
                      <p className="text-xs text-surface-400 dark:text-slate-500 mt-0.5">{card.change}</p>
                    </div>
                  );
                })}
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Tasks by Status */}
                <div className="bg-white dark:bg-slate-800 rounded-[4px] p-6 border border-surface-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <FiZap className="w-5 h-5 text-primary-500" />
                    <h3 className="font-bold text-surface-800 dark:text-white">Tasks by Status</h3>
                  </div>
                  <div className="space-y-4">
                    {Object.entries(stats.tasks.byStatus || {}).map(([status, count]) => (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm text-surface-600 dark:text-slate-400 capitalize">
                            {status.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-bold text-surface-800 dark:text-white">
                            {count as number}
                          </span>
                        </div>
                        <div className="h-2 bg-surface-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${status === 'done' ? 'bg-gradient-to-r from-emerald-400 to-emerald-600' : status === 'in_progress' ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 'bg-gradient-to-r from-slate-300 to-slate-400'}`}
                            style={{
                              width: `${stats.tasks.total ? ((count as number) / stats.tasks.total) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {Object.keys(stats.tasks.byStatus || {}).length === 0 && (
                      <p className="text-sm text-surface-400 text-center py-4">No tasks yet</p>
                    )}
                  </div>
                </div>

                {/* Users by Role */}
                <div className="bg-white dark:bg-slate-800 rounded-[4px] p-6 border border-surface-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-2 mb-6">
                    <FiUsers className="w-5 h-5 text-primary-500" />
                    <h3 className="font-bold text-surface-800 dark:text-white">Team Overview</h3>
                  </div>
                  <div className="space-y-3">
                    {Object.entries(stats.users.byRole || {}).map(([role, count]) => {
                      const roleColors: Record<string, string> = {
                        super_admin: 'from-red-400 to-rose-600',
                        admin: 'from-amber-400 to-orange-500',
                        member: 'from-blue-400 to-blue-600',
                      };
                      return (
                        <div
                          key={role}
                          className="flex items-center justify-between p-3 bg-surface-50 dark:bg-slate-700/50 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg bg-gradient-to-br ${roleColors[role] || 'from-slate-400 to-slate-600'} flex items-center justify-center`}
                            >
                              <FiUsers className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-surface-700 dark:text-slate-300 capitalize">
                              {role.replace('_', ' ')}
                            </span>
                          </div>
                          <span className="text-lg font-extrabold text-surface-800 dark:text-white tabular-nums">
                            {count as number}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white dark:bg-slate-800 rounded-[4px] p-6 border border-surface-100 dark:border-slate-700 shadow-sm mb-6">
                <div className="flex items-center gap-2 mb-6">
                  <FiZap className="w-5 h-5 text-primary-500" />
                  <h3 className="font-bold text-surface-800 dark:text-white">Recent Activity</h3>
                </div>
                <div className="space-y-4">
                  {stats.recentActivity?.slice(0, 10).map((activity, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 pb-4 border-b border-surface-50 dark:border-slate-700 last:border-0"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <FiZap className="w-3.5 h-3.5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-surface-700 dark:text-slate-300">
                          <span className="font-semibold text-surface-900 dark:text-white">
                            {typeof activity.userId === 'object'
                              ? (activity.userId as { name: string }).name
                              : 'User'}
                          </span>{' '}
                          {activity.action}
                        </p>
                        <p className="text-xs text-surface-400 dark:text-slate-500 mt-0.5">{activity.details}</p>
                      </div>
                    </div>
                  ))}
                  {(!stats.recentActivity || stats.recentActivity.length === 0) && (
                    <p className="text-sm text-surface-400 text-center py-4">No recent activity</p>
                  )}
                </div>
              </div>
            </>
          )
        )}
      </div>
    </main>
  );
}
