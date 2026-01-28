import React from 'react';

/**
 * Documentação de exemplos dos novos componentes.
 * Este arquivo apenas referencia usos; exemplos completos estavam fora do padrão de JSX.
 */
const samples = `
// AthleteStateBadge
<AthleteStateBadge state="ativa" flags={{ injured: true }} />

// HandballCourtMap
<HandballCourtMap events={events} heatmapMode />

// GameTimeKeyboardHandler
const shortcuts = createHandballGameShortcuts({ onGoal: () => {} });
<GameTimeKeyboardHandler shortcuts={shortcuts} enabled />;
`;

export default function ExemplosComponentes() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Exemplos de Componentes</h1>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Consulte os snippets abaixo como referência rápida. Integre diretamente nos módulos onde fizer sentido.
      </p>
      <pre className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 text-sm overflow-auto">
        {samples}
      </pre>
    </div>
  );
}
