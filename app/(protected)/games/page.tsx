'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlayCircle, FiUsers, FiClock, FiPlus } from 'react-icons/fi';
import Header from '../../../components/Header';
import { useGameStore } from '../../../store/gameStore';
import { timeAgo } from '../../../utils/formatters';

export default function GamesLobby() {
  const router = useRouter();
  const { history, fetchHistory, createRoom, joinRoom, isLoading } = useGameStore();
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Removed handleCreateGame as it's now in the individual game pages

  const handleJoinGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      const room = await joinRoom(joinCode.trim());
      router.push(`/games/${room.type}/${room.roomId}`);
    } catch (err) {
      alert('Invalid room or failed to join');
    }
  };

  return (
    <main className="flex-1 flex flex-col h-full overflow-hidden bg-surface-50 dark:bg-slate-950 p-6 gap-6">
      <Header 
        title="Games Lobby" 
        subtitle="Play real-time multiplayer games" 
        icon={<FiPlayCircle className="w-5 h-5" />}
      />

      <div className="flex-1 overflow-y-auto w-full space-y-8 custom-scrollbar rounded-[4px]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tic Tac Toe Card */}
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded p-8 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <FiPlayCircle className="w-40 h-40" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-2 tracking-tight">Tic-Tac-Toe</h2>
              <p className="text-indigo-100 mb-8 font-medium">Classic X's and O's. For 2 players.</p>
              <button
                disabled={isLoading}
                onClick={() => router.push('/games/tictactoe')}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded font-bold flex items-center gap-2 transition-all active:scale-95 text-sm uppercase tracking-wider"
              >
                Game Details & Host
              </button>
            </div>
          </div>

          {/* Bingo Card */}
          <div className="bg-gradient-to-br from-emerald-400 to-teal-600 rounded p-8 text-white shadow-xl shadow-teal-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
              <FiPlayCircle className="w-40 h-40" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl font-black mb-2 tracking-tight">Bingo Match</h2>
              <p className="text-emerald-50 mb-8 font-medium">Multiplayer Bingo (1-25) against another player.</p>
              <button
                disabled={isLoading}
                onClick={() => router.push('/games/bingo')}
                className="px-6 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded font-bold flex items-center gap-2 transition-all active:scale-95 text-sm uppercase tracking-wider"
              >
                Game Details & Host
              </button>
            </div>
          </div>
        </div>

        {/* Join by Code */}
        <div className="bg-white dark:bg-slate-800 rounded p-6 md:p-8 border border-surface-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between">
          <div>
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-1">Join a Room</h3>
            <p className="text-surface-500 dark:text-slate-400 text-sm">Have a code from a friend? Enter it below to join their game.</p>
          </div>
          <form onSubmit={handleJoinGame} className="w-full md:w-auto flex items-center gap-3">
            <input
              type="text"
              placeholder="e.g. abcd123"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              className="px-4 py-3 rounded border border-surface-200 dark:border-slate-600 bg-surface-50 dark:bg-slate-700 outline-none focus:ring-2 focus:ring-primary-500 dark:text-white font-mono uppercase tracking-widest w-40"
              maxLength={8}
            />
            <button
              type="submit"
              disabled={isLoading || !joinCode}
              className="px-6 py-3 bg-surface-900 dark:bg-slate-600 text-white rounded font-bold hover:bg-black dark:hover:bg-slate-500 transition-colors disabled:opacity-50"
            >
              Join
            </button>
          </form>
        </div>

        {/* History */}
        <div>
          <h3 className="text-lg font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
            <FiClock className="text-primary-500" /> Recent Games
          </h3>
          <div className="bg-white dark:bg-slate-800 rounded border border-surface-100 dark:border-slate-700 shadow-sm overflow-hidden">
            {history.length > 0 ? (
              <div className="divide-y divide-surface-100 dark:divide-slate-700">
                {history.map((game) => (
                  <div key={game._id} className="p-4 flex items-center justify-between hover:bg-surface-50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer" onClick={() => router.push(`/games/${game.type}/${game.roomId}`)}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded flex items-center justify-center text-white ${game.type === 'tictactoe' ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
                        <FiPlayCircle className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-bold text-surface-900 dark:text-white capitalize flex items-center gap-2">
                          {game.type}
                          <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold ${
                            game.status === 'completed' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' :
                            game.status === 'in_progress' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                            'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'
                          }`}>
                            {game.status.replace('_', ' ')}
                          </span>
                        </div>
                        <div className="text-xs text-surface-500 mt-1 flex items-center gap-1">
                          <FiUsers className="w-3 h-3" /> {game.players.length}/2 Players • {timeAgo(game.createdAt)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {game.winner ? (
                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Winner: {game.winner.name}</span>
                      ) : game.status === 'completed' ? (
                        <span className="text-sm font-bold text-surface-500">Draw</span>
                      ) : (
                        <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">Room: {game.roomId}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center text-surface-500 font-medium">
                No recent games found. Host or join a game to get started!
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
