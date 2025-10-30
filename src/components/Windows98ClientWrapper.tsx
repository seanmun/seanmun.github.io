'use client';

import React, { useEffect } from 'react';
import Windows98Website from './windows98-website';

interface Windows98ClientWrapperProps {
  galleryImages: string[];
}

export default function Windows98ClientWrapper({ galleryImages }: Windows98ClientWrapperProps) {
  useEffect(() => {
    // Set the theme to windows98 when this page loads
    document.documentElement.setAttribute('data-theme', 'windows98');
    document.body.classList.remove('dark');

    // Cleanup: reset to default theme when navigating away
    return () => {
      document.documentElement.setAttribute('data-theme', 'light');
    };
  }, []);

  return <Windows98Website galleryImages={galleryImages} />;
}
