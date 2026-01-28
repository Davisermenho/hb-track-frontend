'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface Zone {
  id: string;
  label: string;
  x: number; // percentual
  y: number; // percentual
  width: number; // percentual
  height: number; // percentual
}

export interface CourtEvent {
  zone: string;
  success: boolean;
  timestamp?: string;
}

interface HandballCourtMapProps {
  events: CourtEvent[];
  onZoneClick?: (zoneId: string) => void;
  interactive?: boolean;
  heatmapMode?: boolean;
  className?: string;
}

// =============================================================================
// COURT ZONES - Zonas oficiais de handebol
// =============================================================================

const COURT_ZONES: Zone[] = [
  // Linha de 6m
  { id: 'shot_6m_left', label: '6m E', x: 5, y: 25, width: 25, height: 45 },
  { id: 'shot_6m_center', label: '6m C', x: 30, y: 25, width: 40, height: 45 },
  { id: 'shot_6m_right', label: '6m D', x: 70, y: 25, width: 25, height: 45 },
  
  // Linha de 9m
  { id: 'shot_9m_left', label: '9m E', x: 5, y: 70, width: 25, height: 25 },
  { id: 'shot_9m_center', label: '9m C', x: 30, y: 70, width: 40, height: 25 },
  { id: 'shot_9m_right', label: '9m D', x: 70, y: 70, width: 25, height: 25 },
  
  // Pontas
  { id: 'shot_wing_left', label: 'Ponta E', x: 0, y: 10, width: 5, height: 80 },
  { id: 'shot_wing_right', label: 'Ponta D', x: 95, y: 10, width: 5, height: 80 },
];

// =============================================================================
// COMPONENT
// =============================================================================

export function HandballCourtMap({ 
  events, 
  onZoneClick, 
  interactive = false,
  heatmapMode = true,
  className 
}: HandballCourtMapProps) {
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  /**
   * Calcula estatísticas de uma zona específica
   */
  const getZoneStats = (zoneId: string) => {
    const zoneEvents = events.filter(e => e.zone === zoneId);
    const total = zoneEvents.length;
    const success = zoneEvents.filter(e => e.success).length;
    const rate = total ? (success / total) * 100 : 0;
    return { 
      total, 
      success, 
      miss: total - success, 
      rate 
    };
  };

  /**
   * Calcula intensidade do heatmap (0-1)
   */
  const getHeatIntensity = (total: number) => {
    const maxEvents = Math.max(...COURT_ZONES.map(z => getZoneStats(z.id).total), 1);
    return Math.min(total / maxEvents, 1);
  };

  return (
    <div className={cn(
      'relative w-full bg-gradient-to-b from-blue-light-900 to-blue-light-950 rounded-lg overflow-hidden',
      'aspect-[2/1]',
      className
    )}>
      {/* Linhas da quadra */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none" 
        style={{ zIndex: 1 }}
        preserveAspectRatio="none"
      >
        {/* Linha de gol */}
        <line 
          x1="0%" 
          y1="95%" 
          x2="100%" 
          y2="95%" 
          stroke="white" 
          strokeWidth="3" 
          opacity="0.9" 
        />
        
        {/* Área de 6m (semicírculo) */}
        <path
          d="M 5% 70% Q 50% 25%, 95% 70%"
          stroke="white"
          strokeWidth="2"
          strokeDasharray="6 4"
          fill="none"
          opacity="0.6"
        />
        
        {/* Linha de 9m */}
        <path
          d="M 5% 95% Q 50% 70%, 95% 95%"
          stroke="white"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          fill="none"
          opacity="0.4"
        />
        
        {/* Linha central */}
        <line 
          x1="50%" 
          y1="0" 
          x2="50%" 
          y2="100%" 
          stroke="white" 
          strokeWidth="1" 
          opacity="0.2" 
        />
        
        {/* Área do goleiro */}
        <line x1="40%" y1="95%" x2="60%" y2="95%" stroke="white" strokeWidth="2" opacity="0.5" />
        <line x1="40%" y1="95%" x2="40%" y2="100%" stroke="white" strokeWidth="2" opacity="0.5" />
        <line x1="60%" y1="95%" x2="60%" y2="100%" stroke="white" strokeWidth="2" opacity="0.5" />
      </svg>

      {/* Zonas interativas */}
      <div className="relative w-full h-full" style={{ zIndex: 2 }}>
        {COURT_ZONES.map(zone => {
          const stats = getZoneStats(zone.id);
          const intensity = heatmapMode ? getHeatIntensity(stats.total) : 0;
          const isHovered = hoveredZone === zone.id;
          
          return (
            <button
              key={zone.id}
              className={cn(
                'absolute transition-all duration-200 rounded',
                'border border-white/20',
                interactive && 'hover:border-white/60 hover:scale-105 cursor-pointer',
                isHovered && 'border-white ring-2 ring-white/50 z-10',
                !interactive && 'cursor-default'
              )}
              style={{
                left: `${zone.x}%`,
                top: `${zone.y}%`,
                width: `${zone.width}%`,
                height: `${zone.height}%`,
                backgroundColor: heatmapMode 
                  ? `rgba(251, 146, 60, ${intensity * 0.5})` 
                  : 'rgba(255, 255, 255, 0.05)'
              }}
              onClick={() => interactive && onZoneClick?.(zone.id)}
              onMouseEnter={() => setHoveredZone(zone.id)}
              onMouseLeave={() => setHoveredZone(null)}
              disabled={!interactive}
              aria-label={`Zona ${zone.label}: ${stats.success}/${stats.total} conversões`}
            >
              <div className="flex flex-col items-center justify-center h-full text-white">
                <span className="text-xs font-semibold opacity-80">
                  {zone.label}
                </span>
                {stats.total > 0 && (
                  <div className="mt-1">
                    <div className="text-lg font-bold">
                      {stats.success}/{stats.total}
                    </div>
                    <div className="text-xs opacity-90">
                      {stats.rate.toFixed(0)}%
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Tooltip ao hover */}
      {hoveredZone && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-gray-900/95 backdrop-blur-sm text-white px-4 py-2 rounded-lg shadow-theme-lg z-20 pointer-events-none">
          {(() => {
            const zone = COURT_ZONES.find(z => z.id === hoveredZone);
            const stats = getZoneStats(hoveredZone);
            return (
              <div className="text-center">
                <div className="font-semibold text-sm">{zone?.label}</div>
                <div className="text-xs mt-1 space-x-3">
                  <span className="text-success-400">✓ {stats.success}</span>
                  <span className="text-error-400">✗ {stats.miss}</span>
                  <span className="text-gray-300">({stats.rate.toFixed(0)}%)</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
