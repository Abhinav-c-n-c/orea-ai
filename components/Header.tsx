import React from 'react';
import { useRouter } from 'next/navigation';
import { FiLogOut } from 'react-icons/fi';
import Swal from 'sweetalert2';
import { useAuthStore } from '../store/authStore';

interface HeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export default function Header({ title, subtitle, icon, children }: HeaderProps) {
  const { logout } = useAuthStore();
  const router = useRouter();

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

  return (
    <div className="flex items-center justify-between mb-0 flex-shrink-0 bg-white dark:bg-slate-800 p-4 rounded-[4px] shadow-sm border border-primary-100 dark:border-slate-700 transition-all duration-200">
      <div className="flex items-center gap-4">
        {/* LOGO / ICON BOX */}
        <div className="w-10 h-10 rounded-[4px] bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/20 flex-shrink-0">
          {icon ? (
            <div className="text-white w-5 h-5 flex items-center justify-center">
              {icon}
            </div>
          ) : (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
            </svg>
          )}
        </div>
        <div>
          <div className="text-xl md:text-2xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
            {title}
          </div>
          {subtitle && (
            <p className="text-surface-500 dark:text-slate-400 text-sm mt-0.5 hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {children}

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors font-medium text-sm"
        >
          <FiLogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </div>
  );
}
