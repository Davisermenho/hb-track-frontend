'use client';

import { motion } from 'framer-motion';
import { Check, AlertCircle } from 'lucide-react';
import { FieldErrors } from 'react-hook-form';
import { FichaUnicaPayload, StepDefinition } from '../types';

interface StepIndicatorProps {
  steps: StepDefinition[];
  currentStep: number;
  errors: FieldErrors<FichaUnicaPayload>;
  onStepClick?: (index: number) => void;
}

export function StepIndicator({ steps, currentStep, errors, onStepClick }: StepIndicatorProps) {
  const getErrorByPath = (errObj: FieldErrors, path: string) =>
    path.split('.').reduce((acc, key) => (acc as any)?.[key], errObj as any);

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  const hasStepErrors = (step: StepDefinition) => {
    return step.fields.some((field) => !!getErrorByPath(errors, field));
  };

  return (
    <div className="relative py-8">
      {/* Progress Bar Background */}
      <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-800" />
      
      {/* Animated Progress Bar */}
      <motion.div
        className="absolute top-5 left-0 h-0.5 bg-brand-500"
        initial={{ width: 0 }}
        animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />

      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const hasErrors = hasStepErrors(step);
          const isClickable = index < currentStep;

          return (
            <div key={step.id} className="flex flex-col items-center group">
              {/* Step Circle */}
              <button
                type="button"
                onClick={() => isClickable && onStepClick?.(index)}
                disabled={!isClickable}
                className={`
                  relative size-10 rounded-full flex items-center justify-center
                  transition-all duration-300 z-10
                  ${status === 'completed' && !hasErrors
                    ? 'bg-success-500 text-white shadow-lg shadow-success-500/30'
                    : status === 'completed' && hasErrors
                    ? 'bg-danger-500 text-white shadow-lg shadow-danger-500/30'
                    : status === 'current'
                    ? 'bg-brand-500 text-white shadow-xl shadow-brand-500/40 scale-110'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                  }
                  ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-default'}
                  ${!isClickable && 'opacity-60'}
                `}
              >
                {status === 'completed' && !hasErrors && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.4, ease: 'backOut' }}
                  >
                    <Check className="size-5" strokeWidth={3} />
                  </motion.div>
                )}
                
                {status === 'completed' && hasErrors && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <AlertCircle className="size-5" />
                  </motion.div>
                )}
                
                {status !== 'completed' && (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}

                {/* Pulse Animation for Current Step */}
                {status === 'current' && (
                  <motion.div
                    className="absolute inset-0 rounded-full bg-brand-500"
                    initial={{ scale: 1, opacity: 0.5 }}
                    animate={{ scale: 1.4, opacity: 0 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                      ease: 'easeOut',
                    }}
                  />
                )}
              </button>

              {/* Step Label */}
              <div className="mt-3 text-center max-w-[100px]">
                <p
                  className={`
                    text-xs font-medium transition-colors
                    ${status === 'current'
                      ? 'text-brand-600 dark:text-brand-400'
                      : status === 'completed'
                      ? hasErrors
                        ? 'text-danger-600 dark:text-danger-400'
                        : 'text-success-600 dark:text-success-400'
                      : 'text-gray-500 dark:text-gray-600'
                    }
                  `}
                >
                  {step.label}
                </p>
                
                {hasErrors && status === 'completed' && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-danger-600 dark:text-danger-400 mt-1"
                  >
                    Com erros
                  </motion.p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
