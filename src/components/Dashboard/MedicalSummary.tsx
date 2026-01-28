/**
 * Bloco de Resumo Médico/Lesões (R4)
 */

interface MedicalSummaryData {
  active_cases: number;
  recovery_cases?: number;
  recovering?: number;
  closed_cases?: number;
  cleared_this_week?: number;
  total_cases?: number;
  avg_days_out: number | null;
  by_severity?: Array<{ severity: string; count: number }>;
  by_type?: Array<{ injury_type: string; count: number }>;
}

interface MedicalSummaryProps {
  data: MedicalSummaryData | null;
}

export default function MedicalSummary({ data }: MedicalSummaryProps) {
  if (!data) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          🏥 Situação Médica
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sem dados médicos disponíveis
        </p>
      </div>
    )
  }

  const severityColors: Record<string, string> = {
    leve: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    moderada:
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    grave: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  }

  const statusColors: Record<string, string> = {
    ativo: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    'em recuperação':
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    encerrado:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          🏥 Situação Médica
        </h3>
        {data.active_cases > 0 && (
          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
            {data.active_cases} caso{data.active_cases > 1 ? 's' : ''} ativo
            {data.active_cases > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Cards de resumo */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/10">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
            {data.active_cases}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Casos Ativos
          </p>
        </div>
        <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/10">
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
            {data.recovery_cases || data.recovering || 0}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Em Recuperação
          </p>
        </div>
        <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/10">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {data.closed_cases || data.cleared_this_week || 0}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Casos Encerrados
          </p>
        </div>
        <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/10">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {data.avg_days_out?.toFixed(0) || 0}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            Dias médios afastado
          </p>
        </div>
      </div>

      {/* Distribuição por gravidade */}
      {data.by_severity && data.by_severity.length > 0 && (
        <div className="mb-6">
          <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Distribuição por Gravidade
          </h4>
          <div className="space-y-2">
            {data.by_severity.map((item: { severity: string; count: number }) => (
              <div
                key={item.severity}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      severityColors[item.severity.toLowerCase()] ||
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {item.severity}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className="h-full bg-blue-500"
                     style={{
                        width: `${
                          ((item.count || 0) / (data.total_cases || 1)) * 100
                        }%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tipos de lesão mais comuns */}
      {data.by_type && data.by_type.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
            Tipos Mais Comuns
          </h4>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {data.by_type.slice(0, 6).map((item: { injury_type: string; count: number }) => (
              <div
                key={item.injury_type}
                className="rounded-lg border border-gray-200 p-3 dark:border-gray-700"
              >
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {item.count}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {item.injury_type}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alerta de risco */}
      {data.active_cases > 3 && (
        <div className="mt-6 rounded-lg border-l-4 border-yellow-500 bg-yellow-50 p-4 dark:bg-yellow-900/10">
          <div className="flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-semibold text-yellow-800 dark:text-yellow-400">
                Atenção: Alto número de casos ativos
              </p>
              <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-500">
                Considere ajustar a carga de treinos e revisar o planejamento
                da semana. Priorize recuperação e prevenção.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
