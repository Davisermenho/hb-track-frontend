/**
 * Cabeçalho Semanal do Dashboard
 * Mostra próximo treino e próximo jogo
 */

interface WeeklyHeaderProps {
  nextTraining?: {
    date: string
    time: string
    type: string
  }
  nextMatch?: {
    opponent: string
    date: string
    time: string
    location: string
    isHome: boolean
  }
}

export default function WeeklyHeader({ nextTraining, nextMatch }: WeeklyHeaderProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    })
  }

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    })
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 via-white to-blue-50 p-6 dark:border-blue-800 dark:from-blue-950 dark:via-gray-900 dark:to-blue-950">
      <div className="mb-4 flex items-center gap-2">
        <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Esta Semana
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Próximo Treino */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Próximo Treino
            </h3>
          </div>

          {nextTraining ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {nextTraining.type}
              </p>
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-semibold">
                  {formatDate(nextTraining.date)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {nextTraining.time}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhum treino agendado
            </p>
          )}
        </div>

        {/* Próximo Jogo */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-full bg-green-100 p-2 dark:bg-green-900/30">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Próximo Jogo
            </h3>
          </div>

          {nextMatch ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  nextMatch.isHome
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {nextMatch.isHome ? 'Casa' : 'Fora'}
                </span>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  vs
                </span>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {nextMatch.opponent}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-semibold">
                  {formatDate(nextMatch.date)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-lg font-bold text-green-600 dark:text-green-400">
                  {nextMatch.time}
                </span>
              </div>

              <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm">
                  {nextMatch.location}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhum jogo agendado
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
