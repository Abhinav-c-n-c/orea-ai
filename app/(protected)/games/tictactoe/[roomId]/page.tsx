'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../../../components/Header';
import { useGameStore } from '../../../../../store/gameStore';
import { useAuthStore } from '../../../../../store/authStore';
import { useGameSocket } from '../../../../../hooks/useGameSocket';
import { FiCopy, FiUser, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { getInitials } from '../../../../../utils/formatters';

const WINNING_COMBOS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Cols
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

export default function TicTacToePage() {
  const { roomId } = useParams() as { roomId: string };
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentRoom, getRoomDetails, isLoading } = useGameStore();
  const { makeMove } = useGameSocket(roomId);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (roomId) {
      getRoomDetails(roomId);
    }
  }, [roomId, getRoomDetails]);

  if (!currentRoom || !user) return <div className="p-12 text-center">Loading game...</div>;

  const player1 = currentRoom.players[0]?.user;
  const player2 = currentRoom.players[1]?.user;
  const isPlayer1 = player1?._id === user._id;
  const isPlayer2 = player2?._id === user._id;
  const isSpectator = !isPlayer1 && !isPlayer2;

  const mySymbol = isPlayer1 ? 'X' : isPlayer2 ? 'O' : null;
  const board: (string | null)[] = currentRoom.state?.board || Array(9).fill(null);
  
  const currentTurnId = typeof currentRoom.currentTurn === 'string' ? currentRoom.currentTurn : currentRoom.currentTurn?._id;
  const isMyTurn = currentTurnId === user._id;
  const gameActive = currentRoom.status === 'in_progress';

  const checkWinner = (newBoard: (string | null)[]) => {
    for (const combo of WINNING_COMBOS) {
      const [a, b, c] = combo;
      if (newBoard[a] && newBoard[a] === newBoard[b] && newBoard[a] === newBoard[c]) {
        return newBoard[a]; // return userId
      }
    }
    return null;
  };

  const handleClick = (index: number) => {
    if (!gameActive || !isMyTurn || board[index] || isSpectator) return;

    const newBoard = [...board];
    newBoard[index] = user._id;

    const winnerId = checkWinner(newBoard);
    const isDraw = !winnerId && newBoard.every(cell => cell !== null);

    let nextTurn = null;
    let newStatus = currentRoom.status;

    if (winnerId || isDraw) {
      newStatus = 'completed';
    } else {
      nextTurn = isPlayer1 ? player2?._id : player1?._id;
    }

    makeMove({ board: newBoard }, nextTurn, winnerId, newStatus);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(currentRoom.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-900 pb-12">
      <div className="bg-white dark:bg-slate-800 border-b border-surface-100 dark:border-slate-700 p-4 flex items-center justify-between shadow-sm">
        <button onClick={() => router.push('/games')} className="flex items-center gap-2 text-surface-600 dark:text-slate-300 hover:text-primary-600 font-medium transition-colors">
          <FiArrowLeft /> Leave Game
        </button>
        <div className="flex bg-surface-100 dark:bg-slate-700 rounded-lg overflow-hidden">
          <div className="px-4 py-2 text-sm font-mono font-bold dark:text-white">Room: {currentRoom.roomId}</div>
          <button onClick={copyRoomId} className="px-3 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 transition-colors flex items-center gap-1 text-xs font-bold uppercase">
            {copied ? 'Copied!' : <><FiCopy /> Copy</>}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto w-full mt-8 px-4 flex flex-col items-center">
        {/* Status Area */}
        <div className="mb-10 text-center animate-fade-in">
          {currentRoom.status === 'waiting' ? (
            <div className="inline-flex items-center gap-2 px-6 py-3 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-500/20 shadow-sm">
              <FiRefreshCw className="w-5 h-5 animate-spin" /> Waiting for opponent...
            </div>
          ) : currentRoom.status === 'completed' ? (
            <div className="inline-flex flex-col items-center gap-2 px-8 py-4 rounded bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-xl shadow-teal-500/30 transform scale-110">
              <span className="text-3xl font-black">{currentRoom.winner ? `${currentRoom.winner.name} Wins!` : "It's a Draw!"}</span>
              <span className="text-sm font-medium opacity-90">Game Over</span>
            </div>
          ) : (
            <div className={`inline-flex items-center gap-2 px-8 py-3 rounded font-bold shadow-md transition-colors ${isMyTurn ? 'bg-primary-500 text-white shadow-primary-500/30' : 'bg-surface-200 dark:bg-slate-700 text-surface-600 dark:text-slate-300'}`}>
              {isMyTurn ? "Your Turn!" : "Waiting for opponent..."}
            </div>
          )}
        </div>

        {/* Players Area */}
        <div className="flex items-center justify-between w-full max-w-sm mb-12 relative">
          <div className={`flex flex-col items-center gap-2 transition-transform ${isPlayer1 ? 'scale-110' : 'opacity-70'} ${currentTurnId === player1?._id ? 'animate-pulse-soft' : ''}`}>
             <div className="w-16 h-16 rounded bg-indigo-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-500/30">X</div>
             <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded shadow-sm border border-surface-100 dark:border-slate-700 flex items-center gap-2">
               <div className="w-5 h-5 rounded bg-indigo-100 flex items-center justify-center text-indigo-700 text-[10px] font-bold">P1</div>
               <span className="text-xs font-bold dark:text-white truncate max-w-[80px]">{player1?.name || 'Waiting...'}</span>
             </div>
          </div>

          <div className="text-xl font-black text-surface-300 dark:text-slate-600">VS</div>

          <div className={`flex flex-col items-center gap-2 transition-transform ${isPlayer2 ? 'scale-110' : 'opacity-70'} ${currentTurnId === player2?._id ? 'animate-pulse-soft' : ''}`}>
             <div className="w-16 h-16 rounded bg-rose-500 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-rose-500/30">O</div>
             <div className="bg-white dark:bg-slate-800 px-3 py-1.5 rounded shadow-sm border border-surface-100 dark:border-slate-700 flex items-center gap-2">
               <span className="text-xs font-bold dark:text-white truncate max-w-[80px] text-right">{player2?.name || 'Waiting...'}</span>
               <div className="w-5 h-5 rounded bg-rose-100 flex items-center justify-center text-rose-700 text-[10px] font-bold">P2</div>
             </div>
          </div>
        </div>

        {/* The Board */}
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded shadow-2xl border border-surface-100 dark:border-slate-700">
          <div className="grid grid-cols-3 gap-3 md:gap-4 w-72 h-72 md:w-96 md:h-96">
            {board.map((cellObj, index) => {
              const cellVal = cellObj;
              const isX = cellVal === player1?._id;
              const isO = cellVal === player2?._id;
              
              return (
                <button
                  key={index}
                  onClick={() => handleClick(index)}
                  disabled={!!cellVal || !gameActive || !isMyTurn || isSpectator}
                  className={`relative flex items-center justify-center rounded md:rounded text-5xl md:text-7xl font-black transition-all duration-300 transform 
                    ${!cellVal ? 'bg-surface-50 dark:bg-slate-700 hover:bg-surface-100 dark:hover:bg-slate-600 hover:scale-[1.02] active:scale-95' : 
                    isX ? 'bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-500' : 'bg-rose-50/50 dark:bg-rose-500/10 text-rose-500'}
                    ${!gameActive && !cellVal ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <span className={`${cellVal ? 'animate-scale-in drop-shadow-md' : ''}`}>
                    {isX ? 'X' : isO ? 'O' : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </main>
  );
}
