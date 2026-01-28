/**
 * TrainingTabs
 * 
 * Navegação entre 8 subrotas da /training:
 * - Agenda Semanal
 * - Calendário Mensal
 * - Planejamento
 * - Banco de Exercícios
 * - Analytics
 * - Rankings
 * - Eficácia Preventiva
 * - Configurações
 * 
 * Design System: Tabs compactas, altura h-10
 */

'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  CalendarDays, 
  Target, 
  Dumbbell, 
  BarChart3,
  Trophy,
  HeartPulse,
  Settings
} from 'lucide-react';

interface Tab {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: 'agenda', label: 'Agenda', href: '/training/agenda', icon: CalendarDays },
  { id: 'planejamento', label: 'Planejamento', href: '/training/planejamento', icon: Target },
  { id: 'exercicios', label: 'Exercícios', href: '/training/exercise-bank', icon: Dumbbell },
  { id: 'analytics', label: 'Analytics', href: '/training/analytics', icon: BarChart3 },
  { id: 'rankings', label: 'Rankings', href: '/training/rankings', icon: Trophy },
  { id: 'eficacia', label: 'Eficácia', href: '/training/eficacia-preventiva', icon: HeartPulse },
  { id: 'configuracoes', label: 'Configurações', href: '/training/configuracoes', icon: Settings },
];

export function TrainingTabs() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/training/agenda' && pathname === '/training') return true;
    return pathname.startsWith(href);
  };

  return (
    <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-[#1a1f2e]">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-10">
        <nav className="flex gap-1 -mb-px overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.href);
            
            return (
              <Link
                key={tab.id}
                href={tab.href}
                data-testid={`training-tab-${tab.id}`}
                className={`
                  flex h-9 items-center gap-2 px-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${active
                    ? 'text-[#2463eb] border-[#2463eb]'
                    : 'text-[#616e89] dark:text-gray-400 border-transparent hover:text-[#111318] dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
