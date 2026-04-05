'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../../../components/Header';
import { useGameStore } from '../../../../store/gameStore';
import { FiArrowLeft, FiPlus } from 'react-icons/fi';
import Image from 'next/image';

export default function TicTacToeRules() {
  const router = useRouter();
  const { createRoom, isLoading } = useGameStore();

  const handleCreateGame = async () => {
    try {
      const room = await createRoom('tictactoe');
      router.push(`/games/tictactoe/${room.roomId}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-900 pb-12">
      <Header title="Tic-Tac-Toe" subtitle="Game Rules & Setup" />

      <div className="max-w-4xl mx-auto w-full mt-8 px-4">
        <button onClick={() => router.push('/games')} className="flex items-center gap-2 text-surface-600 dark:text-slate-300 hover:text-primary-600 font-medium transition-colors mb-6">
          <FiArrowLeft /> Back to Lobby
        </button>

        <div className="bg-white dark:bg-slate-800 rounded shadow-md border border-surface-100 dark:border-slate-700 overflow-hidden">
          <div className="flex flex-col md:flex-row border-b border-surface-100 dark:border-slate-700">
            {/* Image section */}
            <div className="md:w-1/2 bg-indigo-50 dark:bg-slate-900 p-8 flex items-center justify-center">
              <div className="relative w-full max-w-sm aspect-square rounded shadow-xl overflow-hidden border border-white/20">
                <Image src="/tictactoe-rule.png" alt="Tic Tac Toe UI Preview" fill className="object-cover" />
              </div>
            </div>

            {/* Rules Section */}
            <div className="md:w-1/2 p-8 md:p-12">
              <h2 className="text-3xl font-black text-surface-900 dark:text-white mb-2 tracking-tight">Classic Duel</h2>
              <p className="text-surface-500 dark:text-slate-400 font-medium mb-8">Outsmart your opponent by matching three of your symbols in a row, column, or diagonal before they do.</p>

              <div className="space-y-4 mb-10">
                <div className="flex items-start gap-3 bg-surface-50 dark:bg-slate-700/50 p-4 rounded border border-surface-100 dark:border-slate-600">
                  <div className="w-8 h-8 rounded bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center flex-shrink-0">1</div>
                  <div>
                    <h3 className="font-bold text-surface-900 dark:text-white">Take Turns</h3>
                    <p className="text-sm text-surface-500 dark:text-slate-400 mt-1">Player 1 receives X, Player 2 receives O. Turns auto-alternate after each move.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-surface-50 dark:bg-slate-700/50 p-4 rounded border border-surface-100 dark:border-slate-600">
                  <div className="w-8 h-8 rounded bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold flex items-center justify-center flex-shrink-0">2</div>
                  <div>
                    <h3 className="font-bold text-surface-900 dark:text-white">Match 3 to Win</h3>
                    <p className="text-sm text-surface-500 dark:text-slate-400 mt-1">Click empty spaces to place your symbol. Align 3 symbols consecutively to win.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-surface-50 dark:bg-slate-700/50 p-4 rounded border border-surface-100 dark:border-slate-600">
                  <div className="w-8 h-8 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center flex-shrink-0">3</div>
                  <div>
                    <h3 className="font-bold text-surface-900 dark:text-white">Real-Time Fast Sync</h3>
                    <p className="text-sm text-surface-500 dark:text-slate-400 mt-1">If no spaces remain and no one has matched 3, the game ends in a Draw. Everything syncs instantly.</p>
                  </div>
                </div>
              </div>

              <button
                disabled={isLoading}
                onClick={handleCreateGame}
                className="w-full px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-black flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-600/30 text-lg uppercase tracking-wider"
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
