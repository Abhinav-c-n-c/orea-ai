'use client';

import { ReactNode } from 'react';
import Sidebar from '../../components/Sidebar';
import ProtectedLayout from '../../components/ProtectedLayout';

export default function ProtectedGroupLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedLayout>
      <div className="flex h-screen overflow-hidden bg-primary-50/30 dark:bg-slate-950">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {children}
        </div>
      </div>
    </ProtectedLayout>
  );
}
