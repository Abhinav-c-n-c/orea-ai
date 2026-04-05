'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FiHome,
  FiCheckSquare,
  FiEdit3,
  FiMessageCircle,
  FiUsers,
  FiSettings,
  FiChevronLeft,
  FiMenu,
  FiSun,
  FiMoon,
  FiMoreVertical,
  FiX,
  FiPlayCircle,
} from 'react-icons/fi';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { hasPermission } from '../utils/permissions';
import { getInitials } from '../utils/formatters';

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: FiHome,
    permission: 'canViewDashboard' as const,
  },
  {
    label: 'ToDo(s)',
    href: '/tasks',
    icon: FiCheckSquare,
  },
  {
    label: 'Notes',
    href: '/notes',
    icon: FiEdit3,
  },
  {
    label: 'Chat',
    href: '/chat',
    icon: FiMessageCircle,
    permission: 'canAccessChat' as const,
  },
  {
    label: 'Games',
    href: '/games',
    icon: FiPlayCircle,
  },
  {
    label: 'Users',
    href: '/users',
    icon: FiUsers,
    permission: 'canManageUsers' as const,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { unreadCount } = useChatStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDark(document.documentElement.classList.contains('dark'));
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  if (!user) return null;

  const sidebarContent = (
    <aside
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-sidebar to-sidebar-dark flex flex-col z-40 transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[260px]'
      } md:relative`}
    >
      {/* Logo */}
      <div className="h-24 flex items-center justify-center px-4 relative">
        <Link
          href="/dashboard"
          className="flex items-center justify-center w-full transition-all duration-300"
        >
          {collapsed ? (
            <img
              src="https://res.cloudinary.com/dybv5ghlb/image/upload/v1775386584/logo_girl_iq32ps.png"
              alt="Logo"
              className="w-10 h-10 object-contain animate-fade-in"
            />
          ) : (
            <div className="flex items-center gap-3 animate-fade-in">
              <img
                src="https://res.cloudinary.com/dybv5ghlb/image/upload/v1775387898/orea-logo_c0dkac.png"
                alt="Logo Full"
                className=" object-contain"
                style={{ width: '90%' }}
              />
            </div>
          )}
        </Link>

        {/* Desktop collapse - Positioned on the edge */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 items-center justify-center w-8 h-14 bg-sidebar border border-white/10 rounded-r-xl text-white/80 hover:text-white hover:bg-sidebar-hover transition-all duration-300 shadow-[4px_0_10px_rgba(0,0,0,0.2)] z-50 group"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 group-hover:to-white/10 transition-all rounded-r-xl"></div>
          <FiChevronLeft
            className={`w-5 h-5 transition-transform duration-500 relative z-10 ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Mobile close */}
        <button
          onClick={() => setMobileOpen(false)}
          className="md:hidden absolute right-4 p-1.5 rounded-[4px] hover:bg-white/10 text-white/60 hover:text-white transition-colors"
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>
      <hr className="w-full border-white/10" />

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          {navItems.map((item) => {
            if (item.permission && !hasPermission(user.permissions, item.permission)) {
              return null;
            }

            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-white/15 text-white shadow-sm backdrop-blur-sm border border-white/10'
                    : 'text-white/60 hover:bg-white/8 hover:text-white'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary-300' : ''}`} />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.label === 'Chat' && unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse-soft">
                    {unreadCount}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto px-3 py-4 flex flex-col gap-3">
        {/* Settings */}
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white transition-all ${
            collapsed ? 'justify-center px-2' : ''
          }`}
        >
          <FiSettings className="w-5 h-5" />
          {!collapsed && <span>Settings</span>}
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-[4px] text-sm font-medium text-white/60 hover:bg-white/8 hover:text-white transition-all ${
            collapsed ? 'justify-center px-2' : ''
          }`}
        >
          {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
          {!collapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* User Profile */}
        <div
          className={`flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-[4px] border border-white/10 ${collapsed ? 'justify-center' : ''}`}
        >
          <div className="w-9 h-9 rounded-[4px] bg-gradient-to-br from-primary-300 to-primary-500 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-white text-sm font-bold">{getInitials(user.name)}</span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-white truncate">{user.name}</p>
              <p className="text-xs text-white/50 truncate">{user.email}</p>
            </div>
          )}
          {!collapsed && (
            <button className="text-white/40 hover:text-white transition-colors">
              <FiMoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-sidebar rounded-xl text-white shadow-lg"
      >
        <FiMenu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Desktop sidebar - always visible */}
      <div className="hidden md:block">{sidebarContent}</div>

      {/* Mobile sidebar - toggleable */}
      {mobileOpen && <div className="md:hidden fixed inset-y-0 left-0 z-40">{sidebarContent}</div>}
    </>
  );
}
