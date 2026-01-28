/**
 * Tabela dos últimos treinos com indicadores-chave
 */

'use client'

import { useRouter } from 'next/navigation'

interface TrainingData {
  session_id?: string;
  training_id?: string;
  session_at?: string;
  training_date?: string;
  training_type?: string;
  main_objective?: string;
  team_name?: string;
  attendance_rate: number;
  avg_internal_load: number;
  avg_rpe?: number;
  present_count?: number;
  presentes?: number;
  expected_count?: number;
  total_athletes?: number;
}

interface RecentTrainingsProps {
  data: TrainingData[];
}

export default function RecentTrainings({ data }: RecentTrainingsProps) {
  const router = useRouter()

  if (!data || data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
          📋 Histórico Recente
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Nenhum treino registrado
        </p>
      </div>
    )
  }

  const getAttendanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600 dark:text-green-400'
    if (rate >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getLoadColor = (load: number) => {
    if (load >= 400) return 'text-red-600 dark:text-red-400'
    if (load >= 250) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      weekday: 'short',
    });
  }

  const handleRowClick = (trainingId: string) => {
    // Navegar para a tela de detalhes do treino
    router.push(`/trainings/${trainingId}`)
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
      <div className="border-b border-gray-200 p-6 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          📋 Histórico Recente
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Resumo das últimas {data.length} sessões de treinamento
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Data
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Tipo
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Presença
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Taxa
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Carga
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                RPE Médio
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((training, index) => {
              const attendanceRate = training.attendance_rate || 0
              const internalLoad = training.avg_internal_load || 0

              return (
                <tr
                  key={index}
                  onClick={() => training.training_id && handleRowClick(training.training_id)}
                  className="cursor-pointer transition-colors hover:bg-blue-50 dark:hover:bg-blue-900/20"
                  title="Clique para ver detalhes do treino"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {formatDate(training.training_date || training.session_at)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {training.training_type || 'Treino'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-900 dark:text-white">
                    {training.present_count}/{training.expected_count}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <span
                      className={`text-sm font-semibold ${getAttendanceColor(
                        attendanceRate
                      )}`}
                    >
                      {attendanceRate.toFixed(0)}%
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    <span
                      className={`text-sm font-semibold ${getLoadColor(
                        internalLoad
                      )}`}
                    >
                      {internalLoad.toFixed(0)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center text-sm text-gray-700 dark:text-gray-300">
                    {training.avg_rpe?.toFixed(1) || '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-center">
                    {attendanceRate >= 80 && internalLoad < 400 ? (
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        ✓ Ótimo
                      </span>
                    ) : attendanceRate >= 60 ? (
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        ⚠ Atenção
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        ✗ Revisar
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Rodapé com insights */}
      <div className="border-t border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-700/50">
        <div className="grid grid-cols-1 gap-4 text-center md:grid-cols-3">
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {(
                data.reduce((acc, t) => acc + (t.attendance_rate || 0), 0) /
                data.length
              ).toFixed(0)}
              %
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Presença média período
            </p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {(
                data.reduce((acc, t) => acc + (t.avg_internal_load || 0), 0) /
                data.length
              ).toFixed(0)}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Carga média período
            </p>
          </div>
          <div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {data.filter((t) => (t.attendance_rate || 0) >= 80).length}/
              {data.length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Treinos com boa presença
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
