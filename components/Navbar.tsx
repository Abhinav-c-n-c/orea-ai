'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FiHome,
  FiCheckSquare,
  FiEdit3,
  FiMessageCircle,
  FiUsers,
  FiSettings,
  FiSun,
  FiMoon,
  FiMoreVertical,
  FiPlayCircle,
  FiLogOut,
  FiMenu,
  FiX,
} from 'react-icons/fi';
import Swal from 'sweetalert2';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { hasPermission } from '../utils/permissions';
import { getInitials } from '../utils/formatters';
import { useUIStore } from '../store/uiStore';

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

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useChatStore();
  const { setIsNavigating } = useUIStore();
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (e: React.MouseEvent, href: string) => {
    // If already on the page, do nothing
    if (pathname === href) return;

    e.preventDefault();
    setIsNavigating(true);

    // Artificial delay to show off the 3D Spatial Loader
    setTimeout(() => {
      router.push(href);
    }, 1200);
  };

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

  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'You will be logged out of your account',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0d9488',
      cancelButtonColor: '#ef4444',
      confirmButtonText: 'Yes, logout!',
    }).then(async (result) => {
      if (result.isConfirmed) {
        await logout();
        router.push('/login');
      }
    });
  };

  if (!user) return null;

  return (
    <header className="flex-shrink-0 relative z-50 rounded-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex justify-between h-16">
          {/* Logo - acting as Dashboard link */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/dashboard" className="flex items-center gap-3">
              <img
                src={
                  isDark
                    ? 'https://res.cloudinary.com/dybv5ghlb/image/upload/v1775387898/orea-logo_c0dkac.png'
                    : 'https://res.cloudinary.com/dybv5ghlb/image/upload/v1776542738/image_2_xzef7n.png'
                }
                alt="Logo Full"
                className="object-contain h-14 hidden md:block"
              />
              <img
                src={
                  isDark
                    ? 'https://res.cloudinary.com/dybv5ghlb/image/upload/v1775387898/orea-logo_c0dkac.png'
                    : 'https://res.cloudinary.com/dybv5ghlb/image/upload/v1776542738/image_2_xzef7n.png'
                }
                alt="Logo"
                className="object-contain h-8 md:hidden"
              />
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 mx-6 flex-1 justify-center">
            {navItems.map((item) => {
              // Hide dashboard item since it's on the logo now
              if (item.label === 'Dashboard') return null;

              if (item.permission && !hasPermission(user.permissions, item.permission)) {
                return null;
              }

              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-bold tracking-wide transition-all duration-200 ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-400 underline decoration-2 underline-offset-4 decoration-primary-500'
                      : 'text-surface-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.label === 'Chat' && unreadCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-surface-500 hover:bg-surface-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              title={isDark ? 'Light Mode' : 'Dark Mode'}
            >
              {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>

            {/* Settings */}
            <Link
              href="/settings"
              onClick={(e) => handleNavClick(e, '/settings')}
              className="p-2 rounded-md text-surface-500 hover:bg-surface-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              title="Settings"
            >
              <FiSettings className="w-5 h-5" />
            </Link>

            {/* Divider */}
            <div className="h-6 w-px bg-surface-200 dark:bg-slate-700 mx-1"></div>

            {/* Profile Dropdown (simplified) */}
            <div className="flex items-center gap-3 pl-2">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm overflow-hidden">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white text-xs font-bold">{getInitials(user.name)}</span>
                )}
              </div>
              <div className="hidden lg:block min-w-0 max-w-[120px]">
                <p className="text-sm font-bold text-surface-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-surface-500 dark:text-slate-400 truncate">
                  {user.email}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="ml-2 flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors text-sm font-medium"
              >
                <FiLogOut className="w-4 h-4" />
                <span className="hidden xl:inline">Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-1">
            <Link
              href="/settings"
              onClick={(e) => handleNavClick(e, '/settings')}
              className="p-2 rounded-md text-surface-500 hover:bg-surface-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              <FiSettings className="w-5 h-5" />
            </Link>
            <button
              onClick={toggleTheme}
              className="p-2 rounded-md text-surface-500 hover:bg-surface-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              {isDark ? <FiSun className="w-5 h-5" /> : <FiMoon className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-surface-500 hover:text-surface-900 hover:bg-surface-100 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {mobileMenuOpen ? (
                <FiX className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <FiMenu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-slate-900 border-b border-surface-200 dark:border-slate-800 shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              if (item.label === 'Dashboard') return null;
              if (item.permission && !hasPermission(user.permissions, item.permission)) return null;

              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleNavClick(e, item.href);
                  }}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-base font-bold tracking-wide ${
                    isActive
                      ? 'text-primary-600 dark:text-primary-400 underline decoration-2 underline-offset-4 decoration-primary-500'
                      : 'text-surface-700 hover:text-primary-600 dark:text-slate-300 dark:hover:text-primary-400'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {item.label === 'Chat' && unreadCount > 0 && (
                    <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}

            <Link
              href="/settings"
              onClick={(e) => {
                setMobileMenuOpen(false);
                handleNavClick(e, '/settings');
              }}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-base font-medium text-surface-700 hover:bg-surface-50 hover:text-surface-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              <FiSettings className="w-5 h-5" />
              <span>Settings</span>
            </Link>
          </div>

          <div className="pt-4 pb-3 border-t border-surface-200 dark:border-slate-700">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-md bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center overflow-hidden">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-sm font-bold">{getInitials(user.name)}</span>
                  )}
                </div>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <div className="text-base font-medium text-surface-800 dark:text-white truncate">
                  {user.name}
                </div>
                <div className="text-sm font-medium text-surface-500 dark:text-slate-400 truncate">
                  {user.email}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto flex-shrink-0 p-2 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <FiLogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
