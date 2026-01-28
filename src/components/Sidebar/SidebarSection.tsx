'use client';

/**
 * SidebarSection - Separador visual com título de seção
 * 
 * Usado para agrupar itens relacionados na sidebar com
 * títulos como "Início", "Planejamento", "Desempenho", etc.
 */

interface SidebarSectionProps {
  title: string;
  isCollapsed: boolean;
}

export function SidebarSection({ title, isCollapsed }: SidebarSectionProps) {
  if (isCollapsed) {
    return <div className="h-px bg-gray-200 dark:bg-gray-700 mx-2 my-3" />;
  }

  return (
    <div className="px-3 pt-4 pb-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {title}
      </span>
    </div>
  );
}
