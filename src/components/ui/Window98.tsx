'use client';

import React, { ReactNode } from 'react';

interface Window98Props {
  title: string;
  children: ReactNode;
  className?: string;
  onClose?: () => void;
  width?: string;
  height?: string;
}

export function Window98({ title, children, className = '', onClose, width = 'w-full max-w-2xl', height }: Window98Props) {
  return (
    <div className={`${width} ${className}`} style={{ height }}>
      {/* Window Container */}
      <div className="flex flex-col h-full"
        style={{
          backgroundColor: '#c0c0c0',
          border: '2px solid',
          borderColor: '#dfdfdf #000000 #000000 #dfdfdf',
          boxShadow: 'inset 1px 1px 0 #ffffff, inset -1px -1px 0 #808080'
        }}>

        {/* Title Bar */}
        <div className="flex items-center justify-between px-0.5 py-0.5 h-7"
          style={{
            background: 'linear-gradient(to right, #000080, #1084d0)',
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 'bold'
          }}>
          <div className="flex items-center gap-1 ml-0.5">
            <span style={{ fontSize: '14px' }}>📄</span>
            <span>{title}</span>
          </div>

          {/* Window Controls */}
          <div className="flex gap-0.5">
            {/* Minimize */}
            <button className="w-4 h-4 flex items-center justify-center"
              style={{
                backgroundColor: '#c0c0c0',
                border: '1px solid',
                borderColor: '#ffffff #000000 #000000 #ffffff',
                fontSize: '9px',
                color: 'black'
              }}>
              <span style={{ marginTop: '4px' }}>_</span>
            </button>

            {/* Maximize */}
            <button className="w-4 h-4 flex items-center justify-center"
              style={{
                backgroundColor: '#c0c0c0',
                border: '1px solid',
                borderColor: '#ffffff #000000 #000000 #ffffff',
                fontSize: '9px',
                color: 'black'
              }}>
              <span>□</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="w-4 h-4 flex items-center justify-center"
              style={{
                backgroundColor: '#c0c0c0',
                border: '1px solid',
                borderColor: '#ffffff #000000 #000000 #ffffff',
                fontSize: '9px',
                color: 'black',
                fontWeight: 'bold'
              }}>
              <span>✕</span>
            </button>
          </div>
        </div>

        {/* Window Content */}
        <div className="flex-1 overflow-auto p-2"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid',
            borderColor: '#808080 #ffffff #ffffff #808080',
            margin: '2px',
            fontSize: '11px',
            color: 'black'
          }}>
          {children}
        </div>
      </div>
    </div>
  );
}
