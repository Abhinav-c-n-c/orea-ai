'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../../components/Header';
import { useGameStore } from '../../../../store/gameStore';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';
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

  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-900 pb-12">
      <Header title="Bingo Match" subtitle="Game Rules & Setup" />

      <div className="max-w-4xl mx-auto w-full mt-8 px-4">
        <button onClick={() => router.push('/games')} className="flex items-center gap-2 text-surface-600 dark:text-slate-300 hover:text-primary-600 font-medium transition-colors mb-6">
          <FiArrowLeft /> Back to Lobby
        </button>

        <div className="bg-white dark:bg-slate-800 rounded shadow-md border border-surface-100 dark:border-slate-700 overflow-hidden">
          <div className="flex flex-col md:flex-row border-b border-surface-100 dark:border-slate-700">
            {/* Image section */}
            <div className="md:w-1/2 bg-emerald-50 dark:bg-slate-900 p-8 flex items-center justify-center">
              <div className="relative w-full max-w-sm aspect-square rounded shadow-xl overflow-hidden border border-white/20">
                <Image src="/bingo-rule.png" alt="Bingo UI Preview" fill className="object-cover" />
              </div>
            </div>

            {/* Rules Section */}
            <div className="md:w-1/2 p-8 md:p-12">
              <h2 className="text-3xl font-black text-surface-900 dark:text-white mb-2 tracking-tight">Multiplayer Bingo</h2>
              <p className="text-surface-500 dark:text-slate-400 font-medium mb-8">A fast-paced numbers race. Be the first to scratch off 5 consecutive lines to win.</p>

              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-3 bg-surface-50 dark:bg-slate-700/50 p-4 rounded border border-surface-100 dark:border-slate-600">
                  <div className="w-8 h-8 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center flex-shrink-0">1</div>
                  <div>
                    <h3 className="font-bold text-surface-900 dark:text-white">Unique Auto-Grids</h3>
                    <p className="text-sm text-surface-500 dark:text-slate-400 mt-1">Both you and your opponent are automatically given a uniquely randomized 5x5 grid containing numbers 1-25.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-surface-50 dark:bg-slate-700/50 p-4 rounded border border-surface-100 dark:border-slate-600">
                  <div className="w-8 h-8 rounded bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold flex items-center justify-center flex-shrink-0">2</div>
                  <div>
                    <h3 className="font-bold text-surface-900 dark:text-white">Call The Shots</h3>
                    <p className="text-sm text-surface-500 dark:text-slate-400 mt-1">On your turn, click any uncalled number on your grid. This marks the number on both your grid and your opponent's grid!</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-surface-50 dark:bg-slate-700/50 p-4 rounded border border-surface-100 dark:border-slate-600">
                  <div className="w-8 h-8 rounded bg-teal-100 dark:bg-teal-500/20 text-teal-600 dark:text-teal-400 font-bold flex items-center justify-center flex-shrink-0">3</div>
                  <div>
                    <h3 className="font-bold text-surface-900 dark:text-white">B-I-N-G-O to Win</h3>
                    <p className="text-sm text-surface-500 dark:text-slate-400 mt-1">The first player to complete 5 full lines (horizontal, vertical, or diagonal) instantly wins the game.</p>
                  </div>
                </div>
              </div>

              <button
                disabled={isLoading}
                onClick={handleCreateGame}
                className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-500/30 text-lg uppercase tracking-wider"
              >
                <FiPlus className="w-6 h-6" /> Host Room Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
