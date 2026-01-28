'use client';

/**
 * Breadcrumbs - Navegação contextual na topbar
 * 
 * Mostra o caminho da página atual com links navegáveis.
 * Renderiza apenas em rotas com profundidade.
 * 
 * @version 1.0.0
 */

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

// =============================================================================
// TIPOS
// =============================================================================

interface BreadcrumbItem {
  label: string;
  href: string;
  isLast: boolean;
}

interface BreadcrumbsProps {
  className?: string;
}

// =============================================================================
// MAPEAMENTO DE ROTAS
// =============================================================================

const ROUTE_LABELS: Record<string, string> = {
  'dashboard': 'Dashboard',
  'inicio': 'Início',
  'teams': 'Equipes',
  'training': 'Treinos',
  'agenda': 'Agenda',
  'planejamento': 'Planejamento',
  'banco': 'Banco de Exercícios',
  'exercise-bank': 'Banco de Exercícios',
  'avaliacoes': 'Avaliações',
  'presencas': 'Presenças',
  'calendario': 'Calendário',
  'analytics': 'Analytics',
  'rankings': 'Rankings',
  'eficacia-preventiva': 'Eficácia Preventiva',
  'configuracoes': 'Configurações',
  'games': 'Jogos',
  'escalacoes': 'Escalações',
  'eventos': 'Eventos',
  'relatorio': 'Relatório',
  'competitions': 'Competições',
  'admin': 'Administração',
  'athletes': 'Atletas',
  'new': 'Novo',
  'edit': 'Editar',
  'estatisticas': 'Estatísticas',
  'evolucao': 'Evolução',
  'perfil': 'Perfil',
  '360': 'Visão 360°',
  'reports': 'Relatórios',
  'cadastro': 'Cadastro',
  'staff': 'Comissão Técnica',
  'users': 'Usuários',
  'manage': 'Gerenciar',
  'settings': 'Configurações',
  'statistics': 'Estatísticas',
  'comparativos': 'Comparativos',
  'me': 'Minhas Estatísticas',
  'calendar': 'Calendário',
  'history': 'Histórico',
  'wellness': 'Bem-estar',
  'scout': 'Scout',
  'live': 'Ao Vivo',
  'fases': 'Fases',
  'tabela': 'Tabela',
  'regulamento': 'Regulamento',
  'top-performers': 'Top Performers',
};

// Rotas que não devem mostrar breadcrumbs
const HIDDEN_ROUTES = [
  '/signin',
  '/signup',
  '/reset-password',
  '/new-password',
  '/set-password',
  '/confirm-reset',
  '/error-404',
];

// =============================================================================
// COMPONENTE
// =============================================================================

export function Breadcrumbs({ className }: BreadcrumbsProps) {
  const pathname = usePathname();

  const breadcrumbs = useMemo((): BreadcrumbItem[] => {
    if (!pathname || HIDDEN_ROUTES.includes(pathname)) {
      return [];
    }

    if (pathname.startsWith('/training/agenda')) {
      return [];
    }

    // Dividir pathname em segmentos
    const segments = pathname.split('/').filter(Boolean);
    
    // Não mostrar para rotas de nível único (ex: /dashboard)
    if (segments.length <= 1) {
      return [];
    }

    // Construir breadcrumbs
    const items: BreadcrumbItem[] = [];
    let currentPath = '';

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === segments.length - 1;

      // Ignorar IDs numéricos ou UUIDs no label (mas manter no path)
      const isId = /^[0-9a-f-]+$/i.test(segment) && segment.length > 3;
      
      let label = ROUTE_LABELS[segment];
      
      if (!label) {
        if (isId) {
          // Para IDs, usar rótulo genérico baseado no segmento anterior
          const prevSegment = segments[index - 1];
          if (prevSegment === 'athletes') {
            label = 'Atleta';
          } else if (prevSegment === 'teams') {
            label = 'Equipe';
          } else if (prevSegment === 'games') {
            label = 'Jogo';
          } else if (prevSegment === 'training') {
            label = 'Treino';
          } else {
            label = 'Detalhes';
          }
        } else {
          // Capitalizar segmento desconhecido
          label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        }
      }

      items.push({
        label,
        href: currentPath,
        isLast,
      });
    });

    return items;
  }, [pathname]);

  // Não renderizar se não há breadcrumbs
  if (breadcrumbs.length === 0) {
    return null;
  }

  return (
    <nav className={cn('flex items-center', className)} aria-label="Breadcrumb">
      {/* Home Link */}
      <Link
        href="/dashboard"
        className="flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <Home className="w-4 h-4" />
      </Link>

      {/* Separador inicial */}
      <ChevronRight className="w-4 h-4 mx-2 text-gray-300 dark:text-gray-600" />

      {/* Breadcrumb Items */}
      <ol className="flex items-center gap-1">
        {breadcrumbs.map((item, index) => (
          <li key={item.href} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="w-4 h-4 mx-1 text-gray-300 dark:text-gray-600" />
            )}
            
            {item.isLast ? (
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
