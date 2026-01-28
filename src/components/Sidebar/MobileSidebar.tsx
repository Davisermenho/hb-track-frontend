'use client';

/**
 * MobileSidebar - Sidebar responsiva para dispositivos móveis
 * 
 * Funcionalidades:
 * - Drawer lateral com overlay
 * - Botão hamburger para abrir/fechar
 * - Fecha automaticamente ao navegar
 * - Accordion para submenus
 * - Animações suaves com Framer Motion
 * 
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// CONTEXT
// =============================================================================

interface MobileSidebarContextType {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

const MobileSidebarContext = createContext<MobileSidebarContextType | null>(null);

export function useMobileSidebar() {
  const context = useContext(MobileSidebarContext);
  if (!context) {
    throw new Error('useMobileSidebar must be used within MobileSidebarProvider');
  }
  return context;
}

// =============================================================================
// PROVIDER
// =============================================================================

interface MobileSidebarProviderProps {
  children: React.ReactNode;
}

export function MobileSidebarProvider({ children }: MobileSidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Fechar ao mudar de rota
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Fechar ao pressionar Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevenir scroll do body quando aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return (
    <MobileSidebarContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </MobileSidebarContext.Provider>
  );
}

// =============================================================================
// HAMBURGER BUTTON
// =============================================================================

interface HamburgerButtonProps {
  className?: string;
}

export function HamburgerButton({ className }: HamburgerButtonProps) {
  const { isOpen, toggle } = useMobileSidebar();

  return (
    <button
      onClick={toggle}
      className={cn(
        'md:hidden p-2 rounded-lg',
        'text-gray-600 dark:text-gray-300',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'focus:outline-none focus:ring-2 focus:ring-brand-500',
        'transition-colors',
        className
      )}
      aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
      aria-expanded={isOpen}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isOpen ? (
          <motion.div
            key="close"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <X className="w-6 h-6" />
          </motion.div>
        ) : (
          <motion.div
            key="menu"
            initial={{ rotate: 90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -90, opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <Menu className="w-6 h-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

// =============================================================================
// MOBILE DRAWER
// =============================================================================

interface MobileDrawerProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileDrawer({ children, className }: MobileDrawerProps) {
  const { isOpen, close } = useMobileSidebar();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={close}
            aria-hidden="true"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              'fixed left-0 top-0 bottom-0 z-50 md:hidden',
              'w-[280px] max-w-[85vw]',
              'bg-white dark:bg-gray-900',
              'shadow-2xl',
              'overflow-y-auto',
              className
            )}
          >
            {/* Close button inside */}
            <button
              onClick={close}
              className={cn(
                'absolute top-4 right-4 p-2 rounded-lg',
                'text-gray-500 hover:text-gray-700',
                'dark:text-gray-400 dark:hover:text-gray-200',
                'hover:bg-gray-100 dark:hover:bg-gray-800',
                'transition-colors'
              )}
              aria-label="Fechar menu"
            >
              <X className="w-5 h-5" />
            </button>

            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// =============================================================================
// MOBILE ACCORDION (para submenus)
// =============================================================================

interface MobileAccordionProps {
  title: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
}

export function MobileAccordion({
  title,
  icon: Icon,
  children,
  defaultOpen = false,
  badge,
}: MobileAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 dark:border-gray-800">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          'w-full flex items-center justify-between',
          'px-4 py-3',
          'text-left text-gray-700 dark:text-gray-200',
          'hover:bg-gray-50 dark:hover:bg-gray-800/50',
          'transition-colors'
        )}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-5 h-5 text-gray-500 dark:text-gray-400" />}
          <span className="font-medium">{title}</span>
          {badge && (
            <span className={cn(
              'px-2 py-0.5 text-xs rounded-full',
              'bg-brand-100 text-brand-700',
              'dark:bg-brand-900/30 dark:text-brand-400'
            )}>
              {badge}
            </span>
          )}
        </div>
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="pb-2 pl-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// =============================================================================
// MOBILE NAV ITEM
// =============================================================================

interface MobileNavItemProps {
  href: string;
  icon?: React.ElementType;
  children: React.ReactNode;
  isActive?: boolean;
  onClick?: () => void;
  badge?: string | number;
}

export function MobileNavItem({
  href,
  icon: Icon,
  children,
  isActive,
  onClick,
  badge,
}: MobileNavItemProps) {
  const { close } = useMobileSidebar();
  const pathname = usePathname();
  const active = isActive ?? pathname === href;

  const handleClick = useCallback(() => {
    onClick?.();
    close();
  }, [onClick, close]);

  return (
    <a
      href={href}
      onClick={handleClick}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-lg mx-2',
        'transition-colors',
        active
          ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400'
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
      )}
    >
      {Icon && (
        <Icon className={cn(
          'w-5 h-5',
          active ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400'
        )} />
      )}
      <span className="flex-1">{children}</span>
      {badge && (
        <span className={cn(
          'px-2 py-0.5 text-xs rounded-full',
          'bg-brand-100 text-brand-700',
          'dark:bg-brand-900/30 dark:text-brand-400'
        )}>
          {badge}
        </span>
      )}
    </a>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  MobileSidebarContext,
  type MobileSidebarContextType,
};
