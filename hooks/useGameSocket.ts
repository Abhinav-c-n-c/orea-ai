'use client';

import { useEffect, useCallback } from 'react';
import { getSocket, connectSocket } from '../lib/socket';
import { useGameStore, GameRoom } from '../store/gameStore';

export const useGameSocket = (roomId?: string) => {
  const { setCurrentRoom } = useGameStore();

  useEffect(() => {
    let socket = getSocket();
    if (!socket) {
      const token = localStorage.getItem('accessToken');
      if (token) socket = connectSocket(token);
    }
    
    if (!socket || !roomId) return;

    // Join the specific game room initially
    socket.emit('game:join', { roomId });

    // Listen for updates to the room state
    const handleGameUpdate = (updatedRoom: GameRoom) => {
      setCurrentRoom(updatedRoom);
    };

    const handleConnect = () => {
      socket.emit('game:join', { roomId });
    };

    socket.on('game:update', handleGameUpdate);
    socket.on('connect', handleConnect);

    return () => {
      socket.emit('game:leave', { roomId });
      socket.off('game:update', handleGameUpdate);
      socket.off('connect', handleConnect);
      setCurrentRoom(null);
    };
  }, [roomId, setCurrentRoom]);

  // Make a turn/move
  const makeMove = useCallback(
    (newState: Record<string, any>, currentTurn?: string | null, winner?: string | null, status?: string) => {
      const socket = getSocket();
      if (!socket || !roomId) return;

      socket.emit('game:move', {
        roomId,
        state: newState,
        currentTurn,
        winner,
        status,
      });
    },
    [roomId]
  );

  return { makeMove };
};
