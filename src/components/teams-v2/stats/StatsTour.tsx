'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Cross2Icon, ChevronRightIcon, ChevronLeftIcon, QuestionMarkCircledIcon } from '@radix-ui/react-icons';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface StatsTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

// ============================================================================
// TOUR STEPS
// ============================================================================

const TOUR_STEPS: TourStep[] = [
  {
    target: '[data-tour="weekly-summary"]',
    title: 'Resumo da Semana',
    content: 'Aqui você vê uma síntese rápida do desempenho da equipe, com insights automáticos sobre frequência, wellness e foco.',
    position: 'bottom',
  },
  {
    target: '[data-tour="metric-cards"]',
    title: 'Métricas Principais',
    content: 'Visualize os KPIs mais importantes: sessões por semana, taxa de presença e índice de wellness. As zonas coloridas indicam se está tudo bem.',
    position: 'bottom',
  },
  {
    target: '[data-tour="load-chart"]',
    title: 'Gráfico de Carga',
    content: 'Visualize tendências de carga ao longo dos microciclos. Clique em "Explorar gráfico" para ver o mapa de calor completo.',
    position: 'top',
  },
  {
    target: '[data-tour="advanced-features"]',
    title: 'Recursos Avançados',
    content: 'Acesse mapas de presença, relatórios em PDF, insights com IA e compare equipes. Recursos poderosos para decisões informadas.',
    position: 'top',
  },
  {
    target: '[data-tour="insights"]',
    title: 'Insights da Semana',
    content: 'Receba alertas e sugestões automáticas baseadas nos dados. Cada insight indica se é positivo, de alerta ou sugestão.',
    position: 'left',
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

const StatsTour: React.FC<StatsTourProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [viewportTick, setViewportTick] = useState(0);

  const handleViewportChange = useCallback(() => {
    setViewportTick((prev) => prev + 1);
  }, []);

  const targetRect = useMemo(() => {
    if (!isOpen) return null;
    const step = TOUR_STEPS[currentStep];
    if (!step) return null;
    const element = document.querySelector(step.target);
    return element ? element.getBoundingClientRect() : null;
  }, [currentStep, isOpen, viewportTick]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('resize', handleViewportChange);
      window.addEventListener('scroll', handleViewportChange);
      return () => {
        window.removeEventListener('resize', handleViewportChange);
        window.removeEventListener('scroll', handleViewportChange);
      };
    }
  }, [isOpen, handleViewportChange]);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;

  // Calcular posição do tooltip
  const getTooltipPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    
    const padding = 16;
    const tooltipWidth = 320;
    const tooltipHeight = 180;
    
    switch (step.position) {
      case 'bottom':
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'top':
        return {
          top: `${targetRect.top - tooltipHeight - padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
      case 'left':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.left - tooltipWidth - padding}px`,
          transform: 'translateY(-50%)',
        };
      case 'right':
        return {
          top: `${targetRect.top + targetRect.height / 2}px`,
          left: `${targetRect.right + padding}px`,
          transform: 'translateY(-50%)',
        };
      default:
        return {
          top: `${targetRect.bottom + padding}px`,
          left: `${targetRect.left + targetRect.width / 2}px`,
          transform: 'translateX(-50%)',
        };
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] pointer-events-none"
      >
        {/* Overlay com spotlight */}
        <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={handleSkip}>
          {targetRect && (
            <div
              className="absolute bg-transparent"
              style={{
                top: targetRect.top - 8,
                left: targetRect.left - 8,
                width: targetRect.width + 16,
                height: targetRect.height + 16,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)',
                borderRadius: '12px',
              }}
            />
          )}
        </div>

        {/* Highlight ring */}
        {targetRect && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute pointer-events-none"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
            }}
          >
            <div className="w-full h-full border-2 border-blue-500 rounded-xl animate-pulse" />
          </motion.div>
        )}

        {/* Tooltip */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl pointer-events-auto"
          style={getTooltipPosition()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <QuestionMarkCircledIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{step.title}</span>
            </div>
            <button
              onClick={handleSkip}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <Cross2Icon className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {step.content}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 rounded-b-xl">
            <div className="flex items-center gap-1">
              {TOUR_STEPS.map((_, idx) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    idx === currentStep
                      ? 'bg-blue-500'
                      : idx < currentStep
                      ? 'bg-blue-300'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <ChevronLeftIcon className="w-3 h-3" />
                  Voltar
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-4 py-1.5 text-xs font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                {isLastStep ? 'Concluir' : 'Próximo'}
                {!isLastStep && <ChevronRightIcon className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StatsTour;
