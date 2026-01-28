'use client';

import { useFormContext, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useState } from 'react';

interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'date' | 'number' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  options?: Array<{ value: string | number; label: string }>;
  rows?: number;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function FormField({
  name,
  label,
  type = 'text',
  placeholder,
  required,
  helpText,
  options,
  rows = 3,
  min,
  max,
  disabled,
}: FormFieldProps) {
  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext();
  
  const [isFocused, setIsFocused] = useState(false);

  const error = name.split('.').reduce((obj, key) => obj?.[key], errors as any);
  const hasError = !!error;
  const errorMessage = error?.message as string;

  // Obter valor atual para mostrar checkmark
  const currentValue = watch(name);
  const hasValue = currentValue !== undefined && currentValue !== '' && currentValue !== null;
  const isValid = hasValue && !hasError;

  return (
    <div className="mb-5">
      {/* Label */}
      <label htmlFor={name} className="block mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </span>
      </label>

      {/* Input Container */}
      <div className="relative">
        <Controller
          name={name}
          control={control}
          render={({ field }) => {
            // Garantir que value seja sempre uma string
            const fieldValue = field.value ?? '';
            
            const baseClasses = `
              w-full px-4 py-2.5 rounded-lg border text-sm
              transition-all duration-200
              ${hasError
                ? 'border-danger-300 dark:border-danger-700 bg-danger-50 dark:bg-danger-950/30 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20'
                : isFocused
                ? 'border-brand-500 bg-white dark:bg-gray-900 ring-2 ring-brand-500/20'
                : isValid
                ? 'border-success-300 dark:border-success-700 bg-white dark:bg-gray-900'
                : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600'
              }
              text-gray-900 dark:text-white
              placeholder:text-gray-400 dark:placeholder:text-gray-600
              focus:outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
            `;

            if (type === 'select') {
              return (
                <select
                  {...field}
                  value={fieldValue}
                  id={name}
                  disabled={disabled}
                  className={baseClasses}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                >
                  <option value="">Selecione...</option>
                  {options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              );
            }

            if (type === 'textarea') {
              return (
                <textarea
                  {...field}
                  value={fieldValue}
                  id={name}
                  rows={rows}
                  disabled={disabled}
                  placeholder={placeholder}
                  className={baseClasses}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              );
            }

            return (
              <input
                {...field}
                value={fieldValue}
                id={name}
                type={type}
                disabled={disabled}
                placeholder={placeholder}
                min={min}
                max={max}
                className={baseClasses}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            );
          }}
        />

        {/* Status Icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <AnimatePresence mode="wait">
            {hasError && (
              <motion.div
                key="error"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
              >
                <AlertCircle className="size-5 text-danger-500" />
              </motion.div>
            )}
            
            {isValid && !disabled && (
              <motion.div
                key="success"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
              >
                <CheckCircle2 className="size-5 text-success-500" />
              </motion.div>
            )}
          </AnimatePresence>

          {helpText && (
            <div className="group relative">
              <Info className="size-4 text-gray-400 cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                {helpText}
                <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 rotate-45" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      <AnimatePresence>
        {hasError && (
          <motion.p
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-2 text-xs text-danger-600 dark:text-danger-400 flex items-center gap-1"
          >
            <AlertCircle className="size-3" />
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Help Text */}
      {helpText && !hasError && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-600">
          {helpText}
        </p>
      )}
    </div>
  );
}
