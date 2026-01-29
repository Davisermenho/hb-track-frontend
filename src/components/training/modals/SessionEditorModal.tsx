/**
 * SessionEditorModal
 *
 * Wrapper modal para o SessionEditClient.
 * Permite carregamento do editor por cima da agenda sem navegação de página.
 * 
 * IMPORTANTE: Inclui DndProvider próprio porque o Dialog renderiza em portal,
 * perdendo acesso ao DndProvider do TrainingLayoutWrapper.
 */

'use client';

import React, { Suspense } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface SessionEditorModalProps {
  sessionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
        <p className="text-sm text-muted-foreground">Carregando editor de sessão...</p>
      </div>
    </div>
  );
}

// Lazy load do SessionEditClient para melhor performance
const SessionEditClient = React.lazy(() =>
  import('@/app/(admin)/training/sessions/[id]/edit/SessionEditClient').then(module => ({
    default: module.default
  }))
);

export function SessionEditorModal({ sessionId, isOpen, onClose, onSuccess }: SessionEditorModalProps) {
  if (!sessionId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] p-0 overflow-hidden bg-slate-50">
        <DialogTitle className="sr-only">Editor de Sessão de Treino</DialogTitle>
        {/* DndProvider necessário porque Dialog renderiza em portal, perdendo contexto do TrainingLayoutWrapper */}
        <DndProvider backend={HTML5Backend}>
          <Suspense fallback={<LoadingState />}>
            <SessionEditClient
              sessionId={sessionId}
              onClose={onClose}
              onSuccess={onSuccess}
            />
          </Suspense>
        </DndProvider>
      </DialogContent>
    </Dialog>
  );
}
