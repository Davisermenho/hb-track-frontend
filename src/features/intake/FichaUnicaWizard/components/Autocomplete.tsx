'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, Check, X, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';

interface AutocompleteOption {
  id: string;
  name: string;
  [key: string]: any;
}

interface AutocompleteProps {
  name: string;
  label: string;
  endpoint: string;
  placeholder?: string;
  required?: boolean;
  helpText?: string;
  onSelect?: (option: AutocompleteOption | null) => void;
  queryParams?: Record<string, any>;
  disabled?: boolean;
}

export function Autocomplete({
  name,
  label,
  endpoint,
  placeholder,
  required,
  helpText,
  onSelect,
  queryParams = {},
  disabled,
}: AutocompleteProps) {
  const { setValue, formState: { errors } } = useFormContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<AutocompleteOption | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const error = name.split('.').reduce((obj, key) => obj?.[key], errors as any);
  const hasError = !!error;
  const errorMessage = error?.message as string;

  // Buscar opções
  const { data: options = [], isLoading } = useQuery({
    queryKey: [endpoint, searchTerm, queryParams],
    queryFn: async () => {
      if (searchTerm.length < 2) return [];

      const response = await apiClient.get<{ items?: AutocompleteOption[] } | AutocompleteOption[]>(
        endpoint,
        { params: { q: searchTerm, ...queryParams } }
      );

      if (Array.isArray(response)) return response;
      return response.items || [];
    },
    enabled: searchTerm.length >= 2,
    staleTime: 30000,
  });

  // Debounced search
  const debouncedSearch = useCallback((value: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      setSearchTerm(value);
    }, 300);
  }, []);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: AutocompleteOption) => {
    setSelectedOption(option);
    setValue(name, option.id);
    setIsOpen(false);
    onSelect?.(option);
  };

  const handleClear = () => {
    setSelectedOption(null);
    setValue(name, '');
    setSearchTerm('');
    onSelect?.(null);
  };

  return (
    <div ref={containerRef} className="mb-5">
      <label htmlFor={name} className="block mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </span>
      </label>

      <div className="relative">
        {/* Input */}
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {isLoading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Search className="size-5" />
            )}
          </div>

          <input
            type="text"
            disabled={disabled}
            placeholder={placeholder || 'Digite para buscar...'}
            onChange={(e) => {
              debouncedSearch(e.target.value);
              setIsOpen(true);
              if (!e.target.value) {
                handleClear();
              }
            }}
            onFocus={() => !disabled && setIsOpen(true)}
            value={selectedOption?.name || searchTerm || ''}
            className={`
              w-full pl-10 pr-12 py-2.5 rounded-lg border text-sm
              transition-all duration-200
              ${hasError
                ? 'border-danger-300 dark:border-danger-700 bg-danger-50 dark:bg-danger-950/30 focus:border-danger-500 focus:ring-2 focus:ring-danger-500/20'
                : selectedOption
                ? 'border-success-300 dark:border-success-700 bg-white dark:bg-gray-900'
                : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-gray-400 dark:hover:border-gray-600'
              }
              text-gray-900 dark:text-white
              placeholder:text-gray-400 dark:placeholder:text-gray-600
              focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            aria-busy={isLoading}
          />

          {selectedOption && !disabled && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              <Check className="size-5 text-success-500" />
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
        </div>

        {/* Dropdown */}
        <AnimatePresence>
          {isOpen && searchTerm.length >= 2 && !selectedOption && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl max-height-60 max-h-60 overflow-auto"
            >
              {isLoading && (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((idx) => (
                    <div key={idx} className="flex items-center gap-3 animate-pulse">
                      <div className="size-10 rounded bg-gray-100 dark:bg-gray-800" />
                      <div className="flex-1 space-y-1">
                        <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-gray-800" />
                        <div className="h-3 w-1/2 rounded bg-gray-100 dark:bg-gray-800" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && options.length === 0 && (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Nenhum resultado encontrado para &quot;{searchTerm}&quot;
                </div>
              )}

              {!isLoading && options.length > 0 && (
                <ul>
                  {options.map((option) => (
                    <li key={option.id}>
                      <button
                        type="button"
                        onClick={() => handleSelect(option)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm border-b border-gray-100 dark:border-gray-800 last:border-0"
                      >
                        <div className="font-medium text-gray-900 dark:text-white">
                          {option.name}
                        </div>
                        {(option.category_id || option.gender || option.year) && (
                          <div className="text-xs text-gray-500 dark:text-gray-600 mt-1 flex items-center gap-2">
                            {option.year && <span>Ano: {option.year}</span>}
                            {option.category_id && <span>Categoria: {option.category_id}</span>}
                            {option.gender && <span className="capitalize">{option.gender}</span>}
                          </div>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
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
