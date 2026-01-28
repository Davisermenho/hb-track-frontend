'use client';

/**
 * HelpDropdown - Menu de ajuda e feedback na topbar
 * 
 * Oferece acesso a documentação, tutoriais e envio de feedback.
 * 
 * @version 1.0.0
 */

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HelpCircle,
  BookOpen,
  MessageSquare,
  FileText,
  ExternalLink,
  Keyboard,
  Bug,
  Lightbulb,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TIPOS
// =============================================================================

interface HelpDropdownProps {
  onFeedback?: () => void;
  className?: string;
}

interface HelpItem {
  icon: typeof HelpCircle;
  label: string;
  description?: string;
  href?: string;
  onClick?: () => void;
  external?: boolean;
}

// =============================================================================
// COMPONENTE
// =============================================================================

export function HelpDropdown({ onFeedback, className }: HelpDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const helpItems: HelpItem[] = [
    {
      icon: BookOpen,
      label: 'Documentação',
      description: 'Guias e tutoriais',
      href: '/docs',
    },
    {
      icon: Keyboard,
      label: 'Atalhos de Teclado',
      description: 'Ver todos os atalhos',
      onClick: () => {
        // Poderia abrir um modal com atalhos
        setIsOpen(false);
      },
    },
    {
      icon: FileText,
      label: 'Central de Ajuda',
      description: 'Perguntas frequentes',
      href: 'https://help.hbtrack.com',
      external: true,
    },
  ];

  const feedbackItems: HelpItem[] = [
    {
      icon: Lightbulb,
      label: 'Sugerir Funcionalidade',
      description: 'Envie suas ideias',
      onClick: () => {
        onFeedback?.();
        setIsOpen(false);
      },
    },
    {
      icon: Bug,
      label: 'Reportar Problema',
      description: 'Algo não funcionou?',
      onClick: () => {
        onFeedback?.();
        setIsOpen(false);
      },
    },
    {
      icon: MessageSquare,
      label: 'Fale Conosco',
      description: 'Suporte direto',
      href: 'mailto:suporte@hbtrack.com',
      external: true,
    },
  ];

  const renderItem = (item: HelpItem) => {
    const content = (
      <>
        <div className={cn(
          'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
          'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
        )}>
          <item.icon className="w-4 h-4" />
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {item.label}
          </p>
          {item.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {item.description}
            </p>
          )}
        </div>
        {item.external && (
          <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
        )}
      </>
    );

    const className = cn(
      'flex items-center gap-3 w-full px-3 py-2 rounded-lg transition-colors',
      'hover:bg-gray-100 dark:hover:bg-gray-700'
    );

    if (item.href) {
      return item.external ? (
        <a
          key={item.label}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          onClick={() => setIsOpen(false)}
        >
          {content}
        </a>
      ) : (
        <Link
          key={item.label}
          href={item.href}
          className={className}
          onClick={() => setIsOpen(false)}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={item.label}
        onClick={() => {
          item.onClick?.();
          setIsOpen(false);
        }}
        className={className}
      >
        {content}
      </button>
    );
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Botão */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'p-2 rounded-lg transition-colors',
          'text-gray-600 dark:text-gray-400',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          isOpen && 'bg-gray-100 dark:bg-gray-800'
        )}
        aria-label="Ajuda"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Ajuda & Suporte
              </h3>
            </div>

            {/* Seção de Ajuda */}
            <div className="p-2">
              <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Recursos
              </p>
              {helpItems.map(renderItem)}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-200 dark:border-gray-700" />

            {/* Seção de Feedback */}
            <div className="p-2">
              <p className="px-3 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Feedback
              </p>
              {feedbackItems.map(renderItem)}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700">
              <p className="text-[10px] text-center text-gray-400">
                HB Track v1.0.0 • Versão Beta
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HelpDropdown;
