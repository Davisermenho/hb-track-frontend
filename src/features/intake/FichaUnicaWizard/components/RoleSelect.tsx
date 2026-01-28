'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { useFormContext } from 'react-hook-form';

interface RoleOption {
  value: number;
  label: string;
  description: string;
}

const ROLES: RoleOption[] = [
  {
    value: 1,
    label: 'Dirigente',
    description: 'Pode criar organizações e temporadas',
  },
  {
    value: 2,
    label: 'Coordenador',
    description: 'Gerencia equipes e atletas',
  },
  {
    value: 3,
    label: 'Treinador',
    description: 'Gerencia atletas e treinos',
  },
  {
    value: 4,
    label: 'Atleta',
    description: 'Acesso limitado aos próprios dados',
  },
];

interface RoleSelectProps {
  name: string;
  label: string;
  required?: boolean;
  helpText?: string;
}

export function RoleSelect({ name, label, required, helpText }: RoleSelectProps) {
  const { setValue, watch, formState: { errors } } = useFormContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const selectedValue = watch(name) as number | undefined;
  const selectedRole = ROLES.find(role => role.value === selectedValue);
  
  // Obter erro do campo
  const fieldError = name.split('.').reduce((obj, key) => obj?.[key], errors as any);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (value: number) => {
    setValue(name, value, { shouldValidate: true });
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all duration-200
            ${fieldError
              ? 'border-red-500 focus:ring-2 focus:ring-red-500/20'
              : 'border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500'
            }
            bg-white dark:bg-gray-800 text-gray-900 dark:text-white
            hover:bg-gray-50 dark:hover:bg-gray-700/50
          `}
        >
          <div className="flex-1 min-w-0">
            {selectedRole ? (
              <div>
                <p className="font-medium">{selectedRole.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {selectedRole.description}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">Selecione o papel...</p>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
              className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="py-1">
                {ROLES.map((role) => (
                  <button
                    key={role.value}
                    type="button"
                    onClick={() => handleSelect(role.value)}
                    className={`
                      w-full flex items-center justify-between px-4 py-3 text-left transition-colors
                      ${selectedValue === role.value
                        ? 'bg-brand-50 dark:bg-brand-900/20'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className={`font-medium ${
                        selectedValue === role.value
                          ? 'text-brand-700 dark:text-brand-400'
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {role.label}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {role.description}
                      </p>
                    </div>
                    {selectedValue === role.value && (
                      <Check className="w-5 h-5 text-brand-600 dark:text-brand-400 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Help Text */}
      {helpText && !fieldError && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
      )}

      {/* Error Message */}
      {fieldError && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-600 dark:text-red-400"
        >
          {fieldError.message || 'Campo obrigatório'}
        </motion.p>
      )}
    </div>
  );
}