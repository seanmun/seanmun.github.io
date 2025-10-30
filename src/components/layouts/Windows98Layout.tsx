'use client';

import React, { ReactNode } from 'react';

interface Windows98LayoutProps {
  children: ReactNode;
}

export function Windows98Layout({ children }: Windows98LayoutProps) {
  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#008080',
      fontFamily: 'Tahoma, "MS Sans Serif", Arial, sans-serif',
      imageRendering: 'pixelated'
    }}>
      {/* Desktop */}
      <div style={{ minHeight: '100vh', paddingBottom: '2.5rem' }}>
        {children}
      </div>

      {/* Taskbar */}
      <div className="fixed bottom-0 left-0 right-0 h-10 flex items-center px-0.5 py-0.5"
        style={{
          backgroundColor: '#c0c0c0',
          borderTop: '2px solid #ffffff',
          boxShadow: 'inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #808080'
        }}>

        {/* Start Button */}
        <button
          className="flex items-center gap-1 px-1.5 h-7 mr-1"
          style={{
            backgroundColor: '#c0c0c0',
            border: '2px solid',
            borderColor: '#ffffff #000000 #000000 #ffffff',
            boxShadow: 'inset 1px 1px 0 #dfdfdf, inset -1px -1px 0 #808080',
            fontSize: '11px',
            fontWeight: 'bold'
          }}
        >
          <span style={{ fontSize: '16px' }}>🪟</span>
          <span>Start</span>
        </button>

        {/* Taskbar Separator */}
        <div className="h-7 w-0.5 mr-1"
          style={{
            background: 'linear-gradient(to right, #808080, #ffffff)'
          }}
        />

        {/* Empty taskbar space */}
        <div className="flex-1" />

        {/* System Tray */}
        <div className="flex items-center h-7 px-2 mr-0.5"
          style={{
            border: '1px solid',
            borderColor: '#808080 #ffffff #ffffff #808080',
            fontSize: '11px'
          }}
        >
          <span className="mr-2">🔊</span>
          <span>{currentTime}</span>
        </div>
      </div>
    </div>
  );
}
