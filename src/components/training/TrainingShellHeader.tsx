/**
 * TrainingShellHeader
 * 
 * Chrome puro do módulo Treinos (layout-level header).
 * Escopo: título "Treinos", breadcrumbs (se existirem), zero ações operacionais.
 * 
 * Ações operacionais da Agenda (equipe, prev/next/hoje, semana/mês, filtros, "Novo treino")
 * ficam exclusivamente no AgendaHeader.
 * 
 * Design: densidade confortável dark-first, max-w-7xl px-6, bg-gray-950/80 backdrop-blur.
 */

'use client';

import React from 'react';
import { usePathname } from 'next/navigation';

export function TrainingShellHeader() {
  const pathname = usePathname();

  if (pathname?.startsWith('/training/agenda')) {
    return null;
  }

  return (
    <header 
      role="banner"
      className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur-sm dark:border-gray-800 dark:bg-[#1a1f2e]"
    >
      <div className="mx-auto max-w-[1600px] px-6 lg:px-10">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Treinos
            </h1>
            {/* Breadcrumbs future: <Breadcrumbs /> */}
          </div>
          
          <div className="flex items-center gap-3">
            {/* Ações globais do módulo (ex.: link "Configurações", "Ajuda") se necessário */}
          </div>
        </div>
      </div>
    </header>
  );
}
