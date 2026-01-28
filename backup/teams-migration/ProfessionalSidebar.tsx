'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  UsersRound,
  MessageSquare,
  Home,
  Calendar,
  Trophy,
  Dumbbell,
  BarChart3,
  Video,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ClipboardList,
  ListChecks,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

interface ProfessionalSidebarProps {}

const navigation = [
  { name: 'Página Inicial', href: '/inicio', icon: Home },
  { name: 'Mensagens', href: '/messages', icon: MessageSquare },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Cadastro', href: '/admin/cadastro', icon: UserPlus },
  { name: 'Equipes', href: '/teams', icon: UsersRound },
  { name: 'Atletas', href: '/admin/athletes', icon: Users },
  { name: 'Scout ao Vivo', href: '/scout/live', icon: Video },
];

const eventosSubmenu = [
  { name: 'Calendário', href: '/calendar', icon: CalendarDays },
  { name: 'Competições', href: '/eventos/competicoes', icon: Trophy },
];

// Submenu Treinos com hierarquia planejamento → execução → análise
const treinosSubmenu = [
  { 
    name: 'Planejamento', 
    href: '/trainings/planning', 
    icon: ClipboardList,
    tooltip: 'Planejamento de microciclos semanais'
  },
  { 
    name: 'Sessões', 
    href: '/trainings/sessions', 
    icon: ListChecks,
    tooltip: 'Lista operacional de treinos'
  },
  { 
    name: 'Ciclos', 
    href: '/trainings/cycles', 
    icon: Target,
    tooltip: 'Visão estratégica (macro/mesociclos)'
  },
];

// Submenu Estatísticas com permissões RBAC
const getStatisticsSubmenu = (userRole: string | undefined) => {
  if (!userRole) return [];
  
  // Atleta: apenas visão própria
  if (userRole === 'atleta') {
    return [
      { 
        name: 'Minhas Estatísticas', 
        href: '/statistics/me', 
        icon: TrendingUp,
        tooltip: 'Seu acompanhamento pessoal'
      },
    ];
  }
  
  // Comissão técnica (treinador, coordenador) e admin: visão completa
  if (['treinador', 'coordenador', 'admin', 'dirigente'].includes(userRole)) {
    return [
      { 
        name: 'Operacional', 
        href: '/statistics', 
        icon: BarChart3,
        tooltip: 'Controle do treino ou jogo do dia'
      },
      { 
        name: 'Equipes', 
        href: '/statistics/teams', 
        icon: UsersRound,
        tooltip: 'Análise de desempenho coletivo'
      },
      { 
        name: 'Atletas', 
        href: '/statistics/athletes', 
        icon: Users,
        tooltip: 'Análise individual para a comissão técnica'
      },
    ];
  }
  
  return [];
};

