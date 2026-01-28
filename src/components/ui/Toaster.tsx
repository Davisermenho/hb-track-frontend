'use client';

import { Toaster as SonnerToaster } from 'sonner';
import { useTheme } from '@/context/ThemeContext';

export function Toaster() {
  const { theme } = useTheme();

  return (
    <SonnerToaster
      theme={theme === 'dark' ? 'dark' : 'light'}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          borderRadius: '0.75rem',
          padding: '1rem',
        },
        className: 'font-sans',
      }}
    />
  );
}