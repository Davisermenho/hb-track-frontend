'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Grid3x3, List, Star, Award, 
  Zap, Target, TrendingUp, Sparkles, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

// Mock data - atletas
const ATHLETES = [
  {
    id: '1',
    name: 'Maria Santos',
    number: 10,
    position: 'Ponta Esquerda',
    photo: null,
    stats: { goals: 45, assists: 12, games: 24 },
    rating: 9.2,
    status: 'active',
    highlight: 'top-scorer',
  },
  {
    id: '2',
    name: 'Ana Paula',
    number: 7,
    position: 'Armadora Central',
    photo: null,
    stats: { goals: 38, assists: 18, games: 24 },
    rating: 8.9,
    status: 'active',
    highlight: 'mvp',
  },
  {
    id: '3',
    name: 'Julia Mendes',
    number: 15,
    position: 'Ponta Direita',
    photo: null,
    stats: { goals: 32, assists: 8, games: 22 },
    rating: 8.5,
    status: 'active',
  },
  {
    id: '4',
    name: 'Carla Rodrigues',
    number: 23,
    position: 'Central',
    photo: null,
    stats: { goals: 28, assists: 5, games: 24 },
    rating: 8.3,
    status: 'active',
  },
  {
    id: '5',
    name: 'Beatriz Lima',
    number: 4,
    position: 'Pivô',
    photo: null,
    stats: { goals: 24, assists: 6, games: 20 },
    rating: 8.1,
    status: 'active',
  },
  {
    id: '6',
    name: 'Fernanda Costa',
    number: 12,
    position: 'Goleira',
    photo: null,
    stats: { goals: 0, assists: 0, games: 24 },
    rating: 9.5,
    status: 'active',
    highlight: 'best-gk',
  },
];

const POSITIONS = ['Todas', 'Ponta Esquerda', 'Ponta Direita', 'Central', 'Armadora Central', 'Pivô', 'Goleira'];

export default function AtletasGridPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('Todas');

  const filteredAthletes = ATHLETES.filter((athlete) => {
    const matchesSearch = athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.number.toString().includes(searchQuery);
    const matchesPosition = selectedPosition === 'Todas' || athlete.position === selectedPosition;
    return matchesSearch && matchesPosition;
  });

  const getHighlightConfig = (highlight?: string) => {
    switch (highlight) {
      case 'top-scorer':
        return { 
          icon: Target, 
          label: 'Artilheira', 
          gradient: 'from-orange-500 to-red-500',
          glow: 'shadow-orange-500/50',
        };
      case 'mvp':
        return { 
          icon: Award, 
          label: 'MVP', 
          gradient: 'from-yellow-500 to-orange-500',
          glow: 'shadow-yellow-500/50',
        };
      case 'best-gk':
        return { 
          icon: Shield, 
          label: 'Melhor Goleira', 
          gradient: 'from-blue-500 to-cyan-500',
          glow: 'shadow-blue-500/50',
        };
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-brand-50/30 to-purple-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header com gradiente animado */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-600 via-purple-600 to-pink-600 opacity-90" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-10 h-10 text-white" />
              <h1 className="text-4xl font-bold text-white">
                Nossas Atletas
              </h1>
            </div>
            <p className="text-white/90 text-lg">
              Conheça o time campeão • {ATHLETES.length} atletas
            </p>
          </motion.div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-10 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-800/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou número..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 transition-all"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={selectedPosition}
                onChange={(e) => setSelectedPosition(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 transition-all"
              >
                {POSITIONS.map((pos) => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>

              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 rounded-lg transition-all',
                    viewMode === 'list'
                      ? 'bg-white dark:bg-gray-700 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Athletes Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          layout
          className={cn(
            'grid gap-6',
            viewMode === 'grid'
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              : 'grid-cols-1'
          )}
        >
          {filteredAthletes.map((athlete, index) => {
            const highlight = getHighlightConfig(athlete.highlight);
            const HighlightIcon = highlight?.icon;

            return (
              <motion.div
                key={athlete.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="group relative"
              >
                {/* Highlight Badge */}
                {highlight && (
                  <div className={cn(
                    'absolute -top-3 left-1/2 -translate-x-1/2 z-10',
                    'px-3 py-1 rounded-full text-xs font-bold text-white',
                    'bg-gradient-to-r shadow-lg',
                    highlight.gradient,
                    highlight.glow,
                    'flex items-center gap-1.5'
                  )}>
                    {HighlightIcon && <HighlightIcon className="w-3 h-3" />}
                    {highlight.label}
                  </div>
                )}

                {/* Card */}
                <div className={cn(
                  'relative overflow-hidden rounded-2xl',
                  'bg-white dark:bg-gray-900',
                  'border border-gray-200 dark:border-gray-800',
                  'shadow-xl hover:shadow-2xl',
                  'transition-all duration-300',
                  'backdrop-blur-sm',
                  highlight && 'ring-2 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-950',
                  highlight && `ring-${highlight.gradient.split('-')[1]}-500/50`
                )}>
                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-600/0 via-purple-600/0 to-pink-600/0 group-hover:from-brand-600/10 group-hover:via-purple-600/10 group-hover:to-pink-600/10 transition-all duration-500" />
                  
                  {/* Content */}
                  <div className="relative p-6">
                    {/* Photo + Number */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="relative">
                        {/* Photo Circle with Gradient Border */}
                        <div className="relative w-20 h-20">
                          <div className="absolute inset-0 bg-gradient-to-br from-brand-500 via-purple-500 to-pink-500 rounded-full animate-spin-slow" />
                          <div className="absolute inset-0.5 bg-white dark:bg-gray-900 rounded-full" />
                          <div className="absolute inset-1 bg-gradient-to-br from-brand-400 to-purple-400 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {athlete.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                        </div>
                        {/* Status Indicator */}
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success-500 rounded-full border-4 border-white dark:border-gray-900 animate-pulse" />
                      </div>

                      {/* Number Badge */}
                      <div className="bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-gray-700 text-white rounded-xl px-4 py-2 font-bold text-2xl shadow-lg">
                        #{athlete.number}
                      </div>
                    </div>

                    {/* Name + Position */}
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {athlete.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                        {athlete.position}
                      </p>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-4 h-4',
                              i < Math.floor(athlete.rating / 2)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            )}
                          />
                        ))}
                      </div>
                      <span className="text-lg font-bold text-gray-900 dark:text-white">
                        {athlete.rating}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="text-2xl font-bold text-brand-600 dark:text-brand-400">
                          {athlete.stats.goals}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Gols</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {athlete.stats.assists}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Assist.</div>
                      </div>
                      <div className="text-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                          {athlete.stats.games}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">Jogos</div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full mt-4 py-3 bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                      Ver Perfil
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Empty State */}
        {filteredAthletes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
              <Search className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma atleta encontrada
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Tente ajustar seus filtros de busca
            </p>
          </motion.div>
        )}
      </div>

      {/* Floating Action Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-br from-brand-600 to-purple-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:shadow-brand-500/50 transition-all"
      >
        <Sparkles className="w-6 h-6" />
      </motion.button>

      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}