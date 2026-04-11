'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../../components/Header';
import { useGameStore } from '../../../../store/gameStore';
import { FiArrowLeft, FiPlus, FiTrendingUp, FiZap } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function BingoRules() {
  const router = useRouter();
  const { createRoom, isLoading } = useGameStore();

  const handleCreateGame = async () => {
    try {
      const room = await createRoom('bingo');
      router.push(`/games/bingo/${room.roomId}`);
    } catch (err) {
      console.error(err);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 pb-12 custom-scrollbar">
      <Header 
        title="Bingo Protocol" 
        subtitle="Operational Briefing & Session Initialization" 
        icon={<FiZap className="text-white" />}
      />

      <div className="max-w-[1200px] mx-auto w-full mt-4 px-6">




        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="bg-white dark:bg-slate-900 rounded-[4px] shadow-2xl border border-primary-50 dark:border-slate-800 overflow-hidden"
        >
          {/* Card Navigation */}
          <div className="bg-slate-50/50 dark:bg-slate-950/20 px-6 py-3 border-b border-primary-50 dark:border-slate-800 flex items-center">
            <motion.button 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => router.push('/games')} 
              className="flex items-center gap-2 text-surface-400 hover:text-primary-600 font-black text-[10px] uppercase tracking-widest transition-all group"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" /> 
              Back to Gaming Arena
            </motion.button>
          </div>

          {/* Persona Briefing Bar */}
          <div className="bg-primary-50 dark:bg-primary-500/5 p-5 border-b border-primary-100 dark:border-slate-800 flex items-center gap-6">
            <div className="w-16 h-16 rounded-full border-2 border-primary-500/20 p-1 bg-white dark:bg-slate-800 flex-shrink-0 shadow-lg">
              <img 
                src="https://res.cloudinary.com/dybv5ghlb/image/upload/v1775386584/logo_girl_iq32ps.png" 
                alt="Arena Host" 
                className="w-full h-full object-contain rounded-full bg-primary-50 dark:bg-primary-500/10 p-1"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[9px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest mb-1.5">
                <FiTrendingUp className="w-3.5 h-3.5" /> Host Briefing In Progress
              </div>
              <p className="text-xs md:text-sm text-surface-600 dark:text-slate-400 font-medium italic leading-relaxed">
                "Welcome to the Bingo Protocol. I've initialized the RNG cores for this session. Please review the operational steps before hosting."
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row">
            {/* Image section */}
            <motion.div variants={itemVariants} className="lg:w-1/2 bg-slate-50 dark:bg-slate-950 p-8 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-primary-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              <div className="relative w-full max-w-sm aspect-square rounded-[4px] shadow-2xl overflow-hidden border border-primary-100 dark:border-slate-800 transform group-hover:scale-[1.02] transition-transform duration-700 bg-white dark:bg-slate-900">
                <Image src="/bingo-rule.png" alt="Bingo UI Preview" fill className="object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>

            {/* Rules Section */}
            <div className="lg:w-1/2 p-6 lg:p-10 flex flex-col justify-center">
              <motion.div variants={itemVariants}>
                <h2 className="text-2xl font-black text-surface-900 dark:text-white mb-2 tracking-tighter uppercase">Bingo Arena</h2>
                <p className="text-surface-400 dark:text-slate-400 font-medium mb-8 text-[11px] leading-relaxed uppercase tracking-wider">
                  High-speed numeric synchronization protocol. Achieve 5-line saturation to terminate session.
                </p>
              </motion.div>

              <div className="space-y-4 mb-8">
                <motion.div variants={itemVariants} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-primary-500/20 flex items-center justify-center flex-shrink-0 shadow-lg relative overflow-hidden group/step">
                    <img src="https://res.cloudinary.com/dybv5ghlb/image/upload/v1775386584/logo_girl_iq32ps.png" alt="" className="w-full h-full object-contain p-1.5 transition-transform duration-700 group-hover/step:scale-110" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-surface-900 dark:text-white uppercase tracking-wider text-[11px]">Grid Initialization</h3>
                    </div>
                    <p className="text-[10px] text-surface-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                      Both nodes are assigned uniquely randomized 5x5 numeric arrays (Range: 01-25).
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-amber-500/20 flex items-center justify-center flex-shrink-0 shadow-lg relative overflow-hidden group/step">
                    <img src="https://res.cloudinary.com/dybv5ghlb/image/upload/v1775386584/logo_girl_iq32ps.png" alt="" className="w-full h-full object-contain p-1.5 transition-transform duration-700 group-hover/step:scale-110" />
                  </div>
                  <div>
                    <h3 className="font-black text-surface-900 dark:text-white uppercase tracking-wider text-[11px]">Target Acquisition</h3>
                    <p className="text-[10px] text-surface-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                      Select uncalled nodes on your turn. These will be synchronized across both player arrays instantly.
                    </p>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 border-2 border-emerald-500/20 flex items-center justify-center flex-shrink-0 shadow-lg relative overflow-hidden group/step">
                    <img src="https://res.cloudinary.com/dybv5ghlb/image/upload/v1775386584/logo_girl_iq32ps.png" alt="" className="w-full h-full object-contain p-1.5 transition-transform duration-700 group-hover/step:scale-110" />
                  </div>
                  <div>
                    <h3 className="font-black text-surface-900 dark:text-white uppercase tracking-wider text-[11px]">Session Termination</h3>
                    <p className="text-[10px] text-surface-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                      Complete 5 operational lines (H/V/D) to achieve Bingo state and secure the match win.
                    </p>
                  </div>
                </motion.div>
              </div>

              <motion.button
                variants={itemVariants}
                whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(16, 185, 129, 0.4)' }}
                whileTap={{ scale: 0.98 }}
                disabled={isLoading}
                onClick={handleCreateGame}
                className="w-full px-8 py-5 bg-emerald-500 dark:bg-emerald-600 text-white rounded-[4px] font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/20 text-sm uppercase tracking-[0.2em] relative overflow-hidden group/btn"
              >
                <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
                <FiPlus className="w-5 h-5" /> Host Session Now
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
