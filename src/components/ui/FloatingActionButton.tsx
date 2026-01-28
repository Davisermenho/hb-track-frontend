'use client';

/**
 * FloatingActionButton (FAB) - Botão flutuante de ações rápidas
 * 
 * Posicionamento: fixed, bottom-right
 * Funcionalidades:
 * - Menu expandível com ações rápidas
 * - Visibilidade condicional por rota
 * - Animações suaves com Framer Motion
 * - RBAC para ações específicas
 * 
 * @version 1.0.0
 */

import { useState, useCallback, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  Gamepad2,
  Dumbbell,
  Target,
  MessageSquare,
  Calendar,
  Users,
  ClipboardList,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  href?: string;
  onClick?: () => void;
  color: string;
  roles?: string[]; // Roles permitidos (vazio = todos)
  routes?: string[]; // Rotas onde aparece (vazio = todas)
}

interface FloatingActionButtonProps {
  onSendMessage?: () => void;
  className?: string;
}

// Ações rápidas disponíveis
const quickActions: QuickAction[] = [
  {
    id: 'new-game',
    label: 'Novo Jogo',
    icon: Gamepad2,
    href: '/games/new',
    color: 'bg-blue-500 hover:bg-blue-600',
    roles: ['admin', 'coordenador', 'treinador'],
    routes: ['/games', '/dashboard', '/calendar'],
  },
  {
    id: 'new-training',
    label: 'Novo Treino',
    icon: Dumbbell,
    href: '/training/new',
    color: 'bg-green-500 hover:bg-green-600',
    roles: ['admin', 'coordenador', 'treinador'],
    routes: ['/training', '/dashboard', '/calendar'],
  },
  {
    id: 'new-evaluation',
    label: 'Nova Avaliação',
    icon: Target,
    href: '/training/avaliacoes/new',
    color: 'bg-purple-500 hover:bg-purple-600',
    roles: ['admin', 'coordenador', 'treinador'],
    routes: ['/training', '/admin/athletes'],
  },
  {
    id: 'new-event',
    label: 'Novo Evento',
    icon: Calendar,
    href: '/calendar/new',
    color: 'bg-orange-500 hover:bg-orange-600',
    roles: ['admin', 'coordenador'],
    routes: ['/calendar', '/dashboard'],
  },
  {
    id: 'send-message',
    label: 'Enviar Mensagem',
    icon: MessageSquare,
    color: 'bg-indigo-500 hover:bg-indigo-600',
    roles: ['admin', 'coordenador', 'treinador', 'dirigente'],
  },
  {
    id: 'add-athlete',
    label: 'Adicionar Atleta',
    icon: Users,
    href: '/admin/athletes/new',
    color: 'bg-teal-500 hover:bg-teal-600',
    roles: ['admin', 'coordenador'],
    routes: ['/admin/athletes', '/teams'],
  },
];

// Rotas onde o FAB não deve aparecer
const hiddenRoutes = ['/signin', '/signup', '/forgot-password', '/reset-password'];

export function FloatingActionButton({ 
  onSendMessage,
  className 
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  // Fechar menu ao mudar de rota
  useEffect(() => {
    const closeMenu = () => setIsOpen(false);
    closeMenu();
  }, [pathname]);

  // Fechar menu ao pressionar Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  // Verificar se FAB deve ser visível
  const shouldShow = !hiddenRoutes.some(route => pathname.startsWith(route));

  // Filtrar ações baseado no role e rota atual
  const filteredActions = quickActions.filter(action => {
    // Verificar role
    if (action.roles && action.roles.length > 0) {
      if (!user?.role || !action.roles.includes(user.role)) {
        return false;
      }
    }
    
    // Verificar rota (se especificada)
    if (action.routes && action.routes.length > 0) {
      const matchesRoute = action.routes.some(route => pathname.startsWith(route));
      if (!matchesRoute) return false;
    }
    
    return true;
  });

  const handleActionClick = useCallback((action: QuickAction) => {
    if (action.id === 'send-message' && onSendMessage) {
      onSendMessage();
    } else if (action.href) {
      router.push(action.href);
    } else if (action.onClick) {
      action.onClick();
    }
    setIsOpen(false);
  }, [onSendMessage, router]);

  if (!shouldShow || filteredActions.length === 0) {
    return null;
  }

  return (
    <div 
      className={cn(
        'fixed bottom-5 right-5 z-50 flex flex-col-reverse items-end gap-3',
        className
      )}
    >
      {/* Backdrop quando aberto */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 -z-10"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Ações expandidas */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2 mb-2"
          >
            {filteredActions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ 
                  opacity: 1, 
                  x: 0,
                  transition: { delay: index * 0.05 }
                }}
                exit={{ opacity: 0, x: 20 }}
                onClick={() => handleActionClick(action)}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-full shadow-lg',
                  'text-white font-medium text-sm',
                  'transform transition-transform hover:scale-105',
                  action.color
                )}
              >
                <action.icon className="w-5 h-5" />
                <span className="whitespace-nowrap">{action.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão principal */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={cn(
          'w-14 h-14 rounded-full shadow-lg',
          'flex items-center justify-center',
          'bg-brand-500 hover:bg-brand-600 text-white',
          'transition-colors duration-200',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2'
        )}
        aria-label={isOpen ? 'Fechar menu de ações' : 'Abrir menu de ações'}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </motion.div>
      </motion.button>
    </div>
  );
}

export default FloatingActionButton;
