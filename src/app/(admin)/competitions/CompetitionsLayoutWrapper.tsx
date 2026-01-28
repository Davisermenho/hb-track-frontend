/**
 * CompetitionsLayoutWrapper
 * 
 * Wrapper client para o layout do módulo de competições
 * Necessário porque CompetitionsProvider é Client Component
 */

'use client';

import { CompetitionsProvider } from '@/context/CompetitionsContext';
import { CompetitionV2Provider } from '@/context/CompetitionV2Context';

interface CompetitionsLayoutWrapperProps {
  children: React.ReactNode;
}

export function CompetitionsLayoutWrapper({ children }: CompetitionsLayoutWrapperProps) {
  return (
    <CompetitionsProvider>
      <CompetitionV2Provider>
        {children}
      </CompetitionV2Provider>
    </CompetitionsProvider>
  );
}
