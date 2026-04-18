'use client';

import React, { useState, useEffect } from 'react';

const MESSAGES = [
  'Spinning things into place…',
  'Getting everything lined up for you…',
  'Loading something awesome…',
  'Almost ready, just a second…',
  'Bringing your experience to life…',
];

export default function Loader3D() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)]);
  }, []);

  return (
    <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-white/90 dark:bg-slate-900/90 backdrop-blur-md">
      <style>{`
        .loader-container {
          perspective: 1000px;
        }
        .torus {
          width: 120px;
          height: 120px;
          transform-style: preserve-3d;
          animation: rotateTorus 4s linear infinite;
        }
        .segment {
          position: absolute;
          top: 50%;
          left: 50%;
          transform-style: preserve-3d;
        }
        .dot {
          width: 10px;
          height: 10px;
          margin-top: -5px;
          margin-left: -5px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #4ade80, #0d9488);
          box-shadow: 0 0 8px rgba(13, 148, 136, 0.6);
          animation: pulseDot 2s ease-in-out infinite;
        }
        @keyframes rotateTorus {
          0% { transform: rotateX(60deg) rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateX(60deg) rotateY(360deg) rotateZ(360deg); }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.5); opacity: 1; }
        }
      `}</style>

      <div className="loader-container">
        <div className="torus">
          {[...Array(36)].map((_, i) => {
            const angle = (i * 10 * Math.PI) / 180;
            // Radius of the main ring reduced
            const R = 45;
            // Twist rotation
            const twist = i * 20;
            return (
              <div
                key={i}
                className="segment"
                style={{
                  transform: `rotateY(${i * 10}deg) translateZ(${R}px) rotateX(${twist}deg) translateY(12px)`,
                }}
              >
                <div className="dot" style={{ animationDelay: `${i * 0.05}s` }}></div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 text-center flex flex-col gap-2">
        <h3 className="text-xl font-black uppercase tracking-widest text-primary-600 dark:text-primary-400">
          Loading...
        </h3>
        <p className="text-sm font-bold text-surface-500 dark:text-slate-400 tracking-wide animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}
