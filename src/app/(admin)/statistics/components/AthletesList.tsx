'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import type { AthleteExpanded } from '@/types/athlete-canonical';

interface AthletesListProps {
  athletes: AthleteExpanded[];
  selectedAthlete: AthleteExpanded | null;
  onSelectAthlete: (athlete: AthleteExpanded) => void;
  loading: boolean;
}

export default function AthletesList({
  athletes,
  selectedAthlete,
  onSelectAthlete,
  loading,
}: AthletesListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500 mx-auto mb-3"></div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Carregando atletas...</p>
        </div>
      </div>
    );
  }

  if (athletes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Nenhum atleta encontrado
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full custom-scrollbar">
      <div className="p-2">
        <h3 className="px-2 mb-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          Atletas
        </h3>
        
        <div className="space-y-1">
          {athletes.map((athlete, index) => (
            <motion.button
              key={athlete.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03, duration: 0.2 }}
              onClick={() => onSelectAthlete(athlete)}
              className={`w-full flex items-center gap-3 px-2 py-2.5 rounded-lg transition-all duration-200 ${
                selectedAthlete?.id === athlete.id
                  ? 'bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent'
              }`}
            >
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden relative ${
                selectedAthlete?.id === athlete.id
                  ? 'bg-brand-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
              }`}>
                {athlete.athlete_photo_path ? (
                  <Image
                    src={athlete.athlete_photo_path}
                    alt={athlete.athlete_name}
                    fill
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-sm font-semibold">
                    {athlete.athlete_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-left min-w-0">
                <p className={`text-sm font-medium truncate ${
                  selectedAthlete?.id === athlete.id
                    ? 'text-brand-700 dark:text-brand-400'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {athlete.athlete_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {athlete.main_defensive_position?.abbreviation || 'N/A'} • 
                  {athlete.shirt_number ? ` #${athlete.shirt_number}` : ' S/N'}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}