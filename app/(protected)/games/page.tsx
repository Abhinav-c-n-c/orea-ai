'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  FiPlayCircle,
  FiUsers,
  FiClock,
  FiPlus,
  FiX,
  FiShield,
  FiTrendingUp,
} from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

import { useGameStore } from '../../../store/gameStore';
import { timeAgo } from '../../../utils/formatters';

export default function GamesLobby() {
  const router = useRouter();
  const { history, fetchHistory, createRoom, joinRoom, isLoading } = useGameStore();
  const [joinCode, setJoinCode] = useState('');
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Removed handleCreateGame as it's now in the individual game pages

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      const room = await joinRoom(joinCode.trim().toUpperCase());
      router.push(`/games/${room.type}/${room.roomId}`);
    } catch (err) {
      alert('Invalid room or failed to join');
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-surface-50 dark:bg-slate-950 p-6 gap-6 relative">
      <div className="flex-1 overflow-y-auto w-full space-y-8 custom-scrollbar rounded-[4px]">
        {/* Ultra-Enhanced Integrated Gaming Arena Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[4px] border border-primary-200 dark:border-slate-800 shadow-[0_40px_100px_-20px_rgba(0,100,100,0.2),0_15px_30px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] relative overflow-hidden group">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            ></div>
          </div>
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary-500/10 dark:bg-primary-500/20 rounded-full blur-3xl animate-pulse pointer-events-none"></div>

          <div className="relative z-10 p-5 md:p-6 flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left Section: Persona & Text */}
            <div className="flex flex-col md:flex-row items-center gap-6 flex-1 w-full lg:w-auto">
              <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 animate-slow-float">
                <img
                  src="https://res.cloudinary.com/dybv5ghlb/image/upload/v1775386584/logo_girl_iq32ps.png"
                  alt="Arena Host"
                  className="w-full h-full object-cover object-top relative z-10 drop-shadow-2xl"
                />
                <div className="absolute inset-0 bg-primary-500/20 rounded-full blur-2xl scale-75 animate-pulse"></div>
              </div>

              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 text-[9px] font-bold uppercase tracking-[0.2em] mb-2 shadow-sm border border-primary-200/50 dark:border-primary-500/20">
                  <FiTrendingUp className="w-3 h-3 animate-pulse" /> Live Ops
                </div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-surface-900 dark:text-white leading-none mb-2">
                  Ready to Play?
                </h2>
                <p className="text-xs md:text-sm text-surface-500 dark:text-slate-400 font-medium leading-relaxed max-w-md">
                  Jump into the action and rise to the top. Challenge players globally.
                </p>
              </div>
            </div>

            {/* Right Section: Actions & Join Form */}
            <div className="flex flex-col sm:flex-row items-center gap-3 md:gap-4 w-full lg:w-auto">
              <form
                onSubmit={handleJoinGame}
                className="flex flex-col xs:flex-row items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-[4px] border-2 border-primary-400 dark:border-primary-500 shadow-2xl shadow-primary-500/10 focus-within:ring-8 focus-within:ring-primary-500/10 transition-all w-full lg:w-auto min-h-[60px]"
              >
                <div className="relative w-full xs:w-auto flex-1 lg:flex-none">
                  <FiPlus className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500 w-4 h-4 z-10" />
                  <input
                    type="text"
                    placeholder="SESSION CODE"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="pl-9 pr-4 h-[44px] rounded-[2px] bg-surface-50 dark:bg-slate-900 border border-primary-100 dark:border-slate-800 outline-none transition-all text-surface-900 dark:text-white font-mono text-sm md:text-base uppercase tracking-[0.2em] md:tracking-[0.4em] w-full sm:w-80 placeholder:text-[10px] md:placeholder:text-xs placeholder:tracking-widest text-center shadow-inner font-black"
                    maxLength={8}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !joinCode}
                  className="w-full xs:w-auto px-6 md:px-8 h-[44px] bg-primary-600 hover:bg-primary-700 text-white rounded-[2px] font-black uppercase tracking-widest text-[10px] md:text-[11px] shadow-xl shadow-primary-600/30 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
                >
                  Connect
                </button>
              </form>

              <div className="h-[1px] w-full sm:h-12 sm:w-px bg-primary-100 dark:bg-slate-800/50"></div>

              <button
                onClick={() => setIsHistoryOpen(true)}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 h-[50px] md:h-[60px] rounded-[4px] bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-xl border border-emerald-200 dark:border-emerald-500/20 whitespace-nowrap"
              >
                <FiClock className="w-4 h-4" />
                <span>My Matches</span>
              </button>
            </div>
          </div>

          {/* Accent Line */}
          <div className="absolute bottom-0 left-0 h-[3px] w-full bg-gradient-to-r from-transparent via-primary-500/30 to-transparent">
            <div className="absolute inset-0 w-1/4 bg-gradient-to-r from-transparent via-primary-400 to-transparent animate-scan-fast"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {/* Tic Tac Toe Card */}
          <div
            className="group relative h-[200px] cursor-pointer overflow-hidden rounded-[4px] border border-indigo-500/20 shadow-[0_15px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_25px_50px_rgba(0,0,0,0.25)] md:h-[240px]"
            onClick={() => router.push('/games/tictactoe')}
          >
            <Image
              src="/images/tictactoe_preview.png"
              alt="Tic Tac Toe Protocol"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110 blur-[1px] group-hover:blur-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
            <div className="absolute inset-0 group-hover:bg-slate-900/20 transition-colors backdrop-blur-[1px] group-hover:backdrop-blur-0"></div>
            <div className="absolute bottom-0 left-0 p-6 z-10 w-full">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[4px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg">
                <FiPlayCircle className="h-5 w-5 text-indigo-400" />
              </div>
              <h2 className="mb-1 text-xl font-bold tracking-wide text-white drop-shadow-md">
                Tic-Tac-Toe
              </h2>
              <p className="text-[10px] font-bold tracking-[0.2em] text-indigo-200 uppercase drop-shadow-sm">
                Tactical Matrix Alignment Protocol
              </p>
            </div>
          </div>

          {/* Bingo Card */}
          <div
            className="group relative h-[200px] cursor-pointer overflow-hidden rounded-[4px] border border-emerald-500/20 shadow-[0_15px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all hover:scale-[1.02] hover:shadow-[0_25px_50px_rgba(0,0,0,0.25)] md:h-[240px]"
            onClick={() => router.push('/games/bingo')}
          >
            <Image
              src="/images/bingo_preview.png"
              alt="Bingo Arena Protocol"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-110 blur-[1px] group-hover:blur-0"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
            <div className="absolute inset-0 group-hover:bg-slate-900/20 transition-colors backdrop-blur-[1px] group-hover:backdrop-blur-0"></div>
            <div className="absolute bottom-0 left-0 p-6 z-10 w-full">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-[4px] bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg">
                <FiPlayCircle className="h-5 w-5 text-emerald-400" />
              </div>
              <h2 className="mb-1 text-xl font-bold tracking-wide text-white drop-shadow-md">
                Bingo Arena
              </h2>
              <p className="text-[10px] font-bold tracking-[0.2em] text-emerald-200 uppercase drop-shadow-sm">
                Multi-Lane Sync Protocol
              </p>
            </div>
          </div>

          {/* Drawing Guess Card (Coming Soon) */}
          <div className="group relative h-[200px] cursor-not-allowed overflow-hidden rounded-[4px] border border-orange-500/10 shadow-[0_15px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all grayscale opacity-80 hover:opacity-100 md:h-[240px]">
            <Image
              src="/images/drawing_preview.png"
              alt="Drawing Guess Protocol"
              fill
              className="object-cover blur-[2px]"
            />
            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]"></div>
            <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
              <div className="bg-orange-500/10 border border-orange-500/30 backdrop-blur-xl px-4 py-2 rounded-[4px]">
                <span className="text-[10px] font-black tracking-[0.3em] text-orange-500 uppercase">
                  Coming Soon
                </span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 p-6 z-10 w-full">
              <h2 className="mb-1 text-xl font-bold tracking-wide text-white/50">Drawing Guess</h2>
              <p className="text-[10px] font-bold tracking-[0.2em] text-white/30 uppercase">
                Visual Deciphering Protocol
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Match History Side Drawer */}
      <AnimatePresence>
        {isHistoryOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 250 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-50 dark:bg-slate-950 z-[101] shadow-[-20px_0_50px_rgba(0,0,0,0.3)] border-l border-primary-100 dark:border-slate-800 flex flex-col"
            >
              <div className="p-5 border-b border-primary-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border border-primary-100 dark:border-slate-800 p-1 bg-primary-50 dark:bg-primary-500/10">
                    <img
                      src="https://res.cloudinary.com/dybv5ghlb/image/upload/v1775386584/logo_girl_iq32ps.png"
                      alt="Arena Host"
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-surface-900 dark:text-white uppercase tracking-[0.2em]">
                      My Matches
                    </h3>
                    <p className="text-[9px] text-surface-400 font-bold uppercase tracking-widest">
                      {history.length} Matche(s) Played
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-surface-400 hover:text-red-500 rounded-[4px] transition-all"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {history.length > 0 ? (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{
                      hidden: { opacity: 0 },
                      visible: {
                        opacity: 1,
                        transition: {
                          staggerChildren: 0.02,
                          delayChildren: 0,
                        },
                      },
                    }}
                    className="space-y-4"
                  >
                    {history.map((game) => (
                      <motion.div
                        key={game._id}
                        variants={{
                          hidden: { x: 500, opacity: 0 },
                          visible: {
                            x: 0,
                            opacity: 1,
                            transition: {
                              type: 'tween',
                              duration: 0.15,
                              ease: 'circOut',
                            },
                          },
                        }}
                        className="relative cursor-pointer overflow-hidden rounded-[4px] border border-primary-50 bg-white p-3 shadow-md transition-all hover:border-primary-500/30 dark:border-slate-800 dark:bg-slate-900"
                        onClick={() => {
                          setIsHistoryOpen(false);
                          router.push(`/games/${game.type}/${game.roomId}`);
                        }}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex h-7 w-7 items-center justify-center rounded-[4px] text-white shadow-md ${game.type === 'tictactoe' ? 'bg-indigo-500 shadow-indigo-500/20' : 'bg-emerald-500 shadow-emerald-500/20'}`}
                            >
                              <FiPlayCircle className="h-3 w-3" />
                            </div>
                            <div>
                              <span className="block text-[11px] font-black uppercase tracking-tighter text-surface-900 dark:text-white">
                                {game.type === 'bingo' ? 'Bingo Arena' : 'Tic-Tac-Toe'}
                              </span>
                              <span className="block text-[8px] font-black uppercase tracking-widest text-surface-400">
                                {timeAgo(game.createdAt)}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`text-[7px] px-1.5 py-0.5 rounded-[2px] uppercase tracking-widest font-black border ${
                              game.status === 'completed'
                                ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                : game.status === 'in_progress'
                                  ? 'bg-blue-50/50 text-blue-600 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20'
                                  : 'bg-amber-50/50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                            }`}
                          >
                            OPS: {game.status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between border-y border-slate-50 py-1.5 dark:border-slate-800">
                          <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-tight text-surface-500">
                            <FiUsers className="h-2.5 w-2.5 text-primary-500" />
                            <span>{game.players.length} Nodes</span>
                          </div>
                          <div className="font-mono text-[9px] font-black uppercase tracking-widest text-primary-500">
                            #{game.roomId.substring(0, 6)}
                          </div>
                        </div>

                        <div className="relative mt-2 overflow-hidden rounded-[2px] border border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950/50">
                          {game.winner ? (
                            <div className="relative z-10 flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                              <span className="text-surface-400">Victor</span>
                              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                <div className="h-1 w-1 animate-pulse rounded-full bg-emerald-500"></div>
                                {game.winner.name}
                              </span>
                            </div>
                          ) : game.status === 'completed' ? (
                            <div className="relative z-10 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-surface-400">
                              <span>Result</span>
                              <span className="text-slate-500">Stalemate</span>
                            </div>
                          ) : (
                            <div className="relative z-10 flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                              <span className="text-surface-400 underline decoration-primary-500/30 underline-offset-4">
                                State: Waiting
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.03] grayscale contrast-200 -translate-y-1/2 translate-x-1/2 pointer-events-none">
                          <img
                            src="https://res.cloudinary.com/dybv5ghlb/image/upload/v1775386584/logo_girl_iq32ps.png"
                            alt=""
                          />
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <div className="p-20 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-primary-50 dark:bg-primary-500/10 rounded-full flex items-center justify-center">
                      <FiClock className="w-8 h-8 text-primary-200" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-surface-900 dark:text-white uppercase tracking-widest mb-1">
                        No Data Found
                      </h4>
                      <p className="text-xs text-surface-500 font-medium max-w-[180px]">
                        Initiate a session to generate operational logs.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}
