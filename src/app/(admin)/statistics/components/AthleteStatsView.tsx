'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion } from 'framer-motion';
import type { AthleteExpanded } from '@/types/athlete-canonical';
import type { AthleteStatistics, MonthFilter } from '@/lib/api/statistics';
import ACWRChart from './ACWRChart';

interface Tab {
  id: string;
  label: string;
}

const tabs: Tab[] = [
  { id: 'overview', label: 'VISÃO GERAL' },
  { id: 'readiness', label: 'PRONTIDÃO' },
  { id: 'training-load', label: 'CARGA DE TREINO' },
  { id: 'test-results', label: 'RESULTADOS DE TESTES' },
];

interface AthleteStatsViewProps {
  athlete: AthleteExpanded;
  stats: AthleteStatistics;
  loading: boolean;
  monthFilter: MonthFilter;
}

export default function AthleteStatsView({
  athlete,
  stats,
  loading,
  monthFilter,
}: AthleteStatsViewProps) {
  const [activeTab, setActiveTab] = useState('training-load');

  const birthYear = stats.year_of_birth || new Date(athlete.birth_date).getFullYear();

  return (
    <div className="p-6">
      {/* Athlete Header */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 mb-6">
        <div className="flex items-start gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-brand-500 text-white flex items-center justify-center flex-shrink-0 overflow-hidden relative">
            {athlete.athlete_photo_path ? (
              <Image
                src={athlete.athlete_photo_path}
                alt={athlete.athlete_name}
                fill
                className="rounded-full object-cover"
              />
            ) : (
              <span className="text-2xl font-bold">
                {athlete.athlete_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {athlete.athlete_name}
            </h2>
            
            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-500 uppercase block mb-0.5">
                  Ano de Nascimento
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {birthYear}
                </span>
              </div>
              
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-500 uppercase block mb-0.5">
                  Número da Camisa
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.shirt_number}
                </span>
              </div>
              
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-500 uppercase block mb-0.5">
                  Posição
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.position}
                </span>
              </div>
              
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-500 uppercase block mb-0.5">
                  Pé Preferido
                </span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {stats.preferred_foot}
                </span>
              </div>
              
              {stats.bodyweight && (
                <div>
                  <span className="text-xs text-gray-500 dark:text-gray-500 uppercase block mb-0.5">
                    Peso Corporal
                  </span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {stats.bodyweight} kg
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mb-6">
        <div className="border-b border-gray-200 dark:border-gray-800">
          <div className="flex gap-1 p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-4 py-2.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && stats.overview && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  <StatCard label="Jogos Disputados" value={stats.overview.games_played} />
                  <StatCard label="Minutos Jogados" value={stats.overview.minutes_played} />
                  <StatCard label="Gols" value={stats.overview.goals} />
                  <StatCard label="Assistências" value={stats.overview.assists} />
                </motion.div>
              )}

              {activeTab === 'readiness' && stats.readiness && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-4"
                >
                  <StatCard label="Score de Bem-estar" value={stats.readiness.wellness_score} unit="/10" />
                  <StatCard label="Qualidade do Sono" value={stats.readiness.sleep_quality} unit="/10" />
                  <StatCard label="Dor Muscular" value={stats.readiness.muscle_soreness} unit="/10" />
                  <StatCard label="Nível de Estresse" value={stats.readiness.stress_level} unit="/10" />
                </motion.div>
              )}

              {activeTab === 'training-load' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ACWRChart data={stats.acwr_data || []} />
                </motion.div>
              )}

              {activeTab === 'test-results' && stats.test_results && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  {stats.test_results.map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {result.test_name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(result.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {result.value} {result.unit}
                        </p>
                        {result.percentile && (
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Percentil {result.percentile}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit = '' }: { label: string; value: number; unit?: string }) {
  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {value}{unit}
      </p>
    </div>
  );
}