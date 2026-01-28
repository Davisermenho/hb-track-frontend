'use client';

/**
 * Skeleton loading específico para ficha do atleta na sidebar
 * Melhora a percepção de performance durante o carregamento
 */
export function AthleteDetailSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      {/* Foto e Info Básica */}
      <div className="flex items-start gap-4">
        {/* Foto */}
        <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

        <div className="flex-1 space-y-3">
          {/* Nome */}
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          {/* Apelido */}
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />

          {/* Badges */}
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
          </div>
        </div>
      </div>

      {/* Dados Pessoais */}
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32" />
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
          </div>
        </div>
      </div>

      {/* Contatos */}
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24" />
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48" />
          </div>
        </div>
      </div>

      {/* Dados Esportivos */}
      <div className="space-y-3">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-36" />
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-28" />
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
