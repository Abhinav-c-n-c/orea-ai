'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGameStore } from '../../../../../store/gameStore';
import { useAuthStore } from '../../../../../store/authStore';
import { useGameSocket } from '../../../../../hooks/useGameSocket';
import { useSocket } from '../../../../../hooks/useSocket';
import { FiCopy, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

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

const Celebration = () => {
  const particles = Array.from({ length: 100 });
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: '50vw',
            y: '50vh',
            scale: 0,
            rotate: 0,
            opacity: 1,
          }}
          animate={{
            x: [`50vw`, `${Math.random() * 100}vw`],
            y: [`50vh`, `${Math.random() * 100}vh`],
            scale: [0, 1, 0.5, 0],
            rotate: Math.random() * 720,
            opacity: [1, 1, 0.5, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 3,
            ease: 'easeOut',
            repeat: Infinity,
            repeatDelay: Math.random() * 2,
          }}
          className="absolute w-2 h-2 md:w-3 md:h-3 rounded-sm"
          style={{
            backgroundColor: colors[Math.floor(Math.random() * colors.length)],
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
          }}
        />
      ))}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: [0, 1.2, 1], opacity: 1 }}
        transition={{ duration: 0.8, ease: 'backOut' }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none"
      >
        <div className="text-6xl md:text-8xl font-black text-emerald-500 dark:text-emerald-400 drop-shadow-2xl filter blur-[1px] opacity-20 absolute inset-0 animate-pulse">
          BINGO!
        </div>
        <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-500 drop-shadow-lg relative">
          BINGO!
        </div>
      </motion.div>
    </div>
  );
};

const BingoCell = ({ 
  num, 
  isCalled, 
  isMyTurn, 
  gameActive, 
  isSpectator, 
  onClick, 
  calledByMe 
}: { 
  num: number; 
  isCalled: boolean; 
  isMyTurn: boolean; 
  gameActive: boolean; 
  isSpectator: boolean; 
  onClick: () => void;
  calledByMe: boolean;
}) => {
  return (
    <motion.div
      variants={{
        hidden: { scale: 0, opacity: 0, rotateY: 90 },
        visible: { scale: 1, opacity: 1, rotateY: 0 }
      }}
      whileHover={!isCalled && isMyTurn && !isSpectator ? { scale: 1.05, y: -2, zIndex: 10 } : {}}
      whileTap={!isCalled && isMyTurn && !isSpectator ? { scale: 0.95 } : {}}
      onClick={onClick}
      className={`relative aspect-square flex items-center justify-center rounded-[2px] shadow-sm border transition-all duration-500 cursor-pointer overflow-hidden
        ${isCalled 
          ? calledByMe 
            ? 'bg-primary-500/10 border-primary-500/30' 
            : 'bg-amber-500/10 border-amber-500/30'
          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500'
        }
      `}
    >
      <span className={`text-base md:text-xl font-black transition-colors duration-500 ${
        isCalled 
          ? calledByMe ? 'text-primary-600 dark:text-primary-400' : 'text-amber-600 dark:text-amber-400'
          : 'text-slate-800 dark:text-slate-100'
      }`}>
        {num}
      </span>

      {/* Slash Animation */}
      <AnimatePresence mode="wait">
        {isCalled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '60%', opacity: 1 }}
              transition={{ duration: 0.4, ease: "circOut" }}
              className={`h-[2.5px] rotate-45 shadow-[0_0_12px_rgba(0,0,0,0.3)] rounded-full
                ${calledByMe ? 'bg-primary-500' : 'bg-amber-500'}
              `}
            />
          </div>
        )}
      </AnimatePresence>

      {/* Interaction Glimmer */}
      <motion.div 
        animate={isCalled ? { opacity: [0, 0.4, 0] } : { opacity: 0 }}
        transition={{ duration: 1 }}
        className={`absolute inset-0 pointer-events-none ${calledByMe ? 'bg-primary-400/20' : 'bg-amber-400/20'}`} 
      />
    </motion.div>
  );
};

