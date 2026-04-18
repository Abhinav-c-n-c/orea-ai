'use client';

import { ReactNode } from 'react';
import Navbar from '../../components/Navbar';
import ProtectedLayout from '../../components/ProtectedLayout';
import PageTransition from '../../components/PageTransition';

export default function ProtectedGroupLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedLayout>
      <div className="relative flex flex-col h-screen overflow-hidden">
        {/* Animated Wave Background */}
        <div className="wave-container">
          <div className="wave wave1"></div>
          <div className="wave wave2"></div>
          <div className="wave wave3"></div>
          <div className="wave wave4"></div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col px-6 py-4 md:px-10 md:py-6 lg:px-14 lg:py-8 overflow-hidden max-w-[1440px] w-full mx-auto gap-4 lg:gap-6">
          {/* Header Card */}
          <div className="flex-shrink-0 bg-white dark:bg-slate-900 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-surface-200 dark:border-slate-800 overflow-visible z-50">
            <Navbar />
          </div>

          {/* Main Content Card */}
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] border border-surface-200 dark:border-slate-800 overflow-hidden flex flex-col relative z-0">
            <PageTransition>{children}</PageTransition>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
