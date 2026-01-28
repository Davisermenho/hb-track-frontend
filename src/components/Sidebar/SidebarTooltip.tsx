'use client';

/**
 * SidebarTooltip - Tooltip para modo colapsado
 * 
 * Exibe o nome do item quando a sidebar está colapsada
 * e o usuário passa o mouse sobre o ícone.
 */

import { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarTooltipProps {
  children: ReactNode;
  content: string;
  enabled?: boolean;
}

export function SidebarTooltip({ 
  children, 
  content, 
  enabled = true 
}: SidebarTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full top-1/2 -translate-y-1/2 ml-2 z-50"
          >
            <div className="bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium px-2.5 py-1.5 rounded-md whitespace-nowrap shadow-lg">
              {content}
              {/* Arrow */}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-gray-900 dark:border-r-gray-700" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
