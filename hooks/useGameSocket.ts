'use client';

import { useEffect, useCallback } from 'react';
import ws from '../lib/ws';
import { useGameStore, GameRoom } from '../store/gameStore';

export const useGameSocket = (roomId?: string) => {
  const { setCurrentRoom } = useGameStore();

  useEffect(() => {
    if (!roomId) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (!token) return;

    // Ensure connected
    if (!ws.connected) {
      ws.connect(token);
    }

    // Join the game room
    ws.send('game:join', { roomId });

    // Listen for game updates
    const offUpdate = ws.on('game:update', (data) => {
      setCurrentRoom(data as GameRoom);
    });

    // Re-join on reconnect
    const offConnection = ws.onConnectionChange((online) => {
      if (online) {
        ws.send('game:join', { roomId });
      }
    });

    return () => {
      ws.send('game:leave', { roomId });
      offUpdate();
      offConnection();
      setCurrentRoom(null);
    };
  }, [roomId, setCurrentRoom]);

  const makeMove = useCallback(
    (newState: Record<string, unknown>, currentTurn?: string | null, winner?: string | null, status?: string) => {
      if (!roomId) return;
      ws.send('game:move', { roomId, state: newState, currentTurn, winner, status });
    },
    [roomId]
  );

  return { makeMove };
};
