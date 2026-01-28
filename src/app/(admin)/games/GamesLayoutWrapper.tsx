/**
 * GamesLayoutWrapper
 * 
 * Wrapper client para o layout do módulo de jogos
 * Necessário porque GamesProvider é Client Component
 */

'use client';

import { GamesProvider } from '@/context/GamesContext';

interface GamesLayoutWrapperProps {
  children: React.ReactNode;
}

export function GamesLayoutWrapper({ children }: GamesLayoutWrapperProps) {
  return <GamesProvider>{children}</GamesProvider>;
}
