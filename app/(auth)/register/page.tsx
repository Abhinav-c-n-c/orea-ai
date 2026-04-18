'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser,
  FiMail,
  FiLock,
  FiCheck,
  FiArrowRight,
  FiShield,
  FiZap,
  FiLayout,
} from 'react-icons/fi';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    try {
      await register({ name, email, password });
      router.push('/tasks');
    } catch {
      // error handled by store
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-surface-50 dark:bg-slate-950 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary-100/30 dark:bg-primary-900/10 blur-[120px] pointer-events-none animate-pulse-soft"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent-100/20 dark:bg-accent-900/5 blur-[120px] pointer-events-none animate-pulse-soft"></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-7xl flex flex-col lg:flex-row gap-6 lg:gap-8 items-stretch"
      >
        {/* Left Card - Value Proposition */}
        <div className="lg:w-[38%] bg-gradient-to-br from-sidebar to-sidebar-dark p-8 md:p-10 flex flex-col justify-between relative overflow-hidden rounded-[4px] shadow-2xl border border-white/5">
          <div className="relative z-10 flex flex-col items-center text-center">
            <motion.div
              whileHover={{ rotate: -5, scale: 1.1 }}
              className="mb-8 flex justify-center w-full"
            >
              <img
                src="https://res.cloudinary.com/dybv5ghlb/image/upload/v1775387898/orea-logo_c0dkac.png"
                alt="Orea Logo"
                className="h-20 object-contain"
              />
            </motion.div>

            <h1 className="text-2xl md:text-3xl font-black text-white leading-tight uppercase tracking-tight mb-4">
              Join the <br />
              <span className="text-primary-300 font-black">Intelligence Network.</span>
            </h1>
            <p className="text-primary-100 text-sm font-medium leading-relaxed max-w-xs mb-8 opacity-80">
              Create your account to unlock collaborative task management, real-time communication,
              and industrial-grade note security.
            </p>

            <div className="space-y-6 border-t border-white/5 pt-8 mt-4 w-full max-w-[280px]">
              {[
                {
                  title: 'Secure Environment',
                  desc: 'Enterprise-grade encryption for every note and task.',
                  icon: <FiShield className="w-5 h-5" />,
                },
                {
                  title: 'Real-time Velocity',
                  desc: 'Instant synchronization across your entire workspace.',
                  icon: <FiZap className="w-5 h-5" />,
                },
                {
                  title: 'Infinite Workspace',
                  desc: 'Unlimited projects, notes, and collaborative nodes.',
                  icon: <FiLayout className="w-5 h-5" />,
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-4 text-left group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-primary-300 group-hover:scale-110 group-hover:bg-primary-300 group-hover:text-sidebar transition-all duration-300">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-primary-200/60 font-medium leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="mt-8 md:mt-12 relative z-10 flex flex-col items-center gap-3">
            <div className="h-[1px] w-8 bg-white/10"></div>
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-primary-300 text-center opacity-60">
              Empowering Teams with Precision
            </p>
          </div>
        </div>

        {/* Right Card - Registration Form */}
        <div className="flex-1 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white dark:bg-slate-900 rounded-[4px] shadow-2xl border border-white/5">
          <div className="max-w-sm mx-auto w-full">
            <div className="mb-10 text-center">
              <h2 className="text-3xl font-black text-surface-900 dark:text-white uppercase tracking-tight mb-2">
                Initialise Node
              </h2>
              <p className="text-[10px] font-black text-surface-400 lowercase tracking-widest leading-loose">
                Enrol in the network to begin area management protocol
              </p>
            </div>

            <AnimatePresence mode="wait">
              {displayError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-8 p-4 rounded-[4px] bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 text-red-700 dark:text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center flex-shrink-0">
                    ✕
                  </div>
                  <span className="flex-1">{displayError}</span>
                  <button
                    onClick={() => {
                      clearError();
                      setLocalError('');
                    }}
                    className="hover:text-red-900 dark:hover:text-red-300"
                  >
                    <FiArrowRight />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">
                  Full Identity
                </label>
                <div className="relative group">
                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-primary-600 transition-colors" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface-50 dark:bg-slate-800/50 rounded-[4px] border border-primary-100 dark:border-slate-700 text-sm font-bold text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-surface-300"
                    placeholder="Subject Name"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">
                  Email Allocation
                </label>
                <div className="relative group">
                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 group-focus-within:text-primary-600 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-surface-50 dark:bg-slate-800/50 rounded-[4px] border border-primary-100 dark:border-slate-700 text-sm font-bold text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-surface-300"
                    placeholder="protocol@node.com"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">
                    Pass-Key
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-50 dark:bg-slate-800/50 rounded-[4px] border border-primary-100 dark:border-slate-700 text-sm font-bold text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-surface-300"
                    placeholder="••••••"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest ml-1">
                    Confirm
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-surface-50 dark:bg-slate-800/50 rounded-[4px] border border-primary-100 dark:border-slate-700 text-sm font-bold text-surface-900 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all placeholder:text-surface-300"
                    placeholder="••••••"
                    required
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-4 py-4 bg-gradient-to-r from-primary-600 to-primary-800 text-white font-black uppercase tracking-widest shadow-xl shadow-primary-500/20 hover:shadow-primary-500/40 rounded-[4px] transition-all disabled:opacity-50 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? 'Initialising Node...' : 'Establish Connection'}
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-900 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </motion.button>
            </form>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-10 text-center text-[10px] font-black uppercase tracking-widest text-surface-500"
            >
              Already Registered?{' '}
              <Link
                href="/login"
                className="text-primary-600 hover:text-primary-700 border-b-2 border-primary-100 hover:border-primary-600 transition-all pb-0.5"
              >
                Subject Login
              </Link>
            </motion.p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