const LINE_COLORS = {
  'row-0': '#10b981', 'row-1': '#3b82f6', 'row-2': '#8b5cf6', 'row-3': '#f59e0b', 'row-4': '#ef4444',
  'col-0': '#06b6d4', 'col-1': '#6366f1', 'col-2': '#ec4899', 'col-3': '#f97316', 'col-4': '#14b8a6',
  'diag-1': '#a855f7', 'diag-2': '#eab308'
};

const Scanlines = () => (
  <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden opacity-[0.03] dark:opacity-[0.07]">
    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
  </div>
);

export default function BingoPage() {
  useSocket();
  const { roomId } = useParams() as { roomId: string };
  const router = useRouter();
  const { user } = useAuthStore();
  const { currentRoom, getRoomDetails, setCurrentRoom } = useGameStore();
  const { makeMove } = useGameSocket(roomId);
  const [copied, setCopied] = useState(false);
  const [replayLine, setReplayLine] = useState<{ type: string; timestamp: number } | null>(null);

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

  const opponentId = isPlayer1 ? player2?._id : player1?._id;
  const opponentGrid = opponentId ? grids[opponentId] : [];
  
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

    const myNewLines = checkBingoLines(myGrid, newCalled);
    if (myNewLines >= 5) {
      newStatus = 'completed';
      winner = user._id;
    } else if (opponentGrid?.length) {
      const oppNewLines = checkBingoLines(opponentGrid, newCalled);
      if (oppNewLines >= 5) {
        newStatus = 'completed';
        winner = opponentId;
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
    <main className="flex-1 flex flex-col h-full overflow-y-auto bg-slate-50 dark:bg-slate-900 pb-12 relative">
      <Scanlines />
      <div className="fixed inset-0 pointer-events-none opacity-[0.2] dark:opacity-[0.4]">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary-400 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-3 h-3 bg-emerald-400 rounded-full blur-xl animate-pulse delay-1000" />
      </div>

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
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="animate-fade-in text-center lg:text-left">
            {currentRoom.status === 'waiting' ? (
              <div className="flex items-center justify-center lg:justify-start gap-2 px-6 py-3 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold border border-amber-200 dark:border-amber-500/20 shadow-xl shadow-amber-500/5">
                <FiRefreshCw className="w-5 h-5 animate-spin" /> Waiting for opponent...
              </div>
            ) : currentRoom.status === 'completed' ? (
              <>
                {winnerId === user._id && <Celebration />}
                <div className="flex flex-col items-center lg:items-start gap-1 px-8 py-5 rounded bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-[0_20px_40px_-15px_rgba(16,185,129,0.5)]">
                  <span className="text-3xl font-black">{winnerId === user._id ? 'You Win!' : `${currentRoom.winner?.name || 'Opponent'} Wins!`}</span>
                  <span className="text-sm font-bold opacity-90 uppercase tracking-widest bg-white/20 px-3 py-1 rounded mt-2">Bingo!</span>
                </div>
              </>
            ) : (
              <div className={`flex items-center justify-center lg:justify-start gap-2 px-8 py-4 rounded font-bold transition-all text-lg ${isMyTurn ? 'bg-emerald-500 text-white shadow-[0_10px_30px_-10px_rgba(16,185,129,0.5)] ring-4 ring-emerald-500/20' : 'bg-white dark:bg-slate-800 text-surface-600 dark:text-slate-300 border border-surface-100 dark:border-slate-700 shadow-xl shadow-surface-200/50 dark:shadow-black/20'}`}>
                {isMyTurn ? "Your Turn! Pick a number" : "Waiting for opponent's pick..."}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800 rounded p-6 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] border border-surface-100 dark:border-slate-700">
            <h3 className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-4 flex items-center justify-between">
              <span>Move History</span>
              <span className="bg-surface-100 dark:bg-slate-700 text-surface-500 dark:text-slate-400 px-2 py-0.5 rounded-full text-[10px]">{calledNumbers.length} Picks</span>
            </h3>
            {calledNumbers.length === 0 ? (
              <div className="text-sm text-surface-400 dark:text-slate-500 italic text-center py-4">No numbers picked yet...</div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {calledNumbers.map((num, idx) => {
                  const isLast = idx === calledNumbers.length - 1;
                  return (
                    <motion.div 
                      key={idx} 
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${
                        isLast ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20 scale-110' : 'bg-surface-100 dark:bg-slate-700 text-surface-600 dark:text-slate-300'
                      }`}
                    >
                      {num}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 flex justify-center items-start">
          <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)] border border-surface-100 dark:border-slate-700 w-full max-w-md">
            <div className="relative grid grid-cols-5 gap-2 md:gap-3">
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" style={{ filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.2))' }}>
                <AnimatePresence mode="popLayout">
                  {completedLineTypes.map((type, idx) => {
                    let x1 = '0', y1 = '0', x2 = '100%', y2 = '100%';
                    if (type.startsWith('row-')) {
                      const row = parseInt(type.split('-')[1]);
                      const percent = (row * 20) + 10;
                      y1 = y2 = `${percent}%`; x1 = "4%"; x2 = "96%";
                    } else if (type.startsWith('col-')) {
                      const col = parseInt(type.split('-')[1]);
                      const percent = (col * 20) + 10;
                      x1 = x2 = `${percent}%`; y1 = "4%"; y2 = "96%";
                    } else if (type === 'diag-1') {
                      x1 = "4%"; y1 = "4%"; x2 = "96%"; y2 = "96%";
                    } else if (type === 'diag-2') {
                      x1 = "96%"; y1 = "4%"; x2 = "4%"; y2 = "96%";
                    }
                    
                    const isReplaying = replayLine?.type === type;

                    return (
                      <motion.line
                        key={isReplaying ? `${type}-${replayLine?.timestamp}` : type}
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ pathLength: 1, opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "circOut" }}
                        stroke={LINE_COLORS[type as keyof typeof LINE_COLORS] || '#10b981'}
                        strokeWidth={isReplaying ? "6" : "4"}
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 ${isReplaying ? '20px' : '12px'} ${LINE_COLORS[type as keyof typeof LINE_COLORS] || '#10b981'})`, zIndex: isReplaying ? 30 : 20 }}
                      />
                    );
                  })}
                </AnimatePresence>
              </svg>

              <motion.div 
                className="contents"
                initial="hidden" animate="visible"
                variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
              >
                {myGrid.map((num, idx) => (
                  <BingoCell
                    key={`${num}-${idx}`}
                    num={num}
                    isCalled={calledNumbers.includes(num)}
                    isMyTurn={isMyTurn}
                    gameActive={gameActive}
                    isSpectator={isSpectator}
                    calledByMe={calledNumbers.indexOf(num) % 2 === (isPlayer1 ? 0 : 1)}
                    onClick={() => handleClick(num)}
                  />
                ))}
              </motion.div>
            </div>

            <div className="mt-8 flex justify-between items-center px-2">
              {letters.map((l, i) => {
                const isLit = i < linesCompleted;
                const lineType = isLit ? completedLineTypes[i] : null;

                return (
                  <button
                    key={i}
                    disabled={!isLit}
                    onClick={() => lineType && setReplayLine({ type: lineType, timestamp: Date.now() })}
                    className={`w-8 h-8 md:w-12 md:h-12 rounded flex items-center justify-center text-lg md:text-xl font-black transition-all duration-500 active:scale-95 disabled:cursor-not-allowed
                      ${isLit 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 hover:emerald-600 cursor-pointer animate-pulse' 
                        : 'bg-surface-100 dark:bg-slate-700 text-surface-400 dark:text-slate-500'
                      }
                      ${replayLine?.type === lineType ? 'ring-4 ring-emerald-500/30 ring-offset-2 dark:ring-offset-slate-800' : ''}
                    `}
                  >
                    {l}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
