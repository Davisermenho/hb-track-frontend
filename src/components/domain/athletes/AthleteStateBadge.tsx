'use client';

import { motion } from 'framer-motion';
import { CheckCircle, Ban, AlertCircle, Clock, Activity, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STATE_COLORS, FLAG_COLORS } from '@/lib/constants/colors';

type AthleteState = 'ativa' | 'dispensada' | 'arquivada';

interface AthleteFlags {
  injured?: boolean;
  suspended_until?: string | null;
  medical_restriction?: boolean;
  load_restricted?: boolean;
}

interface AthleteStateBadgeProps {
  state: AthleteState;
  flags?: AthleteFlags;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact';
}

const sizeClasses = {
  sm: 'text-xs px-2 py-0.5 gap-1',
  md: 'text-xs px-2.5 py-1 gap-1.5',
  lg: 'text-sm px-3 py-1.5 gap-2',
};

const iconSizes = {
  sm: 'size-3',
  md: 'size-3.5',
  lg: 'size-4',
};

const stateConfig = {
  ativa: {
    label: 'Ativa',
    icon: CheckCircle,
  },
  dispensada: {
    label: 'Dispensada',
    icon: Ban,
  },
  arquivada: {
    label: 'Arquivada',
    icon: Ban,
  },
};

const flagsConfig = [
  {
    key: 'injured',
    label: 'Lesionada',
    icon: AlertCircle,
    check: (flags?: AthleteFlags) => flags?.injured === true,
  },
  {
    key: 'suspended',
    label: 'Suspensa',
    icon: Clock,
    check: (flags?: AthleteFlags) =>
      !!flags?.suspended_until && new Date(flags.suspended_until) > new Date(),
  },
  {
    key: 'medical',
    label: 'Restrição Médica',
    icon: Activity,
    check: (flags?: AthleteFlags) => flags?.medical_restriction === true,
  },
  {
    key: 'load',
    label: 'Carga Limitada',
    icon: Zap,
    check: (flags?: AthleteFlags) => flags?.load_restricted === true,
  },
];

export function AthleteStateBadge({
  state,
  flags,
  size = 'md',
  variant = 'default',
}: AthleteStateBadgeProps) {
  const config = stateConfig[state];
  const StateIcon = config.icon;
  const activeFlags = flagsConfig.filter((f) => f.check(flags));
  const colors = STATE_COLORS[state];

  if (variant === 'compact') {
    return (
      <div className="inline-flex items-center gap-1">
        <motion.span
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={cn(
            'inline-flex items-center rounded-full font-medium',
            colors.bg,
            colors.text,
            sizeClasses[size]
          )}
        >
          <StateIcon className={iconSizes[size]} />
          {state === 'ativa' ? null : config.label}
        </motion.span>

        {activeFlags.map((flag, index) => {
          const FlagIcon = flag.icon;
          const flagKey = flag.key as keyof typeof FLAG_COLORS;
          const flagColors = FLAG_COLORS[flagKey];

          return (
            <motion.span
              key={flag.key}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'inline-flex items-center rounded-full font-medium',
                flagColors.bg,
                flagColors.text,
                sizeClasses[size]
              )}
            >
              <FlagIcon className={iconSizes[size]} />
            </motion.span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5">
      <motion.span
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          colors.bg,
          colors.text,
          sizeClasses[size]
        )}
      >
        <StateIcon className={iconSizes[size]} />
        <span>{config.label}</span>
      </motion.span>

      {activeFlags.map((flag, index) => {
        const FlagIcon = flag.icon;
        const flagKey = flag.key as keyof typeof FLAG_COLORS;
        const flagColors = FLAG_COLORS[flagKey];

        return (
          <motion.span
            key={flag.key}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'inline-flex items-center rounded-full font-medium',
              flagColors.bg,
              flagColors.text,
              sizeClasses[size]
            )}
          >
            <FlagIcon className={iconSizes[size]} />
            <span>{flag.label}</span>
          </motion.span>
        );
      })}
    </div>
  );
}