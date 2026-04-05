'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../../../components/Header';
import { useGameStore } from '../../../../../store/gameStore';
import { useAuthStore } from '../../../../../store/authStore';
import { useGameSocket } from '../../../../../hooks/useGameSocket';
import { useSocket } from '../../../../../hooks/useSocket';
import { FiCopy, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';



const getCompletedLines = (grid: number[], calledNumbers: number[]) => {
  const completedLines: string[] = [];
  const isCalled = (val: number) => calledNumbers.includes(val);

  if (!grid || grid.length === 0) return completedLines;

  // Rows
  for (let i = 0; i < 5; i++) {
    let match = true;
    for (let j = 0; j < 5; j++) {
      if (!isCalled(grid[i * 5 + j])) {
        match = false;
        break;
      }
    }
    if (match) completedLines.push(`row-${i}`);
  }

  // Columns
  for (let i = 0; i < 5; i++) {
    let match = true;
    for (let j = 0; j < 5; j++) {
      if (!isCalled(grid[j * 5 + i])) {
        match = false;
        break;
      }
    }
    if (match) completedLines.push(`col-${i}`);
  }

  // Diagonal 1
  let matchDiag1 = true;
  for (let i = 0; i < 5; i++) {
    if (!isCalled(grid[i * 5 + i])) matchDiag1 = false;
  }
  if (matchDiag1) completedLines.push(`diag-1`);

  // Diagonal 2
  let matchDiag2 = true;
  for (let i = 0; i < 5; i++) {
    if (!isCalled(grid[i * 5 + (4 - i)])) matchDiag2 = false;
  }
  if (matchDiag2) completedLines.push(`diag-2`);

  return completedLines;
};

const checkBingoLines = (grid: number[], calledNumbers: number[]) => {
  return getCompletedLines(grid, calledNumbers).length;
};

export default function BingoPage() {
  useSocket();
  const { roomId } = useParams() as { roomId: string };
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentRoom, getRoomDetails, setCurrentRoom } = useGameStore();
  const { makeMove } = useGameSocket(roomId);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (roomId) {
      getRoomDetails(roomId);
    }
  }, [roomId, getRoomDetails]);

  const player1 = currentRoom?.players[0]?.user;
  const player2 = currentRoom?.players[1]?.user;
  const isPlayer1 = player1 && user && player1._id === user._id;
  const isPlayer2 = player2 && user && player2._id === user._id;
  const isSpectator = !isPlayer1 && !isPlayer2;

  // Grid is pre-generated securely on the server!
  // Fallback for legacy rooms or if backend failed to prefill:
  useEffect(() => {
    if (!currentRoom || !user || isSpectator) return;
    
    const grids = currentRoom.state?.grids || {};
    if (!grids[user._id]) {
      const generateBingoGrid = () => {
        const nums = Array.from({ length: 25 }, (_, i) => i + 1);
        for (let i = nums.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [nums[i], nums[j]] = [nums[j], nums[i]];
        }
        return nums;
      };
      
      const myGrid = generateBingoGrid();
      const newGrids = { ...grids, [user._id]: myGrid };
      
      const currentTurnId = typeof currentRoom.currentTurn === 'string' ? currentRoom.currentTurn : currentRoom.currentTurn?._id;
      const winnerId = typeof currentRoom.winner === 'string' ? currentRoom.winner : currentRoom.winner?._id;
      
      makeMove({ ...currentRoom.state, grids: newGrids }, currentTurnId, winnerId, currentRoom.status);
    }
  }, [currentRoom, user, isSpectator, makeMove]);

  if (!currentRoom || !user) return <div className="p-12 text-center">Loading game...</div>;

  const grids = currentRoom.state?.grids || {};
  const myGrid: number[] = grids[user._id] || [];
  const calledNumbers: number[] = currentRoom.state?.calledNumbers || [];
  const completedLineTypes = myGrid.length ? getCompletedLines(myGrid, calledNumbers) : [];
  const linesCompleted = completedLineTypes.length;
  
  // Also check opponent lines to show how close they are
  const opponentId = isPlayer1 ? player2?._id : player1?._id;
  const opponentGrid = opponentId ? grids[opponentId] : [];
  const opponentLines = opponentGrid?.length ? checkBingoLines(opponentGrid, calledNumbers) : 0;

  const currentTurnId = typeof currentRoom.currentTurn === 'string' ? currentRoom.currentTurn : currentRoom.currentTurn?._id;
  const winnerId = typeof currentRoom.winner === 'string' ? currentRoom.winner : currentRoom.winner?._id;
  const isMyTurn = currentTurnId === user._id;
  const gameActive = currentRoom.status === 'in_progress';

  const handleClick = (num: number) => {
    if (!gameActive || !isMyTurn || isSpectator || calledNumbers.includes(num)) return;

    const newCalled = [...calledNumbers, num];
    const nextTurn = opponentId;
    let newStatus = currentRoom.status;
    let winner = null;

    // Check if I won with this move
    const myNewLines = checkBingoLines(myGrid, newCalled);
    if (myNewLines >= 5) {
      newStatus = 'completed';
      winner = user._id;
    } else {
      // Check if opponent accidentally won because of this call
      if (opponentGrid?.length) {
        const oppNewLines = checkBingoLines(opponentGrid, newCalled);
        if (oppNewLines >= 5) {
          newStatus = 'completed';
          winner = opponentId;
        }
      }
    }

    makeMove({ ...currentRoom.state, calledNumbers: newCalled }, nextTurn, winner, newStatus);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(currentRoom.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const letters = ['B', 'I', 'N', 'G', 'O'];

  return (
    <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-900 pb-12">
      <div className="bg-white dark:bg-slate-800 border-b border-surface-100 dark:border-slate-700 p-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <button onClick={() => router.push('/games')} className="flex items-center gap-2 text-surface-600 dark:text-slate-300 hover:text-primary-600 font-medium transition-colors">
          <FiArrowLeft /> Leave Game
        </button>
        <div className="flex bg-surface-100 dark:bg-slate-700 rounded overflow-hidden">
          <div className="px-4 py-2 text-sm font-mono font-bold dark:text-white">Room: {currentRoom.roomId}</div>
          <button onClick={copyRoomId} className="px-3 py-2 bg-primary-100 hover:bg-primary-200 text-primary-700 transition-colors flex items-center gap-1 text-xs font-bold uppercase">
            {copied ? 'Copied!' : <><FiCopy /> Copy</>}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full mt-8 px-4 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: status & players */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Status Alert */}
          <div className="animate-fade-in text-center lg:text-left">
            {currentRoom.status === 'waiting' ? (
              <div className="inline-flex items-center gap-2 px-6 py-3 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-500/20 shadow-sm">
                <FiRefreshCw className="w-5 h-5 animate-spin" /> Waiting for opponent...
              </div>
            ) : currentRoom.status === 'completed' ? (
              <div className="inline-flex flex-col items-center lg:items-start gap-1 px-8 py-5 rounded bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-xl shadow-teal-500/30 transform scale-105">
                <span className="text-3xl font-black">{currentRoom.winner?.name || winnerId === user._id ? 'You Win!' : 'Opponent Wins!'}</span>
                <span className="text-sm font-bold opacity-90 uppercase tracking-widest bg-white/20 px-3 py-1 rounded mt-2">Bingo!</span>
              </div>
            ) : (
              <div className={`inline-flex items-center gap-2 px-8 py-4 rounded font-bold shadow-lg transition-colors text-lg ${isMyTurn ? 'bg-emerald-500 text-white shadow-emerald-500/30 ring-4 ring-emerald-500/20' : 'bg-white dark:bg-slate-800 text-surface-600 dark:text-slate-300 border border-surface-100 dark:border-slate-700'}`}>
                {isMyTurn ? "Your Turn! Pick a number" : "Waiting for opponent's pick..."}
              </div>
            )}
          </div>

          {/* Players Info */}
          <div className="bg-white dark:bg-slate-800 rounded p-6 shadow-sm border border-surface-100 dark:border-slate-700">
            <h3 className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-4">Match Info</h3>
            
            <div className="space-y-4">
              <div className={`flex items-center justify-between p-3 rounded transition-colors ${currentTurnId === user._id ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-surface-50 dark:bg-slate-700'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-md">You</div>
                  <span className="font-bold text-surface-900 dark:text-white truncate max-w-[120px]">{user.name}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{Math.min(linesCompleted, 5)}/5</div>
                  <div className="text-[10px] font-bold text-surface-400 uppercase">Lines</div>
                </div>
              </div>

              <div className="flex justify-center text-surface-300 dark:text-slate-600 font-bold text-sm italic">VS</div>

              <div className={`flex items-center justify-between p-3 rounded transition-colors ${currentTurnId === opponentId ? 'bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20' : 'bg-surface-50 dark:bg-slate-700'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-surface-300 dark:bg-slate-600 flex items-center justify-center text-white font-bold">Opp</div>
                  <span className="font-bold text-surface-900 dark:text-white truncate max-w-[120px]">{player1?._id === opponentId ? player1?.name : player2?.name || 'Waiting...'}</span>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-surface-600 dark:text-slate-300">{Math.min(opponentLines, 5)}/5</div>
                  <div className="text-[10px] font-bold text-surface-400 uppercase">Lines</div>
                </div>
              </div>
            </div>
          </div>

          {/* Move History */}
          <div className="bg-white dark:bg-slate-800 rounded p-6 shadow-sm border border-surface-100 dark:border-slate-700">
            <h3 className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-4 flex items-center justify-between">
              <span>Move History</span>
              <span className="bg-surface-100 dark:bg-slate-700 text-surface-500 dark:text-slate-400 px-2 py-0.5 rounded-full text-[10px]">{calledNumbers.length} Picks</span>
            </h3>
            {calledNumbers.length === 0 ? (
              <div className="text-sm text-surface-400 dark:text-slate-500 italic text-center py-4">No numbers picked yet...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {calledNumbers.map((num, idx) => (
                  <div key={idx} className="w-8 h-8 bg-surface-100 dark:bg-slate-700 text-surface-600 dark:text-slate-300 rounded-full flex items-center justify-center text-sm font-bold shadow-sm animate-scale-in">
                    {num}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: The Grid */}
        <div className="lg:col-span-7 flex justify-center items-start">
          <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded shadow-2xl border border-surface-100 dark:border-slate-700 w-full max-w-md">
            {/* Grid */}
            <div className="relative grid grid-cols-5 gap-2 md:gap-3">
              {/* Full line strike overlay */}
              {completedLineTypes.length > 0 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }}>
                  {completedLineTypes.map((type) => {
                    let x1="0", y1="0", x2="100%", y2="100%";
                    if (type.startsWith('row-')) {
                      const row = parseInt(type.split('-')[1]);
                      const percent = (row * 20) + 10;
                      y1 = y2 = `${percent}%`;
                      x1 = "4%"; x2 = "96%";
                    } else if (type.startsWith('col-')) {
                      const col = parseInt(type.split('-')[1]);
                      const percent = (col * 20) + 10;
                      x1 = x2 = `${percent}%`;
                      y1 = "4%"; y2 = "96%";
                    } else if (type === 'diag-1') {
                      x1 = "4%"; y1 = "4%"; x2 = "96%"; y2 = "96%";
                    } else if (type === 'diag-2') {
                      x1 = "96%"; y1 = "4%"; x2 = "4%"; y2 = "96%";
                    }
                    return (
                      <line key={type} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#ef4444" strokeWidth="5" strokeLinecap="round" className="animate-fade-in opacity-40 mix-blend-multiply dark:mix-blend-lighten" />
                    );
                  })}
                </svg>
              )}
              {myGrid.map((num, i) => {
                const isCalled = calledNumbers.includes(num);
                return (
                  <button
                    key={i}
                    onClick={() => handleClick(num)}
                    disabled={!gameActive || !isMyTurn || isSpectator || isCalled}
                    className={`relative overflow-hidden aspect-square flex items-center justify-center rounded md:rounded text-base md:text-xl font-black transition-all duration-300 transform
                      ${isCalled ? 
                        'bg-surface-100 dark:bg-slate-800 text-surface-400 dark:text-slate-500 shadow-inner scale-95 opacity-80 border-transparent shadow-md shadow-inner' : 
                        gameActive && isMyTurn ? 
                        'bg-surface-50 dark:bg-slate-700 text-surface-800 dark:text-white hover:bg-emerald-50 dark:hover:bg-emerald-500/20 hover:text-emerald-600 dark:hover:text-emerald-400 hover:scale-105 active:scale-95 shadow-sm border border-surface-200 dark:border-slate-600' :
                        'bg-surface-50 dark:bg-slate-700 text-surface-800 dark:text-white opacity-80 cursor-not-allowed border border-surface-200 dark:border-slate-600'
                      }
                    `}
                  >
                    <span className={isCalled ? 'animate-scale-in line-through decoration-red-500 decoration-[3px]' : ''}>{num}</span>
                  </button>
                );
              })}
              {myGrid.length === 0 && (
                <div className="col-span-5 py-20 text-center text-surface-500 font-medium h-64 flex items-center justify-center bg-surface-50 dark:bg-slate-700 rounded">
                  Generating your lucky grid...
                </div>
              )}
            </div>
            
            {/* Bingo Text Indicator overlay (show how many letters lighted) */}
            <div className="mt-8 flex justify-between items-center px-2">
              {letters.map((l, i) => (
                <div key={i} className={`w-8 h-8 md:w-12 md:h-12 rounded flex items-center justify-center text-lg md:text-xl font-black transition-all duration-500 ${i < linesCompleted ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 animate-bounce' : 'bg-surface-100 dark:bg-slate-700 text-surface-400 dark:text-slate-500'}`}>
                  {l}
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
