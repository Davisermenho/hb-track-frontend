/**
 * ProcessingStep - Etapa de processamento com IA
 * 
 * Exibe animação de loading enquanto a IA processa o PDF
 */

'use client';

import { useEffect, useState } from 'react';
import { Loader2, Sparkles, FileText, Brain, CheckCircle } from 'lucide-react';
import { useCompetitionV2Context } from '@/context/CompetitionV2Context';
import { useAIParsePdf } from '@/lib/hooks/useCompetitionsV2';
import { competitionsV2Service } from '@/lib/api/competitions-v2';

interface ProcessingStepProps {
  onSuccess: () => void;
  onError: () => void;
}

const PROCESSING_STEPS = [
  { icon: FileText, label: 'Lendo PDF...' },
  { icon: Brain, label: 'Analisando estrutura...' },
  { icon: Sparkles, label: 'Extraindo dados...' },
  { icon: CheckCircle, label: 'Finalizando...' },
];

export default function ProcessingStep({ onSuccess, onError }: ProcessingStepProps) {
  const {
    uploadedFile,
    ourTeamName,
    hints,
    setExtractedData,
    setProcessingError,
    setProcessingTimeMs,
    setIsProcessing,
  } = useCompetitionV2Context();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  // Simulação de progresso visual
  useEffect(() => {
    if (!hasStarted) return;
    
    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev < PROCESSING_STEPS.length - 1) return prev + 1;
        return prev;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [hasStarted]);

  // Processamento real
  useEffect(() => {
    const processFile = async () => {
      if (!uploadedFile || hasStarted) return;
      
      setHasStarted(true);
      setIsProcessing(true);
      
      try {
        // Converter para base64
        const base64 = await competitionsV2Service.fileToBase64(uploadedFile);
        
        // Enviar para IA
        const response = await competitionsV2Service.parsePdfWithAI(
          base64,
          ourTeamName,
          hints || undefined
        );
        
        setProcessingTimeMs(response.processing_time_ms);
        
        if (response.success && response.data) {
          setExtractedData(response.data);
          setCurrentStep(PROCESSING_STEPS.length - 1);
          
          // Pequeno delay para mostrar o último passo
          setTimeout(() => {
            setIsProcessing(false);
            onSuccess();
          }, 800);
        } else {
          setProcessingError(response.error || 'Erro ao processar PDF');
          setIsProcessing(false);
          onError();
        }
      } catch (err) {
        console.error('Error processing PDF:', err);
        setProcessingError(err instanceof Error ? err.message : 'Erro desconhecido');
        setIsProcessing(false);
        onError();
      }
    };
    
    processFile();
  }, [uploadedFile, ourTeamName, hints, hasStarted, setExtractedData, setProcessingError, setProcessingTimeMs, setIsProcessing, onSuccess, onError]);

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Ícone animado */}
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Loader2 className="w-12 h-12 text-amber-600 dark:text-amber-400 animate-spin" />
        </div>
        <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-pulse" />
      </div>
      
      {/* Título */}
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
        Processando com IA
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-8">
        Nossa IA está lendo o regulamento e extraindo os dados
      </p>
      
      {/* Steps */}
      <div className="w-full max-w-sm space-y-3">
        {PROCESSING_STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = index === currentStep;
          const isComplete = index < currentStep;
          
          return (
            <div
              key={index}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                isActive 
                  ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                  : isComplete
                  ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-800/50 border border-transparent'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isActive 
                  ? 'bg-amber-500 text-white'
                  : isComplete
                  ? 'bg-green-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
              }`}>
                {isActive ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isComplete ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span className={`text-sm font-medium ${
                isActive 
                  ? 'text-amber-700 dark:text-amber-300'
                  : isComplete
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-gray-400 dark:text-gray-500'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {/* File info */}
      {uploadedFile && (
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-500">
            Arquivo: <span className="font-medium">{uploadedFile.name}</span>
          </p>
        </div>
      )}
    </div>
  );
}
