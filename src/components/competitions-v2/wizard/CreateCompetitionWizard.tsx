/**
 * CreateCompetitionWizard - Wizard completo para criar competição com IA
 * 
 * Etapas:
 * 1. Upload - Selecionar PDF e informar nome da equipe
 * 2. Processing - IA processando o PDF
 * 3. Review - Revisar dados extraídos
 * 4. Confirm - Confirmar e salvar
 */

'use client';

import { useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCompetitionV2Context } from '@/context/CompetitionV2Context';
import { useTeamSeasonOptional } from '@/context/TeamSeasonContext';
import PDFUploadStep from './PDFUploadStep';
import ProcessingStep from './ProcessingStep';
import ReviewStep from './ReviewStep';
import ConfirmStep from './ConfirmStep';

interface CreateCompetitionWizardProps {
  teamId?: string;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: (competitionId: string) => void;
}

const STEPS = [
  { key: 'upload', label: 'Upload' },
  { key: 'processing', label: 'Processando' },
  { key: 'review', label: 'Revisar' },
  { key: 'confirm', label: 'Confirmar' },
] as const;

export default function CreateCompetitionWizard({ 
  teamId: propTeamId, 
  isOpen: propIsOpen,
  onClose, 
  onSuccess 
}: CreateCompetitionWizardProps) {
  const { 
    wizardStep, 
    setWizardStep, 
    isWizardOpen,
    closeWizard,
    resetWizard,
    processingError,
  } = useCompetitionV2Context();

  // Obter teamId do contexto se não for passado como prop
  const teamSeasonCtx = useTeamSeasonOptional();
  const teamId = propTeamId || teamSeasonCtx?.selectedTeam?.id || '';
  
  // Usar isOpen da prop ou do context
  const isOpen = propIsOpen !== undefined ? propIsOpen : isWizardOpen;

  const handleClose = useCallback(() => {
    closeWizard();
    onClose();
  }, [closeWizard, onClose]);

  const handleUploadComplete = useCallback(() => {
    setWizardStep('processing');
  }, [setWizardStep]);

  const handleProcessingSuccess = useCallback(() => {
    setWizardStep('review');
  }, [setWizardStep]);

  const handleProcessingError = useCallback(() => {
    // Volta para upload em caso de erro
    setWizardStep('upload');
  }, [setWizardStep]);

  const handleReviewComplete = useCallback(() => {
    setWizardStep('confirm');
  }, [setWizardStep]);

  const handleReviewBack = useCallback(() => {
    resetWizard();
    setWizardStep('upload');
  }, [resetWizard, setWizardStep]);

  const handleConfirmBack = useCallback(() => {
    setWizardStep('review');
  }, [setWizardStep]);

  const handleSuccess = useCallback((competitionId: string) => {
    onSuccess?.(competitionId);
    handleClose();
  }, [onSuccess, handleClose]);

  const currentStepIndex = STEPS.findIndex(s => s.key === wizardStep);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden 
                    bg-white dark:bg-gray-900 rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Nova Competição
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 
                     dark:hover:text-gray-300 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            {STEPS.map((step, index) => {
              const isActive = index === currentStepIndex;
              const isComplete = index < currentStepIndex;
              const isProcessing = step.key === 'processing' && wizardStep === 'processing';
              
              return (
                <div key={step.key} className="flex items-center">
                  <div className="flex items-center">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                      isActive 
                        ? 'bg-amber-500 text-white ring-4 ring-amber-100 dark:ring-amber-900/50'
                        : isComplete
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    )}>
                      {isComplete ? '✓' : index + 1}
                    </div>
                    <span className={cn(
                      'ml-2 text-sm font-medium hidden sm:block',
                      isActive 
                        ? 'text-amber-600 dark:text-amber-400'
                        : isComplete
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                    )}>
                      {step.label}
                    </span>
                  </div>
                  
                  {/* Connector */}
                  {index < STEPS.length - 1 && (
                    <div className={cn(
                      'w-8 sm:w-16 h-0.5 mx-2',
                      index < currentStepIndex
                        ? 'bg-green-500'
                        : 'bg-gray-200 dark:bg-gray-700'
                    )} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {/* Error display for processing errors */}
          {processingError && wizardStep === 'upload' && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">
                <strong>Erro no processamento:</strong> {processingError}
              </p>
              <p className="text-xs text-red-500 dark:text-red-500 mt-1">
                Tente novamente com um PDF diferente ou ajuste as dicas.
              </p>
            </div>
          )}

          {wizardStep === 'upload' && (
            <PDFUploadStep onNext={handleUploadComplete} />
          )}
          
          {wizardStep === 'processing' && (
            <ProcessingStep 
              onSuccess={handleProcessingSuccess} 
              onError={handleProcessingError}
            />
          )}
          
          {wizardStep === 'review' && (
            <ReviewStep 
              onNext={handleReviewComplete} 
              onBack={handleReviewBack}
            />
          )}
          
          {wizardStep === 'confirm' && (
            <ConfirmStep 
              teamId={teamId}
              onSuccess={handleSuccess}
              onBack={handleConfirmBack}
            />
          )}
        </div>
      </div>
    </div>
  );
}
