'use client';

import { Play, Pause, Timer, RotateCcw, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { GameState, TeamInfo } from '@/types/scout';

interface ScoutHeaderProps {
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  gameState: GameState;
  onPlayPause: () => void;
  onReset: () => void;
  onSettings?: () => void;
  className?: string;
}

export function ScoutHeader({
  homeTeam,
  awayTeam,
  gameState,
  onPlayPause,
  onReset,
  onSettings,
  className,
}: ScoutHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className={cn(
      'bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800',
      'shadow-sm',
      className
    )}>
      <div className="px-4 py-3 md:px-6 md:py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Time Casa */}
          <div className="flex items-center gap-3 flex-1">
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              'font-bold text-lg shadow-md',
              homeTeam.color
            )}>
              {homeTeam.shortName[0]}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-gray-900 dark:text-white">
                {homeTeam.shortName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">
                Casa
              </span>
            </div>
          </div>

          {/* Placar e Cronômetro */}
          <div className="flex flex-col items-center gap-2 min-w-[200px]">
            {/* Placar */}
            <div className="flex items-center gap-4">
              <div className={cn(
                'text-4xl md:text-5xl font-bold',
                gameState.homeScore > gameState.awayScore 
                  ? 'text-success-600 dark:text-success-400' 
                  : 'text-gray-700 dark:text-gray-300'
              )}>
                {gameState.homeScore}
              </div>
              <div className="text-2xl md:text-3xl font-light text-gray-400">
                :
              </div>
              <div className={cn(
                'text-4xl md:text-5xl font-bold',
                gameState.awayScore > gameState.homeScore 
                  ? 'text-success-600 dark:text-success-400' 
                  : 'text-gray-700 dark:text-gray-300'
              )}>
                {gameState.awayScore}
              </div>
            </div>

            {/* Cronômetro */}
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-gray-500" />
              <span className={cn(
                'text-xl font-mono font-semibold',
                gameState.isRunning ? 'text-error-600 dark:text-error-400' : 'text-gray-600 dark:text-gray-400'
              )}>
                {formatTime(gameState.currentTime)}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {gameState.period}º T
              </span>
            </div>

            {/* Controles */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={gameState.isRunning ? 'destructive' : 'default'}
                onClick={onPlayPause}
              >
                {gameState.isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {gameState.isRunning ? 'Pausar' : 'Iniciar'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onReset}
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Time Visitante */}
          <div className="flex items-center gap-3 flex-1 justify-end">
            <div className="flex flex-col items-end">
              <span className="font-semibold text-gray-900 dark:text-white">
                {awayTeam.shortName}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">
                Visitante
              </span>
            </div>
            <div className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              'font-bold text-lg shadow-md',
              awayTeam.color
            )}>
              {awayTeam.shortName[0]}
            </div>
          </div>
        </div>

        {/* Status do Jogo */}
        <div className="mt-3 flex items-center justify-center gap-2 text-sm">
          {gameState.isPaused && (
            <span className="px-2 py-1 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 rounded-md font-medium">
              ⏸️ Pausado
            </span>
          )}
          {gameState.isRunning && (
            <span className="px-2 py-1 bg-error-100 dark:bg-error-900/30 text-error-700 dark:text-error-400 rounded-md font-medium animate-pulse">
              🔴 AO VIVO
            </span>
          )}
          {!gameState.isRunning && !gameState.isPaused && (
            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md font-medium">
              ⏹️ Aguardando início
            </span>
          )}
        </div>
      </div>
    </div>
  );
}