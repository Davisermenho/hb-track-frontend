'use client';

import { useFormContext, Controller } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

type MaskType = 'cpf' | 'phone' | 'telefone' | 'cep' | 'rg';

interface MaskedInputProps {
  name: string;
  label: string;
  mask: MaskType;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  disabled?: boolean;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
}

const masks: Record<MaskType, { pattern: string; formatter: (value: string) => string }> = {
  cpf: {
    pattern: '999.999.999-99',
    formatter: (value: string) => {
      const numbers = value.replace(/\D/g, '');
      return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .slice(0, 14);
    },
  },
  telefone: {
    pattern: '(99) 99999-9999',
    formatter: (value: string) => {
      const numbers = value.replace(/\D/g, '');
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 15);
    },
  },
  phone: {
    pattern: '(99) 99999-9999',
    formatter: (value: string) => {
      const numbers = value.replace(/\D/g, '');
      return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .slice(0, 15);
    },
  },
  cep: {
    pattern: '99999-999',
    formatter: (value: string) => {
      const numbers = value.replace(/\D/g, '');
      return numbers.replace(/(\d{5})(\d)/, '$1-$2').slice(0, 9);
    },
  },
  rg: {
    pattern: '99.999.999-9',
    formatter: (value: string) => {
      const numbers = value.replace(/\D/g, '');
      return numbers
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1})$/, '$1-$2')
        .slice(0, 12);
    },
  },
};

export function MaskedInput({
  name,
  label,
  mask,
  placeholder,
  required,
  helpText,
  disabled,
  onBlur,
}: MaskedInputProps) {
  const {
    control,
    formState: { errors },
    watch,
  } = useFormContext();
  
  const [isFocused, setIsFocused] = useState(false);
  const maskConfig = masks[mask];

  const error = name.split('.').reduce((obj, key) => obj?.[key], errors as any);
  const hasError = !!error;
  const errorMessage = error?.message as string;

  const currentValue = watch(name);
  const hasValue = currentValue !== undefined && currentValue !== '';
  const isValid = hasValue && !hasError;

  return (
    <div className="mb-5">
      <label htmlFor={name} className="block mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </span>
      </label>

      <div className="relative">
        <Controller
          name={name}
          control={control}
          render={({ field: { onChange, value, ...field } }) => (
            <input
              {...field}
              id={name}
              type="text"
              disabled={disabled}
              placeholder={placeholder || maskConfig.pattern}
              value={value || ''}
              onChange={(e) => {
                const formatted = maskConfig.formatter(e.target.value);
                onChange(formatted);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={(e) => {
                setIsFocused(false);
                onBlur?.(e);
              }}
              className={`
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
                font-mono
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            />
          )}
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2">
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
        </div>
      </div>

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

      {helpText && !hasError && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-600">
          {helpText}
        </p>
      )}
    </div>
  );
}