export function ProfessionalSidebar({}: ProfessionalSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [eventosOpen, setEventosOpen] = useState(false);
  const [treinosOpen, setTreinosOpen] = useState(false);
  const [statisticsOpen, setStatisticsOpen] = useState(false);
  const pathname = usePathname();
  const { theme } = useTheme();
  const { user } = useAuth();

  const statisticsSubmenu = getStatisticsSubmenu(user?.role);
  const isEventosActive = eventosSubmenu.some(item => pathname === item.href);
  const isTreinosActive = treinosSubmenu.some(item => pathname === item.href || pathname.startsWith(item.href));
  const isStatisticsActive = statisticsSubmenu.some(item => pathname === item.href || pathname.startsWith(item.href + '/'));

  // Selecionar logo baseado no estado e tema
  const getLogo = () => {
    if (isCollapsed) {
      return theme === 'dark' 
        ? '/images/logo/logo-icon-dark.svg'
        : '/images/logo/logo-icon.svg';
    }
    return theme === 'dark'
      ? '/images/logo/logo-dark.svg'
      : '/images/logo/logo.svg';
  };

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 64 : 220 }}
      transition={{ duration: 0.2 }}
      className="h-screen bg-gray-100 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col"
    >
      {/* Header */}
      <div className={cn(
        "h-16 flex items-center border-b border-gray-200 dark:border-gray-800",
        isCollapsed ? "justify-center px-3.5" : "justify-between px-5"
      )}>
        {isCollapsed ? (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Image
              src={getLogo()}
              alt="HB Track"
              width={35}
              height={35}
              className="object-contain"
              style={{ width: 'auto', height: 'auto' }}
              priority
            />
          </button>
        ) : (
          <>
            <Link href="/inicio">
              <Image
                src={getLogo()}
                alt="HB Track"
                width={89}
                height={24}
                className="object-contain cursor-pointer"
                style={{ width: 'auto', height: 'auto' }}
                priority
              />
            </Link>
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2 overflow-y-auto custom-scrollbar">
        <div className="space-y-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={cn(
                    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                    isActive
                      ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                      : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200',
                    isCollapsed && 'justify-center'
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.name}</span>}
                </div>
              </Link>
            );
          })}

          {/* Treinos with submenu (Planejamento → Sessões → Ciclos) */}
          <div>
            <button
              onClick={() => setTreinosOpen(!treinosOpen)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                isTreinosActive || treinosOpen
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                  : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200',
                isCollapsed && 'justify-center'
              )}
            >
              <Dumbbell className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">Treinos</span>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform duration-200',
                      treinosOpen && 'rotate-180'
                    )}
                  />
                </>
              )}
            </button>

            {/* Submenu */}
            <AnimatePresence>
              {treinosOpen && !isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="ml-5 mt-0.5 space-y-0.5 border-l border-gray-300 dark:border-gray-700">
                    {treinosSubmenu.map((item) => {
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                      const Icon = item.icon;

                      return (
                        <Link key={item.name} href={item.href} title={item.tooltip}>
                          <div
                            className={cn(
                              'flex items-center gap-2.5 pl-3 pr-3 py-1.5 text-xs font-medium transition-all duration-200',
                              isActive
                                ? 'text-brand-700 dark:text-brand-400'
                                : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                            )}
                          >
                            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Estatísticas with submenu (RBAC) */}
          {statisticsSubmenu.length > 0 && (
            <div>
              <button
                onClick={() => setStatisticsOpen(!statisticsOpen)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                  isStatisticsActive || statisticsOpen
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                    : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200',
                  isCollapsed && 'justify-center'
                )}
              >
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">Estatísticas</span>
                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 transition-transform duration-200',
                        statisticsOpen && 'rotate-180'
                      )}
                    />
                  </>
                )}
              </button>

              {/* Submenu */}
              <AnimatePresence>
                {statisticsOpen && !isCollapsed && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="ml-5 mt-0.5 space-y-0.5 border-l border-gray-300 dark:border-gray-700">
                      {statisticsSubmenu.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        const Icon = item.icon;

                        return (
                          <Link key={item.name} href={item.href} title={item.tooltip}>
                            <div
                              className={cn(
                                'flex items-center gap-2.5 pl-3 pr-3 py-1.5 text-xs font-medium transition-all duration-200',
                                isActive
                                  ? 'text-brand-700 dark:text-brand-400'
                                  : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                              )}
                            >
                              <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{item.name}</span>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Eventos with submenu */}
          <div>
            <button
              onClick={() => setEventosOpen(!eventosOpen)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200',
                isEventosActive || eventosOpen
                  ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                  : 'text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200',
                isCollapsed && 'justify-center'
              )}
            >
              <Calendar className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">Eventos</span>
                  <ChevronDown
                    className={cn(
                      'w-3.5 h-3.5 transition-transform duration-200',
                      eventosOpen && 'rotate-180'
                    )}
                  />
                </>
              )}
            </button>

            {/* Submenu */}
            <AnimatePresence>
              {eventosOpen && !isCollapsed && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="ml-5 mt-0.5 space-y-0.5 border-l border-gray-300 dark:border-gray-700">
                    {eventosSubmenu.map((item) => {
                      const isActive = pathname === item.href;
                      const Icon = item.icon;

                      return (
                        <Link key={item.name} href={item.href}>
                          <div
                            className={cn(
                              'flex items-center gap-2.5 pl-3 pr-3 py-1.5 text-xs font-medium transition-all duration-200',
                              isActive
                                ? 'text-brand-700 dark:text-brand-400'
                                : 'text-gray-600 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-300'
                            )}
                          >
                            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>{item.name}</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>
    </motion.aside>
  );
}