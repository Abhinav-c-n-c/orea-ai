'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useUIStore } from '../store/uiStore';
import Loader3D from './Loader3D';

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isNavigating, setIsNavigating } = useUIStore();

  // Turn off the loader whenever the pathname changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, setIsNavigating]);

  return (
    <div className="w-full h-full flex flex-col overflow-hidden" style={{ perspective: '2000px' }}>
      <AnimatePresence>
        {isNavigating ? (
          <motion.div
            key="global-loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="absolute inset-0 z-[100] rounded-xl overflow-hidden"
          >
            <Loader3D />
          </motion.div>
        ) : (
          <motion.div
            key={pathname}
            initial={{ opacity: 0, rotateX: -20, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, rotateX: 0, scale: 1, y: 0 }}
            exit={{ opacity: 0, rotateX: 20, scale: 0.9, y: -40 }}
            transition={{ type: 'spring', stiffness: 150, damping: 20, mass: 1 }}
            className="w-full h-full flex flex-col origin-center"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
