/**
 * TrainingLayoutWrapper
 * 
 * Wrapper client para o layout do módulo de treinos
 * - TrainingProvider: Gerencia estado global do training
 * - DndProvider: Habilita drag-and-drop de exercícios (Step 21)
 * - TrainingShellHeader: Chrome do módulo (título, breadcrumbs, zero ações agenda)
 * - TrainingTabs: Navegação horizontal entre subrotas
 * 
 * Necessário porque ambos são Client Components
 */

'use client';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TrainingProvider } from '@/context/TrainingContext';
import { TrainingShellHeader } from '@/components/training/TrainingShellHeader';
import { TrainingTabs } from '@/components/training/TrainingTabs';

interface TrainingLayoutWrapperProps {
  children: React.ReactNode;
}

export function TrainingLayoutWrapper({ children }: TrainingLayoutWrapperProps) {
  return (
    <DndProvider backend={HTML5Backend}>
      <TrainingProvider>
        <TrainingShellHeader />
        <TrainingTabs />
        <main className="flex-1">
          {children}
        </main>
      </TrainingProvider>
    </DndProvider>
  );
}
