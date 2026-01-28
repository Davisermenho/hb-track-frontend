'use client';

import { useState, useEffect, useCallback } from 'react';
import { HelpCircle, Download, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { HandballCourtMap, type CourtEvent } from '@/components/game/HandballCourtMap';
import { GameTimeKeyboardHandler, createHandballGameShortcuts } from '@/components/game/GameTimeKeyboardHandler';
import { ScoutHeader } from '@/components/game/ScoutHeader';
import { EventTimeline } from '@/components/game/EventTimeline';
import { ScoutStats } from '@/components/game/ScoutStats';
import { ShortcutsHelpModal } from '@/components/game/ShortcutsHelpModal';
import { Button } from '@/components/ui/Button';
import type { GameState, TeamInfo, ScoutEvent, ScoutStats as StatsType } from '@/types/scout';

export default function ScoutLivePage() {
  // Estado do jogo
  const [gameState, setGameState] = useState<GameState>({
    homeScore: 0,
    awayScore: 0,
    currentTime: 0,
    period: 1,
    isRunning: false,
    isPaused: false,
  });

  // Times (mock data - em produção viriam do backend)
  const homeTeam: TeamInfo = {
    id: '1',
    name: 'HB Track United',
    shortName: 'HBT',
    color: 'bg-brand-500 text-white',
  };

  const awayTeam: TeamInfo = {
    id: '2',
    name: 'Handball Warriors',
    shortName: 'HBW',
    color: 'bg-purple-500 text-white',
  };

  // Eventos e zona selecionada
  const [events, setEvents] = useState<ScoutEvent[]>([]);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away'>('home');
  
  // Modais
  const [showHelp, setShowHelp] = useState(false);

  // Cronômetro
  useEffect(() => {
    if (!gameState.isRunning) return;

    const interval = setInterval(() => {
      setGameState(prev => ({
        ...prev,
        currentTime: prev.currentTime + 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState.isRunning]);

  // Função para adicionar evento
  const addEvent = useCallback((
    type: ScoutEvent['type'],
    success?: boolean,
    details?: string
  ) => {
    const newEvent: ScoutEvent = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      gameTime: gameState.currentTime,
      type,
      team: selectedTeam,
      zone: selectedZone || undefined,
      success,
      details,
    };

    setEvents(prev => [newEvent, ...prev]);

    // Atualizar placar se for gol
    if (type === 'goal' && success) {
      setGameState(prev => ({
        ...prev,
        [selectedTeam === 'home' ? 'homeScore' : 'awayScore']: 
          prev[selectedTeam === 'home' ? 'homeScore' : 'awayScore'] + 1,
      }));
    }

    // Feedback visual
    toast.success(`Evento registrado: ${type.replace('_', ' ')}`, {
      description: selectedZone ? `Zona: ${selectedZone}` : undefined,
      duration: 2000,
    });
  }, [gameState.currentTime, selectedTeam, selectedZone]);

  // Atalhos de teclado
  const shortcuts = createHandballGameShortcuts({
    onGoal: () => {
      if (!selectedZone) {
        toast.error('Selecione uma zona na quadra primeiro');
        return;
      }
      addEvent('goal', true);
    },
    onShot: () => {
      if (!selectedZone) {
        toast.error('Selecione uma zona na quadra primeiro');
        return;
      }
      addEvent('shot_miss', false);
    },
    onSave: () => addEvent('save', true),
    onTurnover: () => addEvent('turnover'),
    onFoul: () => addEvent('foul'),
    onSevenMeter: () => addEvent('seven_meter'),
    onHelp: () => setShowHelp(true),
    onUndo: () => {
      if (events.length === 0) return;
      const lastEvent = events[0];
      
      // Reverter placar se for gol
      if (lastEvent.type === 'goal' && lastEvent.success) {
        setGameState(prev => ({
          ...prev,
          [lastEvent.team === 'home' ? 'homeScore' : 'awayScore']: 
            Math.max(0, prev[lastEvent.team === 'home' ? 'homeScore' : 'awayScore'] - 1),
        }));
      }

      setEvents(prev => prev.slice(1));
      toast.info('Último evento removido');
    },
  });

  // Converter eventos para formato da quadra
  const courtEvents: CourtEvent[] = events
    .filter(e => e.zone && (e.type === 'goal' || e.type === 'shot_miss'))
    .map(e => ({
      zone: e.zone!,
      success: e.success || false,
      timestamp: e.timestamp.toISOString(),
    }));

  // Calcular estatísticas
  const calculateStats = (team: 'home' | 'away'): StatsType => {
    const teamEvents = events.filter(e => e.team === team);
    
    return {
      shots: teamEvents.filter(e => e.type === 'shot_miss').length,
      goals: teamEvents.filter(e => e.type === 'goal').length,
      saves: teamEvents.filter(e => e.type === 'save').length,
      turnovers: teamEvents.filter(e => e.type === 'turnover').length,
      fouls: teamEvents.filter(e => e.type === 'foul').length,
      sevenMeters: {
        attempts: teamEvents.filter(e => e.type === 'seven_meter').length,
        conversions: teamEvents.filter(e => e.type === 'seven_meter' && e.success).length,
      },
      shotAccuracy: 0, // Calculado no componente
    };
  };

  const homeStats = calculateStats('home');
  const awayStats = calculateStats('away');

  // Funções de controle
  const handlePlayPause = () => {
    setGameState(prev => ({
      ...prev,
      isRunning: !prev.isRunning,
      isPaused: prev.isRunning,
    }));
  };

  const handleReset = () => {
    if (events.length === 0) {
      setGameState({
        homeScore: 0,
        awayScore: 0,
        currentTime: 0,
        period: 1,
        isRunning: false,
        isPaused: false,
      });
      return;
    }

    if (confirm('Deseja resetar o jogo? Todos os eventos serão perdidos.')) {
      setGameState({
        homeScore: 0,
        awayScore: 0,
        currentTime: 0,
        period: 1,
        isRunning: false,
        isPaused: false,
      });
      setEvents([]);
      setSelectedZone(null);
      toast.success('Jogo resetado');
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    // Reverter placar se for gol
    if (event.type === 'goal' && event.success) {
      setGameState(prev => ({
        ...prev,
        [event.team === 'home' ? 'homeScore' : 'awayScore']: 
          Math.max(0, prev[event.team === 'home' ? 'homeScore' : 'awayScore'] - 1),
      }));
    }

    setEvents(prev => prev.filter(e => e.id !== eventId));
    toast.success('Evento removido');
  };

  const handleExport = () => {
    const data = {
      gameInfo: { homeTeam, awayTeam, gameState },
      events,
      stats: { home: homeStats, away: awayStats },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scout-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success('Scout exportado com sucesso');
  };

  return (
    <>
      <GameTimeKeyboardHandler 
        shortcuts={shortcuts}
        enabled={true}
        onShortcutTriggered={(shortcut) => {
          console.log(`Atalho: ${shortcut.label}`);
        }}
      />

      <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-950">
        {/* Header com placar */}
        <ScoutHeader
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          gameState={gameState}
          onPlayPause={handlePlayPause}
          onReset={handleReset}
        />

        {/* Toolbar */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-2">
          <div className="flex items-center justify-between">
            {/* Seletor de time */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Time ativo:
              </span>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setSelectedTeam('home')}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    selectedTeam === 'home'
                      ? 'bg-brand-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {homeTeam.shortName}
                </button>
                <button
                  onClick={() => setSelectedTeam('away')}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${
                    selectedTeam === 'away'
                      ? 'bg-purple-500 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {awayTeam.shortName}
                </button>
              </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowHelp(true)}
              >
                <HelpCircle className="w-4 h-4" />
                Atalhos
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
              >
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Zona selecionada */}
          {selectedZone && (
            <div className="mt-2 flex items-center gap-2 text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                Zona selecionada:
              </span>
              <span className="px-2 py-1 bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 rounded font-medium">
                {selectedZone.replace('shot_', '').replace('_', ' ')}
              </span>
              <button
                onClick={() => setSelectedZone(null)}
                className="text-xs text-error-600 dark:text-error-400 hover:underline"
              >
                Limpar
              </button>
            </div>
          )}
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full grid grid-cols-1 lg:grid-cols-12 gap-4 p-4">
            {/* Timeline - Esquerda */}
            <div className="lg:col-span-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Timeline de Eventos
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {events.length} eventos registrados
                </p>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <EventTimeline 
                  events={events}
                  onDeleteEvent={handleDeleteEvent}
                />
              </div>
            </div>

            {/* Quadra - Centro */}
            <div className="lg:col-span-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm p-4 flex flex-col">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Quadra de Handebol
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Clique em uma zona para selecioná-la, depois use atalhos de teclado
                </p>
              </div>
              <div className="flex-1">
                <HandballCourtMap
                  events={courtEvents}
                  interactive={true}
                  heatmapMode={true}
                  onZoneClick={(zoneId) => {
                    setSelectedZone(zoneId);
                    toast.info(`Zona selecionada: ${zoneId.replace('shot_', '').replace('_', ' ')}`);
                  }}
                  className="h-full"
                />
              </div>
            </div>

            {/* Estatísticas - Direita */}
            <div className="lg:col-span-3">
              <ScoutStats
                homeStats={homeStats}
                awayStats={awayStats}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de ajuda */}
      <ShortcutsHelpModal 
        isOpen={showHelp}
        onClose={() => setShowHelp(false)}
      />
    </>
  );
}