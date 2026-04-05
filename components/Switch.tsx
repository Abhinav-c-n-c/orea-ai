'use client';

import React from 'react';

interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export default function Switch({ label, className, ...props }: SwitchProps) {
  return (
    <label className={`flex items-center cursor-pointer ${className}`}>
      <div className="relative">
        <input type="checkbox" className="sr-only" {...props} />
        <div
          className={`block w-10 h-6 rounded-full transition-colors ${
            props.checked ? 'bg-indigo-600' : 'bg-gray-300'
          } ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        ></div>
        <div
          className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${
            props.checked ? 'transform translate-x-4' : ''
          }`}
        ></div>
      </div>
      {label && <div className="ml-3 text-gray-700 font-medium select-none">{label}</div>}
    </label>
  );
}
