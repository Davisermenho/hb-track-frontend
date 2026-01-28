'use client';

import { cn } from '@/lib/utils';
import { 
  CheckCircle, AlertCircle, Ban, Clock, 
  Activity, Zap 
} from 'lucide-react';

// =============================================================================
// TYPES
// =============================================================================

export type AthleteState = 'ativa' | 'dispensada' | 'arquivada';

export interface AthleteFlags {
  injured?: boolean;
  suspended_until?: string | null;
  medical_restriction?: boolean;
  load_restricted?: boolean;
}

interface StateBadgeProps {
  state: AthleteState;
  flags?: AthleteFlags;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
  className?: string;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const STATE_CONFIG = {
  ativa: {
    label: 'Ativa',
    icon: CheckCircle,
    className: 'bg-success-50 text-success-700 dark:bg-success-950 dark:text-success-400'
  },
  dispensada: {
    label: 'Dispensada',
    icon: Ban,
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  },
  arquivada: {
    label: 'Arquivada',
    icon: Ban,
    className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-500'
  }
} as const;

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-theme-xs px-2.5 py-1 gap-1.5',
  lg: 'text-theme-sm px-3 py-1.5 gap-2'
} as const;

const ICON_SIZES = {
  sm: 'size-3',
  md: 'size-3.5',
  lg: 'size-4'
} as const;

// =============================================================================
// COMPONENT
// =============================================================================

export function AthleteStateBadge({ 
  state, 
  flags, 
  size = 'md',
  variant = 'default',
  className 
}: StateBadgeProps) {
  const config = STATE_CONFIG[state];
  const Icon = config.icon;

  // Configuração de flags com validação de data para suspensão
  const flagsConfig = [
    {
      key: 'injured',
      label: 'Lesionada',
      icon: AlertCircle,
      className: 'bg-error-50 text-error-700 dark:bg-error-950 dark:text-error-400',
      condition: flags?.injured === true
    },
    {
      key: 'suspended',
      label: 'Suspensa',
      icon: Clock,
      className: 'bg-warning-50 text-warning-700 dark:bg-warning-950 dark:text-warning-400',
      condition: !!flags?.suspended_until && new Date(flags.suspended_until) > new Date()
    },
    {
      key: 'medical',
      label: 'Restrição Médica',
      icon: Activity,
      className: 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
      condition: flags?.medical_restriction === true
    },
    {
      key: 'load',
      label: 'Carga Restrita',
      icon: Zap,
      className: 'bg-blue-light-50 text-blue-light-700 dark:bg-blue-light-950 dark:text-blue-light-400',
      condition: flags?.load_restricted === true
    }
  ];

  const activeFlags = flagsConfig.filter(f => f.condition);

  // Variant compacto - apenas ícones
  if (variant === 'compact') {
    return (
      <div className={cn('inline-flex items-center gap-1', className)}>
        <span className={cn(
          'inline-flex items-center rounded-full font-medium',
          config.className,
          SIZE_CLASSES[size]
        )}>
          <Icon className={ICON_SIZES[size]} />
          {state !== 'ativa' && config.label}
        </span>
        
        {activeFlags.map(flag => {
          const FlagIcon = flag.icon;
          return (
            <span
              key={flag.key}
              className={cn(
                'inline-flex items-center rounded-full font-medium',
                flag.className,
                SIZE_CLASSES[size]
              )}
              title={flag.label}
            >
              <FlagIcon className={ICON_SIZES[size]} />
            </span>
          );
        })}
      </div>
    );
  }

  // Variant default - com labels
  return (
    <div className={cn('inline-flex flex-wrap items-center gap-1.5', className)}>
      <span className={cn(
        'inline-flex items-center rounded-full font-medium',
        config.className,
        SIZE_CLASSES[size]
      )}>
        <Icon className={ICON_SIZES[size]} />
        <span>{config.label}</span>
      </span>
      
      {activeFlags.map(flag => {
        const FlagIcon = flag.icon;
        return (
          <span
            key={flag.key}
            className={cn(
              'inline-flex items-center rounded-full font-medium',
              flag.className,
              SIZE_CLASSES[size]
            )}
          >
            <FlagIcon className={ICON_SIZES[size]} />
            <span>{flag.label}</span>
          </span>
        );
      })}
    </div>
  );
}
